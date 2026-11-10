import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({ resolve: { alias: { "@": fileURLToPath(new URL("../../", import.meta.url)), "server-only": fileURLToPath(new URL("../../node_modules/next/dist/compiled/server-only/empty.js", import.meta.url)) } }, test: { include: ["lib/graph/**/*.test.ts", "lib/implementation/**/*.test.ts", "lib/decision-records/**/*.test.ts", "lib/content/course-media.test.ts"], testTimeout: 60000 } });
