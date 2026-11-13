import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
export default defineConfig({
  root,
  resolve: { alias: { '@': root, 'server-only': fileURLToPath(new URL('./server-only-stub.mjs', import.meta.url)) } },
  test: { environment: 'node', include: [
    'lib/ask/work-product.test.ts',
    'lib/ask/export-route.test.ts',
    'lib/intelligence/research/open-scope.test.ts',
    'components/ask-client-live.test.tsx',
    'lib/search/agency-connections.test.ts',
    'lib/intelligence/retrieval/source-reading-docs.test.ts',
    'lib/intelligence/retrieval/generated-evidence.test.ts',
    'lib/intelligence/retrieval/published-resource-supplements.test.ts',
    'lib/intelligence/retrieval/water-collection.test.ts',
    'lib/intelligence/agents/local-evidence.test.ts',
    'lib/intelligence/research/citation-join.test.ts',
    'lib/intelligence/research/fallback.test.ts',
    'lib/intelligence/research/usage-ledger.test.ts',
    'lib/intelligence/learning/resource-learning-assistant.test.ts',
  ], fileParallelism: false, testTimeout: 60_000 },
});
