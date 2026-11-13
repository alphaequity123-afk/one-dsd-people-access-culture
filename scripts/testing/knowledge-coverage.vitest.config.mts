import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
export default defineConfig({ root,
  resolve: { alias: { '@': root, 'server-only': fileURLToPath(new URL('./server-only-stub.mjs', import.meta.url)) } },
  test: { environment: 'node', fileParallelism: false, include: [
    'lib/search/site-search.test.ts', 'lib/search/agency-connections.test.ts',
    'lib/intelligence/retrieval/public-route-docs.test.ts',
    'lib/intelligence/retrieval/source-reading-docs.test.ts',
    'lib/intelligence/retrieval/source-reading-availability.test.ts',
    'lib/intelligence/retrieval/available-source-docs.test.ts',
    'lib/intelligence/retrieval/published-resource-supplements.test.ts',
    'lib/intelligence/retrieval/public-learning-docs.test.ts',
    'lib/intelligence/retrieval/video-transcript-evidence.test.ts',
    'lib/intelligence/retrieval/evidence-passages.test.ts',
    'lib/intelligence/retrieval/generated-evidence.test.ts',
  ], env: { NODE_ENV: 'test', PAC_CONTENT_SOURCE: 'static', PAC_STORE: 'memory' } },
});
