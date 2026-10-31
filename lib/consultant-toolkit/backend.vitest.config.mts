import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("../../", import.meta.url)) } },
  test: { environment: "node", include: ["lib/consultant-toolkit/backend.test.ts", "lib/consultant-toolkit/program-context.test.ts"] },
});
