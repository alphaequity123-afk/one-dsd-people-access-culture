import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
export default defineConfig({ root,
  resolve: { alias: { '@': root, 'server-only': fileURLToPath(new URL('./server-only-stub.mjs', import.meta.url)) } },
  test: { environment: 'node', fileParallelism: false, include: [
    'lib/ask/source-links.test.ts', 'lib/intelligence/retrieval/answer-review.test.ts',
    'lib/intelligence/retrieval/verified-draft.test.ts',
  ] },
});
