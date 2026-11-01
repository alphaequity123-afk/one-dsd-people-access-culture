// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { configuredLeadershipRoot, ingestLeadershipMedia, initializeLeadershipMedia, serveLeadershipMedia } from './leadership-media';

const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
// Minimal type-signature fixtures: final video decoding is verified by the
// media production workflow, not assumed from this file signature alone.
const video = Buffer.from([0, 0, 0, 16, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0]);
const captions = Buffer.from('WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nExample\n');
const transcript = Buffer.from('An accessible transcript.\n');
const names = { video: `${sha(video)}.mp4`, captions: `${sha(captions)}.vtt`, transcript: `${sha(transcript)}.txt` };
const doc = (style: string) => ({ format: 'leadership-video-v1', style, ...names });
const post = (body: BodyInit, headers?: HeadersInit) => new Request('http://local.test/', { method: 'POST', body, headers });
const get = (headers?: HeadersInit) => new Request('http://local.test/', { headers });
const capacity = async () => ({ bavail: 8 * 1024 * 1024 * 1024, bsize: 1 });
let mount: string, root: string, outside: string;

beforeEach(async () => {
  mount = await mkdtemp(path.join(os.tmpdir(), 'leadership-public-test-'));
  outside = await mkdtemp(path.join(os.tmpdir(), 'leadership-outside-test-'));
  root = path.join(mount, 'geffen-public'); await mkdir(root);
  expect((await initializeLeadershipMedia(root, mount, capacity)).status).toBe(204);
});
afterEach(async () => { await rm(mount, { recursive: true, force: true }); await rm(outside, { recursive: true, force: true }); });

async function uploadAll() {
  expect((await ingestLeadershipMedia(post(video), names.video, root, capacity)).status).toBe(204);
  expect((await ingestLeadershipMedia(post(captions), names.captions, root, capacity)).status).toBe(204);
  expect((await ingestLeadershipMedia(post(transcript), names.transcript, root, capacity)).status).toBe(204);
}

