import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../", import.meta.url));
export default defineConfig({root,resolve:{alias:{"@":root,"server-only":fileURLToPath(new URL("../../scripts/testing/server-only-stub.mjs",import.meta.url))}},test:{environment:"node",include:["lib/downloads/download-readiness.test.ts","lib/content/source-reading-preservation.test.ts","lib/content/external-reading-body.test.ts","lib/product/resource-hrefs.test.ts"],pool:"forks",maxWorkers:1}});
