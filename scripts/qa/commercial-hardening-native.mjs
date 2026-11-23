// Local, disposable PostgreSQL only. No production URL or provider credentials.
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, readFile, mkdir, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
if (process.env.VERCEL || process.env.NODE_ENV === "production") throw Error("Local QA only");
const modules = process.argv[2];
if (!modules || !isAbsolute(modules)) throw Error("Supply an absolute external QA modules directory");
const binaries = await import(pathToFileURL(join(modules,"@embedded-postgres/linux-x64/dist/index.js")).href);
const pg = (await import(pathToFileURL(join(modules,"pg/lib/index.js")).href)).default;
const directory=await mkdtemp(join(tmpdir(),"portfolio-commercial-qa-"));
let server,admin;
try{
  const libraries=join(directory,"lib");await mkdir(libraries);
  for(const name of ["libicuuc","libicui18n","libicudata"])await symlink(join(modules,"@embedded-postgres/linux-x64/native/lib",`${name}.so.60.2`),join(libraries,`${name}.so.60`));
  const nativeEnvironment={PATH:process.env.PATH,TZ:"UTC",LD_LIBRARY_PATH:libraries};
  const probe=createServer();await new Promise((yes,no)=>{probe.once("error",no);probe.listen(0,"127.0.0.1",yes);});
  const port=probe.address().port;await new Promise(yes=>probe.close(yes));
  const cluster=join(directory,"database");
  const initialized=spawnSync(binaries.initdb,["-D",cluster,"-U","postgres","--auth-local=trust","--auth-host=trust","--no-locale","--encoding=UTF8"],{encoding:"utf8",timeout:30000,env:nativeEnvironment});
  assert.equal(initialized.status,0,initialized.stderr);
  await new Promise((yes,no)=>{const timer=setTimeout(()=>no(Error("Startup deadline")),10000);
    server=spawn(binaries.postgres,["-D",cluster,"-h","127.0.0.1","-p",String(port),"-k","","-c","timezone=UTC"],{stdio:["ignore","ignore","pipe"],env:nativeEnvironment});
    server.stderr.on("data",b=>{if(String(b).includes("ready to accept connections")){clearTimeout(timer);yes();}});server.once("error",no);});
  admin=new pg.Client({host:"127.0.0.1",port,user:"postgres",database:"postgres"});await admin.connect();
  await admin.query("CREATE DATABASE commercial_qa");await admin.query("CREATE DATABASE financial_qa");
  const config=join(directory,"vitest.config.mts");
  await writeFile(config,`import base from ${JSON.stringify(resolve("vitest.config.ts"))};\nexport default {...base,test:{...base.test,server:{deps:{inline:[/drizzle-orm/]}}},resolve:{...base.resolve,alias:{...base.resolve.alias,pg:${JSON.stringify(join(modules,"pg/lib/index.js"))}}}};\n`);
  const results=[];
  for(const [file,reopen] of [["server/commercial-boundaries.test.ts",false],["server/financial-idempotency.test.ts",false],["server/financial-idempotency-restart.test.ts",true]]){
    const report=join(directory,`${results.length}.json`);
    const child=spawn(process.execPath,["node_modules/vitest/vitest.mjs","run","--config",config,file,"--reporter=json","--outputFile",report],{cwd:process.cwd(),
      env:{PATH:process.env.PATH,TZ:"UTC",HARDENING_NATIVE_PORT:String(port),HARDENING_NATIVE_QA:"disposable-loopback",FINANCIAL_NATIVE_PORT:String(port),FINANCIAL_NATIVE_QA:"disposable-loopback",FINANCIAL_NATIVE_REOPEN:reopen?"1":"0"},stdio:["ignore","pipe","pipe"]});
    let log="";child.stdout.on("data",b=>log+=b);child.stderr.on("data",b=>log+=b);
    const timer=setTimeout(()=>child.kill("SIGTERM"),120000);const[code]=await once(child,"exit");clearTimeout(timer);
    const result=JSON.parse(await readFile(report,"utf8").catch(()=>"{}"));
    assert.equal(code,0,log+JSON.stringify(result));assert.equal(result.numFailedTests,0);assert.equal(result.numPendingTests,0);results.push(result);
  }
  const proof={decision:"PASS",recordedAt:new Date().toISOString(),postgres:(await admin.query("SELECT version()")).rows[0].version,
    testsPassed:results.reduce((n,result)=>n+result.numPassedTests,0),checks:results.flatMap(result=>result.testResults.flatMap(suite=>suite.assertionResults.map(check=>check.fullName))),
    independentSessions:true,actualProcessRestart:true,actualHttpDisconnect:true,productionDataUsed:false,realProviderCalls:false,githubHosted:false};
  const output="docs/production-readiness/commercial-hardening-2026-11-23";await mkdir(output,{recursive:true});
  await writeFile(join(output,"native-proof.json"),JSON.stringify(proof,null,2)+"\n");console.log(JSON.stringify(proof));
}finally{
  await admin?.end().catch(()=>{});
  if(server&&server.exitCode===null){const stopped=once(server,"exit");server.kill("SIGINT");await stopped;}
  await rm(directory,{recursive:true,force:true});
}
