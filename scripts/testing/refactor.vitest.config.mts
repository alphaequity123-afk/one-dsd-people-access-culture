import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
const root=fileURLToPath(new URL("../../",import.meta.url));
export default defineConfig({
  root,
  resolve:{alias:{"@":root,"server-only":fileURLToPath(new URL("./server-only-stub.mjs",import.meta.url))}},
  test:{environment:"jsdom",include:[
    "components/focused-sections.test.tsx","components/cat-catalog-pages.test.tsx",
    "components/course-topic-navigation.test.tsx",
    "lib/content/refinement.test.ts","lib/content/external-reading-body.test.ts","lib/content/external-readings.test.ts","lib/search/site-search.test.ts",
    "lib/intelligence/learning/resource-artifact-generation.test.ts",
    "lib/intelligence/learning/resource-learning-assistant.test.ts",
    "components/ask-voice.test.tsx","components/ask-client-sources.test.tsx",
    "components/cl-closing-sections.test.tsx",
  ],testTimeout:60000,fileParallelism:false},
});
