import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: {
    "@": fileURLToPath(new URL("../../", import.meta.url)),
    "server-only": fileURLToPath(new URL("./server-only-stub.mjs", import.meta.url)),
  } },
  test: { include: [
    "lib/intelligence/providers/*.test.ts",
    "lib/intelligence/research-preference.test.ts",
    "lib/intelligence/clone/route.test.ts",
    "lib/intelligence/retrieval/answer-review.test.ts",
    "lib/intelligence/retrieval/verified-draft.test.ts",
    "lib/intelligence/retrieval/generated-evidence.test.ts",
    "lib/intelligence/retrieval/evidence-passages.test.ts",
    "lib/intelligence/retrieval/named-source-coverage.test.ts",
    "lib/ask/source-links.test.ts",
    "lib/ask/progress-stream.test.ts",
  ], testTimeout: 15000 },
});
