// Reviewable forward batches from the deployed 13-file history to this candidate.
// Source-only tool: no credentials, connection, migration or provider activation.
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {loadMigrations} from "../migrations/runner.js";
import {canonicalJson} from "../migrations/schema.js";
import {pendingBatch,databaseRolePolicy,migrationStatements,type BatchTarget} from "../migrations/connector-batch.js";
const[environment,branchId,destination]=process.argv.slice(2);
if(!["preview","production"].includes(environment)||!destination)throw Error("Supply preview|production, explicit branch ID and destination");
const root="docs/production-readiness/portfolio-evolution-2026-11-23/";
const previous="docs/production-readiness/financial-idempotency-2026-11-22/";
const read=async(path:string)=>JSON.parse(await readFile(path,"utf8"));
const files=await loadMigrations("migrations"),before=await read(previous+"reference-catalog.json"),prefix=await read(previous+"reference-baseline.json"),after=await read(root+"reference-catalog.json"),current=await read(root+"reference-baseline.json");
if(files.length!==15||files[13].file!=="0013_commercial_boundaries.sql"||files[14].file!=="0014_account_recovery_and_intake.sql"||canonicalJson(files.slice(0,13).map(({file,sha256})=>({file,sha256})))!==canonicalJson(prefix.migrations)||canonicalJson(files.map(({file,sha256})=>({file,sha256})))!==canonicalJson(current.migrations))throw Error("Source/reference mismatch");
const target:BatchTarget={environment:environment as "preview"|"production",branchId,database:"neondb",migrationRole:"portfolio_migrator",runtimeRole:"portfolio_runtime"};
await mkdir(destination,{recursive:true});
for(const[name,sql]of[["apply-pending",pendingBatch(target,files.slice(0,13),files.slice(13),before,after)],["roles-after",databaseRolePolicy(target,after)]]){
 const statements=migrationStatements(sql);await writeFile(resolve(destination,name+".json"),JSON.stringify(statements)+"\n");await writeFile(resolve(destination,name+".sql"),"BEGIN;\n"+statements.join(";\n")+";\nCOMMIT;\n");
}
console.log(JSON.stringify({environment,branchId,pending:files.slice(13).map(file=>file.file),executed:false}));
