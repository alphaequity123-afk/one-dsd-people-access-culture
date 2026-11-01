// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ingestGeffen, initializeGeffen, hasVolumeCapacity, MAX_AUDIO_BYTES, VOLUME_RESERVE_BYTES } from './geffen-ingest';
import { serveGeffenIndex } from './geffen-volume';

const bytes = Buffer.from('ID3\x04\x00\x00example audio data');
const sha = createHash('sha256').update(bytes).digest('hex');
const name = `${sha}.mp3`;
const record = { id: 'course/self-directed-A01/page/2/text', voice: 'geffen', verified: true, sourceTextHash: 'b'.repeat(64), audioSha256: sha, src: `/audio/geffen-read-aloud/${name}` };
const index = { format: 'geffen-course-read-aloud-v1', recordings: [record] };
const req = (body: BodyInit, headers?: HeadersInit) => new Request('http://local.test/', { method: 'POST', body, headers });
let root: string, outside: string;
beforeEach(async () => { root = await mkdtemp(path.join(os.tmpdir(), 'geffen-ingest-')); outside = await mkdtemp(path.join(os.tmpdir(), 'geffen-outside-')); await mkdir(path.join(root, 'audio')); await mkdir(path.join(root, 'courses')); });
afterEach(async () => { await rm(root, { recursive: true, force: true }); await rm(outside, { recursive: true, force: true }); });

describe('volume capacity guard', () => {
  it('requires a two GiB reserve plus incoming bytes and fails closed on uncertainty', async () => {
    const stats = (available: number) => async () => ({ bavail: available, bsize: 1 });
    expect(await hasVolumeCapacity(root, 10, stats(VOLUME_RESERVE_BYTES + 10))).toBe(true);
    expect(await hasVolumeCapacity(root, 10, stats(VOLUME_RESERVE_BYTES + 9))).toBe(false);
    expect(await hasVolumeCapacity(root, 0, stats(Number.NaN))).toBe(false);
    expect(await hasVolumeCapacity(root, 0, async () => { throw new Error('unknown'); })).toBe(false);
    const low = stats(0);
    expect((await ingestGeffen(req(bytes), 'audio', name, root, low)).status).toBe(503);
    expect(await readdir(path.join(root, 'audio'))).toEqual([]);
    expect((await initializeGeffen(path.join(root, 'geffen-public'), root, low)).status).toBe(503);
    expect(await readdir(root)).toEqual(expect.not.arrayContaining(['geffen-public']));
  });
});

describe('scoped volume initialization', () => {
  it('creates only the configured fixed child of an existing mount', async () => {
    const target = path.join(root, 'geffen-public');
    expect((await initializeGeffen(target, undefined)).status).toBe(503);
    expect((await initializeGeffen(path.join(root, 'other'), root)).status).toBe(503);
    expect((await initializeGeffen(target, path.join(root, 'missing'))).status).toBe(503);
    expect((await initializeGeffen(target, root)).status).toBe(204);
    expect((await initializeGeffen(target, root)).status).toBe(204);
    expect((await ingestGeffen(req(bytes), 'audio', name, target)).status).toBe(204);
  });
  it('rejects a symlink or junction in place of the public root', async () => {
    const target = path.join(root, 'geffen-public');
    await symlink(outside, target, process.platform === 'win32' ? 'junction' : 'dir');
    expect((await initializeGeffen(target, root)).status).toBe(503);
  });
});

