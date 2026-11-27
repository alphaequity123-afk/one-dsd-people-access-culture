import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { BUCKET_MEDIA_ROOT, readStoredFile } from './public-media-store';

const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock); fetchMock.mockReset();
  vi.stubEnv('PAC_PUBLIC_MEDIA_STORE', 'bucket');
  vi.stubEnv('PAC_MEDIA_BUCKET_ENDPOINT', 'https://storage.example.test');
  vi.stubEnv('PAC_MEDIA_BUCKET_NAME', 'test-media');
  vi.stubEnv('PAC_MEDIA_BUCKET_ACCESS_KEY_ID', 'test-id');
  vi.stubEnv('PAC_MEDIA_BUCKET_SECRET_ACCESS_KEY', 'test-secret');
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const read = (maximum = 32) => readStoredFile(BUCKET_MEDIA_ROOT, ['course-media', 'manifests', 'example.json'], maximum);

it('reads each current manifest with one uncached GET and no HEAD', async () => {
  fetchMock.mockResolvedValueOnce(new Response('first')).mockResolvedValueOnce(new Response('second'));
  expect((await read())?.toString()).toBe('first');
  expect((await read())?.toString()).toBe('second');
  expect(fetchMock).toHaveBeenCalledTimes(2);
  for (const [, init] of fetchMock.mock.calls) expect(init).toMatchObject({method: 'GET', cache: 'no-store'});
});

it('fails closed for absent, empty, failed and unreadable objects', async () => {
  fetchMock.mockResolvedValueOnce(new Response(null, {status: 404}))
    .mockResolvedValueOnce(new Response(''))
    .mockResolvedValueOnce(new Response(null, {status: 503}))
    .mockRejectedValueOnce(new Error('network failed'))
    .mockResolvedValueOnce(new Response(new ReadableStream({start(controller) {controller.error(new Error('stream failed'));}})));
  for (let i = 0; i < 5; i++) expect(await read()).toBeNull();
});

it('cancels oversized declared content before consuming it', async () => {
  const cancel = vi.fn();
  fetchMock.mockResolvedValue(new Response(new ReadableStream({cancel}), {headers: {'content-length': '33'}}));
  expect(await read()).toBeNull();
  expect(cancel).toHaveBeenCalledOnce();
});

it.each([undefined, '1'])('bounds actual bytes when content-length is %s', async length => {
  const cancel = vi.fn();
  fetchMock.mockResolvedValue(new Response(new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(20)); controller.enqueue(new Uint8Array(20)); }, cancel,
  }), {headers: length === undefined ? {} : {'content-length': length}}));
  expect(await read()).toBeNull();
  expect(cancel).toHaveBeenCalledOnce();
});

it('accepts the exact limit and refuses unsafe paths and limits without a request', async () => {
  fetchMock.mockResolvedValue(new Response('x'.repeat(32)));
  expect((await read())?.length).toBe(32);
  fetchMock.mockClear();
  expect(await readStoredFile(BUCKET_MEDIA_ROOT, ['..', 'secret'], 32)).toBeNull();
  for (const limit of [0, -1, Infinity, 1.5]) expect(await read(limit)).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
});

it('reads current volume files and rejects missing, empty and oversized files', async () => {
  vi.stubEnv('PAC_PUBLIC_MEDIA_STORE', 'volume');
  const parent = await realpath(tmpdir());
  const root = await mkdtemp(path.join(parent, 'bounded-media-'));
  try {
    expect(await readStoredFile(root, ['manifest.json'], 32)).toBeNull();
    await writeFile(path.join(root, 'manifest.json'), 'first');
    expect((await readStoredFile(root, ['manifest.json'], 32))?.toString()).toBe('first');
    await writeFile(path.join(root, 'manifest.json'), 'current');
    expect((await readStoredFile(root, ['manifest.json'], 32))?.toString()).toBe('current');
    await writeFile(path.join(root, 'manifest.json'), '');
    expect(await readStoredFile(root, ['manifest.json'], 32)).toBeNull();
    await writeFile(path.join(root, 'manifest.json'), 'x'.repeat(33));
    expect(await readStoredFile(root, ['manifest.json'], 32)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  } finally {
    const resolved = await realpath(root);
    if (path.dirname(resolved) !== parent || !path.basename(resolved).startsWith('bounded-media-')) throw Error('Unsafe fixture cleanup');
    await rm(resolved, {recursive: true, force: true});
  }
});
