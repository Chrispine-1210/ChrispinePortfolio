import { build } from "esbuild";
import { builtinModules } from "node:module";
import { readFile } from "node:fs/promises";
const lock = JSON.parse(
  await readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
);
const result = await build({
  entryPoints: ["api/index.ts", "server/index.ts"],
  outdir: ".runtime-verification",
  write: false,
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  metafile: true,
  logLevel: "silent",
});
const builtins = new Set(builtinModules),
  external = new Set(),
  blocked = [];
for (const output of Object.values(result.metafile.outputs))
  for (const entry of output.imports) {
    if (!entry.external) continue;
    const name = entry.path;
    if (name.startsWith("node:") || builtins.has(name)) continue;
    const root = name.startsWith("@")
      ? name.split("/").slice(0, 2).join("/")
      : name.split("/")[0];
    const pkg = lock.packages?.["node_modules/" + root];
    external.add(root);
    if (!pkg || pkg.dev === true) blocked.push(name);
  }
if (blocked.length)
  throw new Error(
    "Production entrypoint imports development-only or unclassified dependencies: " +
      [...new Set(blocked)].join(", "),
  );
console.log(
  JSON.stringify(
    {
      passed: true,
      entrypoints: ["api/index.ts", "server/index.ts"],
      externalRuntimePackages: [...external].sort(),
      note: "Development Vite is dynamically loaded only by the development-mode server branch.",
    },
    null,
    2,
  ),
);
