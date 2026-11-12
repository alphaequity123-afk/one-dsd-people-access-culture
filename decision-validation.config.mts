import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: {
    "@": fileURLToPath(new URL("./", import.meta.url)),
    "server-only": fileURLToPath(new URL("./scripts/testing/server-only-stub.mjs", import.meta.url)),
  } },
  test: { include: ["lib/intelligence/clone/jev.test.ts", "lib/intelligence/clone/hosted-voice.test.ts"], testTimeout: 10000 },
});
