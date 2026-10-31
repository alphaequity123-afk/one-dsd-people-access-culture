// Runs the site's explicit maintenance builds (files deliberately not named *.test.ts), one at a time.
// Usage, from the site folder: npm test -- --config scripts/testing/vitest.maintenance.config.mts <maintenance file>
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export default defineConfig({
  root,
  resolve: { alias: { "@": root, "server-only": path.join(root, "scripts/testing/server-only-stub.mjs") } },
  test: {
    include: ["scripts/search/prepare-public-index.ts", "scripts/corpus/*.maintenance.ts"],
    testTimeout: 60 * 60 * 1000,
    hookTimeout: 60 * 60 * 1000,
    environment: "node",
    pool: "forks",
    fileParallelism: false,
  },
});
