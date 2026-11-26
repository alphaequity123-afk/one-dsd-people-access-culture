import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const gate = fileURLToPath(new URL('../verify-clone-agent-pilot.mjs', import.meta.url));
const service = '0de310b5-4c71-4696-ab9d-5c78c62e1fbb';
function check(origin, overrides = {}) {
  const temporaryRoot = resolve(tmpdir());
  const directory = mkdtempSync(join(temporaryRoot, 'pac-origin-check-'));
  try {
    return execFileSync(process.execPath, [gate], {
      cwd: directory,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        SystemRoot: process.env.SystemRoot || '',
        PAC_CLONE_AGENTS: 'on', PAC_DECISION_PROVIDER: 'gemini',
        GEMINI_API_KEY: 'test-only', OPENAI_API_KEY: 'test-only',
        PAC_OWNER_KEY: 'test-only', PAC_RATE_LIMIT_SECRET: 'test-only',
        RAILWAY_SERVICE_ID: service, PAC_STORE: 'postgres',
        RAILWAY_VOLUME_MOUNT_PATH: join(directory, '.data'), RAILWAY_VOLUME_ID: 'test-only',
        PAC_PUBLIC_ORIGIN: origin, ...overrides,
      },
    });
  } finally {
    const relativeTarget = relative(temporaryRoot, resolve(directory));
    assert.ok(!isAbsolute(relativeTarget) && /^pac-origin-check-[^\\/]+$/.test(relativeTarget));
    rmSync(directory, { recursive: true, force: true });
  }
}

test('the authorized One DSD service starts with its approved shorter address', () => {
  assert.match(check('https://one-people-access-culture.up.railway.app'), /gate passed/);
});
test('an unrelated origin remains rejected', () => {
  assert.throws(() => check('https://unapproved.example'), /origin does not match/);
});
test('the previous hostname cannot silently return as the application origin', () => {
  assert.throws(() => check('https://one-dsd-people-access-culture-production-2454.up.railway.app'), /origin does not match/);
});
test('an unrecognized service is still rejected', () => {
  assert.throws(() => check('https://one-people-access-culture.up.railway.app', { RAILWAY_SERVICE_ID: 'unapproved-service' }), /owner-authorized service/);
});
test('the existing agency service keeps its own authorized address', () => {
  assert.match(check('https://one-dhs-dsd-web-production.up.railway.app', { RAILWAY_SERVICE_ID: 'dc09906d-494f-49cb-8c19-916db3ec1931' }), /gate passed/);
});
const volumeFree = {
  RAILWAY_VOLUME_MOUNT_PATH: '', RAILWAY_VOLUME_ID: '',
  PAC_RUNTIME_RECORDS: 'postgres', PAC_PUBLIC_MEDIA_STORE: 'bucket',
  PAC_RUNTIME_DATABASE_URL: 'postgres://test-only@localhost/test', PAC_OWNER_DATABASE_URL: 'postgres://test-only@localhost/test',
  PAC_MEDIA_BUCKET_ENDPOINT: 'https://t3.storageapi.dev', PAC_MEDIA_BUCKET_NAME: 'test-only',
  PAC_MEDIA_BUCKET_ACCESS_KEY_ID: 'test-only', PAC_MEDIA_BUCKET_SECRET_ACCESS_KEY: 'test-only',
};
test('with records in the database and media in the bucket the service starts without a volume', () => {
  assert.match(check('https://one-people-access-culture.up.railway.app', volumeFree), /database records, media bucket/);
});
test('volume-free storage with an incomplete bucket setting is refused', () => {
  assert.throws(() => check('https://one-people-access-culture.up.railway.app', { ...volumeFree, PAC_MEDIA_BUCKET_SECRET_ACCESS_KEY: '' }), /settings are incomplete/);
});
test('without volume-free storage a missing volume is still refused', () => {
  assert.throws(() => check('https://one-people-access-culture.up.railway.app', { RAILWAY_VOLUME_MOUNT_PATH: '', RAILWAY_VOLUME_ID: '' }), /durable volume is not mounted/);
});
test('a storage copy asked for without the volume reports that and does not start', () => {
  assert.match(check('https://one-people-access-culture.up.railway.app', { ...volumeFree, PAC_STORAGE_COPY: 'verify' }), /nothing to copy from/);
});
