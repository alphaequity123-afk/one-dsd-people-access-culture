import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
const root = process.cwd();
export default defineConfig({
  resolve: { alias: { "server-only": resolve(root, "scripts/testing/server-only-stub.mjs"), "@": root } },
  test: { environment: "node", include: ["lib/intelligence/retrieval/public-resource-media-postgres.test.ts"] },
});
