// Generates guarded, reviewable migration SQL. Does not open a database.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadMigrations } from "../migrations/runner.js";
import { canonicalJson } from "../migrations/schema.js";
import { pendingBatch, databaseRolePolicy, migrationStatements, type BatchTarget } from "../migrations/connector-batch.js";
const [environment,branchId,destination]=process.argv.slice(2);
if(!["preview","production"].includes(environment)||!destination)throw Error("Supply preview|production, explicit branch ID and destination");
const root="docs/production-readiness/commercial-hardening-2026-11-23/";
const read=async(name:string)=>JSON.parse(await readFile(root+name+".json","utf8"));
const files=await loadMigrations("migrations"),prefix=await read("prefix-baseline"),current=await read("reference-baseline");
const before=await read("prefix-catalog"),after=await read("reference-catalog");
if(files.length!==14||files[13].file!=="0013_commercial_boundaries.sql"||
  canonicalJson(files.slice(0,13).map(({file,sha256})=>({file,sha256})))!==canonicalJson(prefix.migrations)||
  canonicalJson(files.map(({file,sha256})=>({file,sha256})))!==canonicalJson(current.migrations))throw Error("Source/reference mismatch");
const target:BatchTarget={environment:environment as "preview"|"production",branchId,database:"neondb",migrationRole:"portfolio_migrator",runtimeRole:"portfolio_runtime"};
await mkdir(destination,{recursive:true});
for(const[name,sql]of[["apply-pending",pendingBatch(target,files.slice(0,13),files.slice(13),before,after)],["roles-after",databaseRolePolicy(target,after)]]){
  const statements=migrationStatements(sql);
  await writeFile(resolve(destination,name+".json"),JSON.stringify(statements)+"\n");
  await writeFile(resolve(destination,name+".sql"),"BEGIN;\n"+statements.join(";\n")+";\nCOMMIT;\n");
}
console.log(JSON.stringify({environment,branchId,migration:files[13].file,executed:false}));