describe('leadership media public-volume boundary', () => {
  it('requires the exact public child of the configured volume and refuses linked roots', async () => {
    expect(configuredLeadershipRoot(root, mount)).toBe(path.resolve(root));
    expect(configuredLeadershipRoot(outside, mount)).toBeUndefined();
    expect(configuredLeadershipRoot(root, undefined)).toBeUndefined();
    expect((await initializeLeadershipMedia(outside, mount, capacity)).status).toBe(503);
    await rm(path.join(root, 'leadership'), { recursive: true });
    await symlink(outside, path.join(root, 'leadership'), process.platform === 'win32' ? 'junction' : 'dir');
    expect((await initializeLeadershipMedia(root, mount, capacity)).status).toBe(503);
    expect((await ingestLeadershipMedia(post(video), names.video, root, capacity)).status).toBe(503);
  });

  it('requires all three validated files before publishing each independently addressed style', async () => {
    expect((await ingestLeadershipMedia(post(JSON.stringify(doc('servant'))), 'servant.json', root, capacity)).status).toBe(409);
    await uploadAll();
    const input = { ...doc('servant'), privateMetadata: 'not public' };
    expect((await ingestLeadershipMedia(post(JSON.stringify(input)), 'servant.json', root, capacity)).status).toBe(204);
    expect((await ingestLeadershipMedia(post(JSON.stringify(doc('transformative'))), 'transformative.json', root, capacity)).status).toBe(204);
    const response = await serveLeadershipMedia(get(), 'servant.json', root);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ format: 'leadership-video-v1', style: 'servant', video: `/learning/leadership-videos/${names.video}`, captions: `/learning/leadership-videos/${names.captions}`, transcript: `/learning/leadership-videos/${names.transcript}` });
    expect((await serveLeadershipMedia(get(), 'transformative.json', root)).status).toBe(200);
    expect((await serveLeadershipMedia(get(), 'authoritarian.json', root)).status).toBe(404);
    expect((await serveLeadershipMedia(new Request('http://local.test', { method: 'HEAD' }), 'servant.json', root)).status).toBe(200);
    await rm(path.join(root, 'leadership', 'assets', names.transcript));
    expect((await serveLeadershipMedia(get(), 'servant.json', root)).status).toBe(404);
    expect((await serveLeadershipMedia(get(), 'transformative.json', root)).status).toBe(404);
  });

  it('rejects wrong hashes, bad signatures, invalid names, malformed manifest and limits', async () => {
    expect((await ingestLeadershipMedia(post(Buffer.from('wrong')), names.video, root, capacity)).status).toBe(400);
    const fake = Buffer.from('not an mp4');
    expect((await ingestLeadershipMedia(post(fake), `${sha(fake)}.mp4`, root, capacity)).status).toBe(400);
    const invalidVtt = Buffer.from('not captions');
    expect((await ingestLeadershipMedia(post(invalidVtt), `${sha(invalidVtt)}.vtt`, root, capacity)).status).toBe(400);
    const invalidText = Buffer.from([0xff, 0xfe]);
    expect((await ingestLeadershipMedia(post(invalidText), `${sha(invalidText)}.txt`, root, capacity)).status).toBe(400);
    expect((await ingestLeadershipMedia(post(video, { 'content-length': String(32 * 1024 * 1024 + 1) }), names.video, root, capacity)).status).toBe(413);
    expect((await ingestLeadershipMedia(post(video), '../private.mp4', root, capacity)).status).toBe(400);
    expect((await ingestLeadershipMedia(post('{'), 'servant.json', root, capacity)).status).toBe(400);
    expect((await ingestLeadershipMedia(post(JSON.stringify(doc('other'))), 'servant.json', root, capacity)).status).toBe(400);
    expect((await ingestLeadershipMedia(post(video), names.video, root, async () => ({ bavail: 0, bsize: 1 }))).status).toBe(503);
  });

  it('allows idempotent uploads but does not overwrite a corrupt hash-named asset', async () => {
    expect((await ingestLeadershipMedia(post(video), names.video, root, capacity)).status).toBe(204);
    expect((await ingestLeadershipMedia(post(video), names.video, root, capacity)).status).toBe(204);
    await writeFile(path.join(root, 'leadership', 'assets', names.video), 'tampered');
    expect((await ingestLeadershipMedia(post(video), names.video, root, capacity)).status).toBe(409);
    expect((await ingestLeadershipMedia(post(JSON.stringify(doc('servant'))), 'servant.json', root, capacity)).status).toBe(409);
    expect((await readFile(path.join(root, 'leadership', 'assets', names.video))).toString()).toBe('tampered');
  });

  it('serves valid byte ranges, complete text and HEAD, rejecting invalid paths and ranges', async () => {
    await uploadAll();
    const v = await serveLeadershipMedia(get({ range: 'bytes=4-7' }), names.video, root);
    expect(v.status).toBe(206); expect(v.headers.get('content-range')).toBe('bytes 4-7/16');
    expect(Buffer.from(await v.arrayBuffer())).toEqual(video.subarray(4, 8));
    expect((await serveLeadershipMedia(get({ range: 'bytes=16-17' }), names.video, root)).status).toBe(416);
    const head = await serveLeadershipMedia(new Request('http://local.test', { method: 'HEAD' }), names.video, root);
    expect(head.status).toBe(200); expect(head.headers.get('content-length')).toBe('16'); expect(await head.text()).toBe('');
    const cc = await serveLeadershipMedia(get(), names.captions, root);
    expect(cc.headers.get('content-type')).toContain('text/vtt'); expect(await cc.text()).toBe(captions.toString());
    expect(await (await serveLeadershipMedia(get(), names.transcript, root)).text()).toBe(transcript.toString());
    for (const name of ['../secret.json', 'servant/../../private', 'not-hash.mp4', '.hidden']) expect((await serveLeadershipMedia(get(), name, root)).status).toBe(404);
  });
});
