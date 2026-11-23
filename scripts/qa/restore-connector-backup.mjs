// A connector-exported READ ONLY snapshot is encrypted and restored only into
// disposable loopback PostgreSQL. No external URL is accepted by this utility.
import assert from "node:assert/strict";
import { createCipheriv,createDecipheriv,createHash,randomBytes } from "node:crypto";
import { spawn,spawnSync } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { mkdtemp,mkdir,readFile,writeFile,rm,symlink,chmod,readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join,isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";
import { schemaCatalogSql,canonicalJson } from "../migrations/schema.ts";
const [modules,output]=process.argv.slice(2);assert([modules,output].every(isAbsolute));
if(process.stdin.isTTY)spawnSync("stty",["-echo","-icanon","min","1","time","0"],{stdio:"inherit"});
console.log("Ready for private snapshot input on stdin");
let input="";for await(const chunk of process.stdin){input+=chunk;if(input.endsWith("\n"))break;}
const payload=JSON.parse(input);input="";const {encryptionKey}=payload;assert(/^[a-f0-9]{64}$/.test(encryptionKey));
let backup=payload.backup;
if(payload.encryptedPath){assert(isAbsolute(payload.encryptedPath));const bytes=await readFile(payload.encryptedPath);
  assert.equal(bytes.subarray(0,8).toString(),"CPFBAK02");const decipher=createDecipheriv("aes-256-gcm",Buffer.from(encryptionKey,"hex"),bytes.subarray(8,20));
  decipher.setAuthTag(bytes.subarray(-16));backup=JSON.parse(Buffer.concat([decipher.update(bytes.subarray(20,-16)),decipher.final()]).toString());
}
assert(backup.data.every(row=>!row.truncated));const results=backup.data;
const source=results[2].rows[0],catalog=results[3].rows;
assert.equal(source.branch,"br-misty-wave-bb79bj7l");assert.equal(source.database,"neondb");
const tables=results.flatMap(result=>result.rows.filter(row=>row.backup_table).map(row=>row.backup_table));
const grants=results.at(-2).rows,roles=results.at(-1).rows;
const history=tables.find(t=>t.schema==="chrispine_migrations"&&t.table==="history");assert(history);
const plain=Buffer.from(JSON.stringify(backup));const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",Buffer.from(encryptionKey,"hex"),iv);
const encrypted=Buffer.concat([Buffer.from("CPFBAK02"),iv,cipher.update(plain),cipher.final(),cipher.getAuthTag()]);
await mkdir(output,{recursive:true});await chmod(output,0o700);
await writeFile(join(output,"ChrispinePortfolio_Production_2026-11-23.backup.aes"),encrypted,{mode:0o600});
console.log("Current consistent production snapshot encrypted; beginning isolated restore");
const pg=(await import(pathToFileURL(join(modules,"pg/lib/index.js")))).default;
const binaries=await import(pathToFileURL(join(modules,"@embedded-postgres/linux-x64/dist/index.js")));
const work=await mkdtemp(join(tmpdir(),"portfolio-connector-restore-"));await chmod(work,0o700);
const qid=value=>'"'+value.replaceAll('"','""')+'"';let server,client;const started=Date.now();
try{
  const lib=join(work,"lib");await mkdir(lib);for(const name of ["libicuuc","libicui18n","libicudata"])await symlink(join(modules,"@embedded-postgres/linux-x64/native/lib",name+".so.60.2"),join(lib,name+".so.60"));
  const env={PATH:process.env.PATH,TZ:"UTC",LD_LIBRARY_PATH:lib};const cluster=join(work,"database");
  assert.equal(spawnSync(binaries.initdb,["-D",cluster,"-U","postgres","--auth-local=trust","--auth-host=trust","--no-locale","--encoding=UTF8"],{env,encoding:"utf8"}).status,0);
  const probe=createServer();await new Promise(resolve=>probe.listen(0,"127.0.0.1",resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error("Startup timeout")),10000);server=spawn(binaries.postgres,["-D",cluster,"-h","127.0.0.1","-p",String(port),"-k","","-c","timezone=UTC"],{env,stdio:["ignore","ignore","pipe"]});server.stderr.on("data",b=>{if(String(b).includes("ready to accept connections")){clearTimeout(timer);resolve();}});server.once("error",reject);});
  client=new pg.Client({host:"127.0.0.1",port,user:"postgres",database:"postgres"});await client.connect();await client.query("SET TIME ZONE 'UTC'");
  for(const role of roles)await client.query("CREATE ROLE "+qid(role.rolname)+" NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS");
  const migrations=(await readdir("migrations")).filter(file=>/^\d{4}_.*\.sql$/.test(file)).sort();
  for(const row of history.rows.map(row=>JSON.parse(row)).sort((a,b)=>a.file.localeCompare(b.file))){
    assert(migrations.includes(row.file));const sql=await readFile(join("migrations",row.file),"utf8");
    assert.equal(createHash("sha256").update(sql).digest("hex"),row.sha256);await client.query(sql);
  }
  await client.query("CREATE SCHEMA chrispine_migrations; CREATE TABLE chrispine_migrations.history(file text PRIMARY KEY,sha256 text NOT NULL,origin text NOT NULL,recorded_at timestamptz NOT NULL DEFAULT now())");
  await client.query("BEGIN; SET LOCAL session_replication_role='replica'");
  await client.query("TRUNCATE "+tables.map(t=>qid(t.schema)+"."+qid(t.table)).join(",")+" CASCADE");
  for(const table of tables){if(!table.rows.length)continue;const name=qid(table.schema)+"."+qid(table.table);
    // Rows remain original JSON text, preserving numeric and bytea precision.
    await client.query(`INSERT INTO ${name} SELECT * FROM json_populate_recordset(NULL::${name},$1::json)`,["["+table.rows.join(",")+"]"]);
  }
  await client.query("COMMIT");
  const checks=[];for(const table of tables){const name=qid(table.schema)+"."+qid(table.table);
    const {rows:[row]}=await client.query(`SELECT count(*)::int AS rows,md5(coalesce(string_agg(md5(row_to_json(t)::text),'' ORDER BY md5(row_to_json(t)::text)),'')) AS fingerprint FROM ${name} t`);
    assert.equal(row.rows,table.rows.length,"Restored row count mismatch: "+table.table);assert.equal(row.fingerprint,table.fingerprint,"Restored content mismatch: "+table.table);
    checks.push({schema:table.schema,table:table.table,rows:row.rows,fingerprintMatches:true});
  }
  assert.equal(canonicalJson((await client.query(schemaCatalogSql)).rows),canonicalJson(catalog),"Restored application schema differs");
  for(const role of roles)await client.query("GRANT USAGE ON SCHEMA public TO "+qid(role.rolname));
  for(const grant of grants){assert(/^[A-Z ]+$/.test(grant.privilege_type));await client.query("GRANT "+grant.privilege_type+" ON "+qid(grant.table_schema)+"."+qid(grant.table_name)+" TO "+qid(grant.grantee));}
  const restoredGrants=(await client.query("SELECT grantee,table_schema,table_name,privilege_type FROM information_schema.role_table_grants WHERE table_schema='public' AND grantee IN('portfolio_runtime','portfolio_migrator') ORDER BY 1,2,3,4")).rows;
  assert.deepEqual(restoredGrants,grants);
  const proof={status:"PASS_RESTORED_LOCAL",recordedAt:new Date().toISOString(),source,restoreVersion:(await client.query("SELECT version()")).rows[0].version,
    tableCount:tables.length,tables:checks,schemaCatalogMatches:true,tableGrantsMatch:true,migrationHistoryCount:history.rows.length,
    sourceSnapshot:"single repeatable-read read-only connector transaction",productionWrites:false,realProviderCalls:false,
    keyCustody:"Vercel development environment PORTFOLIO_BACKUP_KEY_20261123",backupFormat:"CPFBAK02 | 12-byte nonce | AES-256-GCM encrypted UTF-8 connector snapshot JSON | 16-byte tag",
    encryptedSha256:createHash("sha256").update(encrypted).digest("hex"),restoreDurationSeconds:Math.round((Date.now()-started)/1000),
    scope:"public application schema/data and chrispine_migrations history; external media, provider-managed schemas and login passwords excluded; roles restored NOLOGIN",
    limitations:["Local restore, not a Neon failover rehearsal","External media and service secret custody must be maintained separately","RPO/RTO service objectives and recurring backup schedule are not inferred"]};
  await writeFile(join(output,"backup-restore-proof.json"),JSON.stringify(proof,null,2)+"\n");console.log(JSON.stringify({status:proof.status,tables:proof.tableCount,schemaMatch:true,grantsMatch:true,restoreSeconds:proof.restoreDurationSeconds}));
}catch(error){console.error(JSON.stringify({status:"FAILED_RESTORE",reason:error.code??error.message?.slice(0,180)}));process.exitCode=1;}
finally{await client?.end().catch(()=>{});if(server&&server.exitCode===null){const stopped=once(server,"exit");server.kill("SIGINT");await stopped;}await rm(work,{recursive:true,force:true});}
