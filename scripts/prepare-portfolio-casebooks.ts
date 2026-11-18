import { readFile, writeFile } from "node:fs/promises";
import { casebooksSql, type CasebookCatalogue } from "./portfolio-casebooks-sql.js";

const [cataloguePath, expectedPath, outputPath] = process.argv.slice(2);
if (!cataloguePath || !expectedPath || !outputPath) {
  throw new Error("Usage: tsx scripts/prepare-portfolio-casebooks.ts CATALOGUE.json EXPECTED_VERSIONS.json OUTPUT.sql");
}
const catalogue: CasebookCatalogue = JSON.parse(await readFile(cataloguePath, "utf8"));
const expected: Record<string, string> = JSON.parse(await readFile(expectedPath, "utf8"));
await writeFile(outputPath, casebooksSql(catalogue, expected), { mode: 0o600 });
process.stdout.write(`Prepared ${catalogue.caseStudies.length} reviewed editorial records. SQL has not been executed.\n`);
