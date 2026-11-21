import { build } from "esbuild";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

if (process.env.VERCEL || process.env.NODE_ENV === "production") {
  throw new Error(
    "The synthetic review fixture cannot run in a production environment",
  );
}
const root = fileURLToPath(new URL("../../", import.meta.url));
const output = path.join(root, ".qa-preview");
const source = path.join(root, "scripts/qa/engineering-preview");
const args = process.argv.slice(2);
const portIndex = args.indexOf("--port");
const port = portIndex >= 0 ? Number(args[portIndex + 1]) : 4173;
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("Invalid QA port");
await mkdir(output, { recursive: true });
await writeFile(
  path.join(output, "package.json"),
  '{"private":true,"type":"module"}\n',
);
await build({
  entryPoints: [path.join(source, "entry.ts")],
  outfile: path.join(output, "server.mjs"),
  bundle: true,
  platform: "node",
  packages: "external",
  format: "esm",
  tsconfig: path.join(root, "tsconfig.json"),
  plugins: [
    {
      name: "isolated-qa-database",
      setup(b) {
        b.onResolve({ filter: /db\.js$/ }, (a) =>
          path.resolve(a.resolveDir, a.path) === path.join(root, "server/db.js")
            ? { path: path.join(source, "database.ts") }
            : null,
        );
      },
    },
  ],
});
await rm(path.join(output, "public"), { recursive: true, force: true });
await cp(path.join(root, "dist/public"), path.join(output, "public"), {
  recursive: true,
});
if (args.includes("--build-only")) {
  console.log(
    "Isolated QA bundle prepared; no server or review session started",
  );
} else {
  for (const key of Object.keys(process.env)) {
    if (
      /^(STRIPE_|POSTMARK_|TWILIO_|VAPID_|BOOTSTRAP_|ADMIN_|AUTH_|DATABASE_URL$|APP_DATABASE_URL$|PUBLIC_WEBHOOK_BASE_URL$|NOTIFICATION_WORKER_SECRET$|CRON_SECRET$)/.test(
        key,
      )
    )
      delete process.env[key];
  }
  Object.assign(process.env, {
    NODE_ENV: "test",
    ENGINEERING_QA_FIXTURE: "isolated-pglite-only",
    ADMIN_AUTH_MODE: "database",
    EMAIL_PROVIDER: "disabled",
    DATABASE_URL: "postgresql://qa:qa@localhost/isolated-fixture",
    AUTH_KEY_PEPPER: randomBytes(32).toString("hex"),
    APP_BASE_URL: `http://127.0.0.1:${port}`,
    PORT: String(port),
    QA_PROJECT_ROOT: root,
  });
  await import(pathToFileURL(path.join(output, "server.mjs")).href);
}
