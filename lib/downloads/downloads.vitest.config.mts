// Tests for self-directed course downloads and the consultant-only "Analyze in the Equity
// Analysis Toolkit" link. The "@" alias and the "server-only" stand-in are set here because
// the site has no root vitest config.
// Usage, from the site folder: node scripts/testing/run-tests.mjs --config lib/downloads/downloads.vitest.config.mts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../", import.meta.url));
export default defineConfig({
  root,
  resolve: { alias: { "@": root, "server-only": fileURLToPath(new URL("../../scripts/testing/server-only-stub.mjs", import.meta.url)) } },
  test: {
    // Component files name jsdom with a @vitest-environment directive.
    environment: "node",
    include: [
      "lib/downloads/adapters/self-directed.test.ts",
      "lib/consultant-toolkit/linked-source.test.ts",
      "components/analyze-in-toolkit-link.test.tsx",
      "app/api/consultant/session/route.test.ts",
    ],
    pool: "forks",
  },
});
