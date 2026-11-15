import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
export default defineConfig({
  root,
  resolve: { alias: { '@': root, 'server-only': fileURLToPath(new URL('../testing/server-only-stub.mjs', import.meta.url)) } },
  test: { environment: 'node', include: ['lib/content/professional-language.test.ts', 'lib/content/staff-publication-language.test.ts'], fileParallelism: false },
});
