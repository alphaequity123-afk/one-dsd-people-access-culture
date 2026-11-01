import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
const root = process.cwd();
export default defineConfig({
  resolve: { alias: { "server-only": resolve(root, "scripts/testing/server-only-stub.mjs"), "@": root } },
  test: { environment: "jsdom", include: ["lib/intelligence/retrieval/public-resource-media.test.ts", "lib/intelligence/clone/public-resource-media-currentness.test.ts"], testTimeout: 120000, hookTimeout: 120000 },
});
