import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'public/**', 'models/**', 'evidence/**', 'handoff/**', '.data/**', '.vitest/**']),
  // CommonJS files intentionally use require(); the rule applies to ES modules.
  { files: ['**/*.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
]);
