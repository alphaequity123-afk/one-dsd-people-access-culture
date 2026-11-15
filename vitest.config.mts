import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Root test config so `npm test` can run the whole suite: resolves the "@/" import alias and
// stubs "server-only" the same way the focused configs do. Component tests (.tsx) run in a
// simulated browser; everything else runs in Node. The *.test.cjs / *.test.mjs files under
// scripts/ are plain Node scripts run directly, not vitest suites, so they are not collected.
const alias = {
  "@": fileURLToPath(new URL("./", import.meta.url)),
  "server-only": fileURLToPath(new URL("./scripts/testing/server-only-stub.mjs", import.meta.url)),
};
const exclude = ["**/node_modules/**", "**/.next/**", "output/**", ".claude/**"];
const browserTs = ["lib/learning/clas-notes.test.ts"];

export default defineConfig({
  resolve: { alias },
  test: {
    testTimeout: 120000,
    projects: [
      { resolve: { alias }, test: { name: "components", environment: "jsdom", setupFiles: ["./scripts/testing/component-test-setup.ts"], include: ["**/*.test.tsx", ...browserTs], exclude, testTimeout: 120000 } },
      { resolve: { alias }, test: { name: "node", environment: "node", include: ["**/*.test.ts"], exclude: [...exclude, ...browserTs], testTimeout: 120000 } },
    ],
  },
});
