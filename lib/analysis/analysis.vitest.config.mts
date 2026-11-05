// Tests for the staff "Analyze a document" workspace: the contract, service, instruments,
// routes, page and components. The "@" alias and the "server-only" stand-in are set here
// because the site has no root vitest config.
// Usage, from the site folder: node scripts/testing/run-tests.mjs --config lib/analysis/analysis.vitest.config.mts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../", import.meta.url));
export default defineConfig({
  root,
  resolve: { alias: { "@": root, "server-only": fileURLToPath(new URL("../../scripts/testing/server-only-stub.mjs", import.meta.url)) } },
  test: {
    // Each file names its own environment with a @vitest-environment directive; jsdom is the default for the components.
    environment: "jsdom",
    include: [
      "lib/analysis/*.test.ts",
      "components/analysis/*.test.tsx",
      "app/api/analyze/**/*.test.ts",
      "app/equity-review/analyze/*.test.tsx",
    ],
    pool: "forks",
  },
});
