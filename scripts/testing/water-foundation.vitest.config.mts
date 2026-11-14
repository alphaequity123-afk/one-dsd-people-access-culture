import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../", import.meta.url));
export default defineConfig({
  root,
  resolve: { alias: { "@": root, "server-only": fileURLToPath(new URL("./server-only-stub.mjs", import.meta.url)) } },
  test: { environment: "jsdom", include: ["components/water-foundation-course.test.tsx"], fileParallelism: false },
});
