// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const roots = [];
function fixture(source) {
  const root = mkdtempSync(join(tmpdir(), 'one-dsd-env-test-'));
  roots.push(root);
  mkdirSync(join(root, 'scripts'), { recursive: true });
  mkdirSync(join(root, 'config'), { recursive: true });
  for (const file of ['scripts/verify-environment.mjs', 'config/environment-contract.json', 'config/protected-feature-activation.json', 'config/contributor-access.json', 'package.json', 'package-lock.json', '.env.example']) cpSync(join(project, file), join(root, file));
  writeFileSync(join(root, 'example.ts'), source);
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => ['PATH', 'Path', 'SystemRoot', 'SYSTEMROOT', 'TEMP', 'TMP'].includes(key)));
  return spawnSync(process.execPath, [join(root, 'scripts/verify-environment.mjs')], { cwd: root, env, encoding: 'utf8' });
}
afterEach(() => { for (const root of roots.splice(0)) { if (!resolve(root).startsWith(resolve(tmpdir()) + sep) || !root.split(/[\\/]/).pop().startsWith('one-dsd-env-test-')) throw Error('Unexpected test directory'); rmSync(root, { recursive: true, force: true }); } });
describe('environment verification boundaries', () => {
  it('allows documented server-only secrets in server code', () => {
    const result = fixture('export const key = process.' + 'env.PAC_CONSULTANT_CASE_KEY;');
    expect(result.status, result.stderr).toBe(0);
  });
  it('rejects documented server-only secrets in client code', () => {
    const result = fixture('"use client";\nexport const key = process.' + 'env.PAC_CONSULTANT_CASE_KEY;');
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('reads server-only setting PAC_CONSULTANT_CASE_KEY');
  });
  it('rejects public-prefixed secret settings anywhere', () => {
    const result = fixture('export const key = process.' + 'env.NEXT_PUBLIC_OPENAI_API_KEY;');
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('forbidden client setting NEXT_PUBLIC_OPENAI_API_KEY');
  });
});
