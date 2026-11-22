import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: ".",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  test: {
    environment: "node",
    // Each database suite owns a PostgreSQL WASM runtime. Bound their combined
    // memory on small local/build machines without skipping any verification.
    maxWorkers: 2,
    include: ["server/**/*.test.ts"],
    hookTimeout: 30_000,
    clearMocks: true,
    restoreMocks: true,
  },
});
