import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: {
    "@": fileURLToPath(new URL("../../../", import.meta.url)),
    "server-only": fileURLToPath(new URL("../../../scripts/testing/server-only-stub.mjs", import.meta.url)),
  } },
  test: { include: ["lib/intelligence/learning/*.test.ts"] },
});
