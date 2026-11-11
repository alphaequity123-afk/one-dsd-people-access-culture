// Tests for the Ask window (2026-11-11): Ask in the main menu where Support was, the Ask window on the
// landing page, the icon voice controls and the user guide that describes them. The "@" alias and the
// "server-only" stand-in are set here because the site has no root vitest config.
// Usage, from the site folder: node scripts/testing/run-tests.mjs --config lib/program/ask-window.vitest.config.mts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../", import.meta.url));
export default defineConfig({
  root,
  resolve: { alias: { "@": root, "server-only": fileURLToPath(new URL("../../scripts/testing/server-only-stub.mjs", import.meta.url)) } },
  test: {
    environment: "jsdom",
    include: [
      "components/ask-voice.test.tsx",
      "components/ask-client-sources.test.tsx",
      "components/home-ask.test.tsx",
      "components/user-guide.test.tsx",
      "lib/intelligence/clone/response-mode-client.test.ts",
      "lib/program/page-purpose.test.ts",
      "lib/content/collections.test.ts",
    ],
    testTimeout: 60000,
    pool: "forks",
  },
});
