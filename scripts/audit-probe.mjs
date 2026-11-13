import { spawnSync } from "node:child_process";

const audit = spawnSync("npm", ["audit", "--omit=dev", "--json"], { encoding: "utf8" });
let report = {};
try { report = JSON.parse(audit.stdout || "{}"); } catch { process.exit(2); }
const high = Object.entries(report.vulnerabilities || {})
  .filter(([, value]) => ["high", "critical"].includes(value?.severity))
  .map(([name]) => name);
const probe = ["axios","body-parser","proxy-addr","qs","path-to-regexp","lodash","ws","jsonwebtoken","jws","jwa","send","serve-static","cookie","postcss","braces","micromatch"];
process.exit(high.some((name) => probe.includes(name)) ? 0 : 1);
