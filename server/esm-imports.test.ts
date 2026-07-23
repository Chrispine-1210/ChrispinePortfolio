import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_ROOTS = ["api", "server", "shared", "scripts"];
const RUNTIME_EXTENSION = /\.(?:js|json|node|css|svg|png|jpe?g|webp|gif|woff2?)(?:[?#].*)?$/;
const RELATIVE_IMPORT = /(?:from\s+|import\s*\()(["'])(\.{1,2}\/[^"']+)\1/g;

async function collectTypeScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectTypeScriptFiles(filePath);
    return /\.tsx?$/.test(entry.name) ? [filePath] : [];
  }));
  return nested.flat();
}

describe("native ESM runtime imports", () => {
  it("uses explicit runtime extensions for every relative TypeScript import", async () => {
    const files = (await Promise.all(SOURCE_ROOTS.map(collectTypeScriptFiles))).flat();
    const violations: string[] = [];

    for (const file of files) {
      const source = await readFile(file, "utf8");
      for (const match of source.matchAll(RELATIVE_IMPORT)) {
        const specifier = match[2];
        if (specifier && !RUNTIME_EXTENSION.test(specifier)) {
          violations.push(`${file}: ${specifier}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
