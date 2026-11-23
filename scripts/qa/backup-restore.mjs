// Production connection is used only by read-only SQL and pg_dump. Restore is
// hardwired to a disposable loopback cluster. Secrets arrive on hidden stdin.
import assert from "node:assert/strict";
import { createCipheriv, createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink, chmod } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";
const [modules,clientRoot,output]=process.argv.slice(2);
assert([modules,clientRoot,output].every(isAbsolute));
if(process.stdin.isTTY)spawnSync("stty",["-echo"],{stdio:"inherit"});
console.log("Ready for private backup input on stdin");
let input="";for await(const chunk of process.stdin){input+=chunk;if(input.includes("\n"))break;}
const {connectionString,encryptionKey}=JSON.parse(input);
assert(/^[0-9a-f]{64}$/.test(encryptionKey));
const sourceUrl=new URL(connectionString);assert(sourceUrl.protocol==="postgresql:"||sourceUrl.protocol==="postgres:");
const pg=(await import(pathToFileURL(join(modules,"pg/lib/index.js")))).default;
const binaries=await import(pathToFileURL(join(modules,"@embedded-postgres/linux-x64/dist/index.js")));
const work=await mkdtemp(join(tmpdir(),"portfolio-restore-"));await chmod(work,0o700);
const started=Date.now();let source,local,server;
const qid=value=>'"'+value.replaceAll('"','""')+'"';
async function inventory(client){
  const tables=(await client.query("SELECT schemaname,tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows;
  const result=[];
  for(const table of tables){
    const name=qid(table.schemaname)+"."+qid(table.tablename);
    const {rows:[row]}=await client.query(`SELECT count(*)::text AS rows,md5(coalesce(string_agg(digest,'' ORDER BY digest),'')) AS fingerprint FROM (SELECT md5(row_to_json(t)::text) AS digest FROM ${name} t) records`);
    result.push({table:table.tablename,...row});
  }
  return result;
}
async function run(file,args,env){
  const child=spawn(file,args,{env,stdio:["ignore","ignore","pipe"]});let error="";
  child.stderr.on("data",b=>error+=b);
  const timer=setTimeout(()=>child.kill("SIGTERM"),120000);
  const [code]=await once(child,"exit");clearTimeout(timer);
  if(code!==0){await writeFile(join(work,"private-error.log"),error,{mode:0o600});throw Error("Backup/restore command failed; private log retained until cleanup; no database contents printed");}
}
try{
  source=new pg.Client({connectionString,connectionTimeoutMillis:15000});await source.connect();
  await source.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");await source.query("SET LOCAL TIME ZONE 'UTC'");
  const {rows:[identity]}=await source.query("SELECT current_setting('neon.branch_id',true) AS branch, current_database() AS database,version(),transaction_timestamp() AS cutoff");
  assert.equal(identity.branch,"br-misty-wave-bb79bj7l");assert.equal(identity.database,"neondb");
  const {rows:[snapshot]}=await source.query("SELECT pg_export_snapshot() AS id");
  const before=await inventory(source);
  const roles=(await source.query("SELECT rolname,rolsuper,rolcreaterole,rolcreatedb,rolbypassrls FROM pg_roles WHERE rolname IN('portfolio_runtime','portfolio_migrator','neondb_owner') ORDER BY rolname")).rows;
  const grants=(await source.query("SELECT grantee,table_schema,table_name,privilege_type FROM information_schema.role_table_grants WHERE table_schema='public' AND grantee IN('portfolio_runtime','portfolio_migrator') ORDER BY 1,2,3,4")).rows;
  const clientEnv={PATH:process.env.PATH,LD_LIBRARY_PATH:join(clientRoot,"usr/lib/x86_64-linux-gnu"),
    PGHOST:sourceUrl.hostname,PGPORT:sourceUrl.port||"5432",PGUSER:decodeURIComponent(sourceUrl.username),
    PGPASSWORD:decodeURIComponent(sourceUrl.password),PGDATABASE:decodeURIComponent(sourceUrl.pathname.slice(1)),PGSSLMODE:"require",PGCONNECT_TIMEOUT:"15"};
  const dump=join(work,"production.dump");
  await run(join(clientRoot,"usr/lib/postgresql/18/bin/pg_dump"),["--format=custom","--schema=public","--no-owner","--snapshot="+snapshot.id,"--file="+dump],clientEnv);
  await source.query("COMMIT");await source.end();source=null;
  console.log("Current production backup captured from one read-only snapshot");
  const lib=join(work,"lib");await mkdir(lib);
  for(const name of ["libicuuc","libicui18n","libicudata"])await symlink(join(modules,"@embedded-postgres/linux-x64/native/lib",name+".so.60.2"),join(lib,name+".so.60"));
  const nativeEnv={PATH:process.env.PATH,TZ:"UTC",LD_LIBRARY_PATH:lib};
  const cluster=join(work,"database");const init=spawnSync(binaries.initdb,["-D",cluster,"-U","postgres","--auth-local=trust","--auth-host=trust","--no-locale","--encoding=UTF8"],{env:nativeEnv,encoding:"utf8"});assert.equal(init.status,0,"Local initdb failed");
  const probe=createServer();await new Promise(resolve=>probe.listen(0,"127.0.0.1",resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error("Local cluster startup timeout")),10000);
    server=spawn(binaries.postgres,["-D",cluster,"-h","127.0.0.1","-p",String(port),"-k","","-c","timezone=UTC"],{env:nativeEnv,stdio:["ignore","ignore","pipe"]});
    server.stderr.on("data",b=>{if(String(b).includes("ready to accept connections")){clearTimeout(timeout);resolve();}});server.once("error",reject);});
  local=new pg.Client({host:"127.0.0.1",port,user:"postgres",database:"postgres"});await local.connect();
  for(const role of roles)await local.query("CREATE ROLE "+qid(role.rolname)+" NOLOGIN");
  await local.query("CREATE DATABASE restored_portfolio");await local.end();
  await run(join(clientRoot,"usr/lib/postgresql/18/bin/pg_restore"),["--exit-on-error","--no-owner","--dbname=restored_portfolio",dump],
    {...clientEnv,PGHOST:"127.0.0.1",PGPORT:String(port),PGUSER:"postgres",PGPASSWORD:"",PGDATABASE:"restored_portfolio",PGSSLMODE:"disable"});
  local=new pg.Client({host:"127.0.0.1",port,user:"postgres",database:"restored_portfolio"});await local.connect();await local.query("SET TIME ZONE 'UTC'");
  assert.deepEqual(await inventory(local),before,"Restored row counts/fingerprints differ");
  const restoredGrants=(await local.query("SELECT grantee,table_schema,table_name,privilege_type FROM information_schema.role_table_grants WHERE table_schema='public' AND grantee IN('portfolio_runtime','portfolio_migrator') ORDER BY 1,2,3,4")).rows;
  assert.deepEqual(restoredGrants,grants,"Restored application grants differ");
  const bytes=await readFile(dump);const iv=(await import("node:crypto")).randomBytes(12);
  const cipher=createCipheriv("aes-256-gcm",Buffer.from(encryptionKey,"hex"),iv);
  const encrypted=Buffer.concat([Buffer.from("CPFBAK01"),iv,cipher.update(bytes),cipher.final(),cipher.getAuthTag()]);
  await mkdir(output,{recursive:true});
  await writeFile(join(output,"ChrispinePortfolio_Production_2026-11-23.dump.aes"),encrypted,{mode:0o600});
  const manifest={status:"PASS_RESTORED_LOCAL",recordedAt:new Date().toISOString(),source:identity,
    encryption:"AES-256-GCM: CPFBAK01 | 12-byte nonce | ciphertext | 16-byte tag",keyCustody:"Vercel development environment PORTFOLIO_BACKUP_KEY_20261123",
    plaintextSha256:createHash("sha256").update(bytes).digest("hex"),encryptedSha256:createHash("sha256").update(encrypted).digest("hex"),
    tables:before,roles,tableGrantsVerified:true,restoreTarget:"disposable loopback PostgreSQL 18; production never restored",
    snapshotConsistent:true,scope:"public application schema/data including migration history, financial receipts and audit; provider-managed schemas and external media excluded",
    durationSeconds:Math.round((Date.now()-started)/1000),productionWrites:false,realProviderCalls:false};
  await writeFile(join(output,"backup-restore-proof.json"),JSON.stringify(manifest,null,2)+"\n");
  console.log(JSON.stringify({status:manifest.status,tables:before.length,bytes:bytes.length,durationSeconds:manifest.durationSeconds,productionWrites:false}));
}catch(error){console.error(JSON.stringify({status:"FAILED",reason:error.code??error.message?.slice(0,160)}));process.exitCode=1;}
finally{await source?.end().catch(()=>{});await local?.end().catch(()=>{});if(server&&server.exitCode===null){const stopped=once(server,"exit");server.kill("SIGINT");await stopped;}await rm(work,{recursive:true,force:true});}