describe('Geffen publication', () => {
  it('requires verified audio before atomically replacing a sanitized index', async () => {
    const previous = Buffer.from(JSON.stringify({ ...index, recordings: [] }));
    await writeFile(path.join(root, 'courses', 'self-directed-A01.json'), previous);
    expect((await ingestGeffen(req(JSON.stringify(index)), 'courses', 'self-directed-A01.json', root)).status).toBe(409);
    expect(await readFile(path.join(root, 'courses', 'self-directed-A01.json'))).toEqual(previous);
    expect((await ingestGeffen(req(bytes), 'audio', name, root)).status).toBe(204);
    expect((await ingestGeffen(req(bytes), 'audio', name, root)).status).toBe(204);
    expect((await ingestGeffen(req(JSON.stringify({ ...index, private: 'discard', recordings: [{ ...record, private: 'discard' }] })), 'courses', 'self-directed-A01.json', root)).status).toBe(204);
    expect(await (await serveGeffenIndex(new Request('http://local.test'), 'self-directed-A01.json', root)).json()).toEqual(index);
  });
  it('rejects unverified names, bytes, invalid types, oversized and malformed inputs', async () => {
    expect((await ingestGeffen(req(Buffer.from('wrong')), 'audio', name, root)).status).toBe(400);
    const fake = Buffer.from('not audio'); const fakeName = createHash('sha256').update(fake).digest('hex') + '.mp3';
    expect((await ingestGeffen(req(fake), 'audio', fakeName, root)).status).toBe(400);
    expect((await ingestGeffen(req(bytes, { 'content-length': String(MAX_AUDIO_BYTES + 1) }), 'audio', name, root)).status).toBe(413);
    expect((await ingestGeffen(req(bytes), 'audio', '../private', root)).status).toBe(400);
    expect((await ingestGeffen(req(bytes), 'other', name, root)).status).toBe(404);
    expect((await ingestGeffen(req('{'), 'courses', 'self-directed-A01.json', root)).status).toBe(400);
    expect((await ingestGeffen(req('{}'), 'courses', '../x.json', root)).status).toBe(400);
    expect((await ingestGeffen(req(bytes), 'audio', name, 'relative')).status).toBe(503);
  });
  it('rejects changed or symlinked referenced files and linked directories', async () => {
    await writeFile(path.join(root, 'audio', name), 'corrupted');
    expect((await ingestGeffen(req(bytes), 'audio', name, root)).status).toBe(409);
    expect((await ingestGeffen(req(JSON.stringify(index)), 'courses', 'self-directed-A01.json', root)).status).toBe(409);
    await rm(path.join(root, 'audio'), { recursive: true });
    await symlink(outside, path.join(root, 'audio'), process.platform === 'win32' ? 'junction' : 'dir');
    expect((await ingestGeffen(req(bytes), 'audio', name, root)).status).toBe(503);
  });
});

vi.mock('../auth/request', () => ({ ownerFromRequest: vi.fn() }));
vi.mock('../auth/mutation', () => ({ isSameOriginMutation: vi.fn() }));
import { ownerFromRequest } from '../auth/request';
import { isSameOriginMutation } from '../auth/mutation';
import { POST } from '../../app/api/owner/geffen-media/[kind]/[name]/route';

describe('publication authorization', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });
  it('is disabled by default and enforces owner and same-origin authorization', async () => {
    const request = req(bytes) as never;
    const context = { params: Promise.resolve({ kind: 'audio', name }) };
    vi.stubEnv('PAC_GEFFEN_PUBLIC_MEDIA_ROOT', root);
    vi.stubEnv('PAC_GEFFEN_UPLOAD_ENABLED', 'false');
    expect((await POST(request, context)).status).toBe(404);
    vi.stubEnv('PAC_GEFFEN_UPLOAD_ENABLED', 'true');
    vi.mocked(ownerFromRequest).mockResolvedValue(false);
    expect((await POST(request, context)).status).toBe(401);
    expect((await POST(request, { params: Promise.resolve({ kind: 'initialize', name: 'volume' }) })).status).toBe(401);
    vi.mocked(ownerFromRequest).mockResolvedValue(true);
    vi.mocked(isSameOriginMutation).mockReturnValue(false);
    expect((await POST(request, context)).status).toBe(403);
    vi.mocked(isSameOriginMutation).mockReturnValue(true);
    expect((await POST(request, context)).status).toBe(204);
  });
});
