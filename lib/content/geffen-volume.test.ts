// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { serveGeffenAudio, serveGeffenIndex } from './geffen-volume';

const sha = 'a'.repeat(64);
const textSha = 'b'.repeat(64);
const fileName = `${sha}.mp3`;
const get = (headers?: HeadersInit) => new Request('http://local.test/', { headers });
let root: string;
let outside: string;
const record = () => ({ id: 'course/self-directed-A01/page/2/text', voice: 'geffen', verified: true, sourceTextHash: textSha, audioSha256: sha, src: `/audio/geffen-read-aloud/${fileName}` });
const index = () => ({ format: 'geffen-course-read-aloud-v1', recordings: [record()] });
beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'pac-geffen-'));
  outside = await mkdtemp(path.join(os.tmpdir(), 'pac-private-'));
  await mkdir(path.join(root, 'audio')); await mkdir(path.join(root, 'courses'));
  await writeFile(path.join(root, 'audio', fileName), '0123456789');
  await writeFile(path.join(root, 'courses', 'self-directed-A01.json'), JSON.stringify(index()));
});
afterEach(async () => { await rm(root, { recursive: true, force: true }); await rm(outside, { recursive: true, force: true }); });

describe('public Geffen volume', () => {
  it('serves verified React and legacy-style indexes while excluding unknown metadata', async () => {
    const data = index();
    await writeFile(path.join(root, 'courses', 'self-directed-A01.json'), JSON.stringify({ ...data, secret: 'do not expose', recordings: [{ ...record(), secret: 'also private' }] }));
    const response = await serveGeffenIndex(get(), 'self-directed-A01.json', root);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('public, no-cache');
    expect(await response.json()).toEqual(data);
    const react = { ...record(), id: 'course/staff-course/lesson/first/passage-1' };
    await writeFile(path.join(root, 'courses', 'staff-course.json'), JSON.stringify({ format: 'geffen-course-read-aloud-v1', recordings: [react] }));
    expect((await serveGeffenIndex(get(), 'staff-course.json', root)).status).toBe(200);
  });
  it('fails closed for malformed, incomplete, cross-course and non-addressed indexes', async () => {
    for (const contents of ['{', JSON.stringify({ ...index(), recordings: [{ ...record(), id: 'course/other/page/2/text' }] }), JSON.stringify({ ...index(), recordings: [{ ...record(), src: '/audio/geffen-read-aloud/wrong.mp3' }] }), JSON.stringify({ ...index(), recordings: [{ ...record(), verified: false }] })]) {
      await writeFile(path.join(root, 'courses', 'self-directed-A01.json'), contents);
      expect((await serveGeffenIndex(get(), 'self-directed-A01.json', root)).status).toBe(404);
    }
    expect((await serveGeffenIndex(get(), '../private.json', root)).status).toBe(404);
    // A well-formed course name with nothing recorded yet answers 204 so pages can check quietly.
    expect((await serveGeffenIndex(get(), 'missing.json', root)).status).toBe(204);
  });
  it('streams entire files, seek ranges and HEAD accurately', async () => {
    const full = await serveGeffenAudio(get(), [fileName], root);
    expect(full.status).toBe(200); expect(full.headers.get('content-type')).toBe('audio/mpeg'); expect(await full.text()).toBe('0123456789');
    for (const [range, contentRange, body] of [['bytes=2-5', 'bytes 2-5/10', '2345'], ['bytes=7-', 'bytes 7-9/10', '789'], ['bytes=-3', 'bytes 7-9/10', '789'], ['bytes=8-999', 'bytes 8-9/10', '89']]) {
      const response = await serveGeffenAudio(get({ range }), [fileName], root);
      expect(response.status).toBe(206); expect(response.headers.get('content-range')).toBe(contentRange); expect(response.headers.get('content-length')).toBe(String(body.length)); expect(await response.text()).toBe(body);
    }
    const head = await serveGeffenAudio(new Request('http://local.test/', { method: 'HEAD', headers: { range: 'bytes=0-1' } }), [fileName], root);
    expect(head.status).toBe(200); expect(head.headers.get('content-length')).toBe('10'); expect(await head.text()).toBe('');
    const ifRange = await serveGeffenAudio(get({ range: 'bytes=0-1', 'if-range': 'old' }), [fileName], root);
    expect(ifRange.status).toBe(200); expect(await ifRange.text()).toBe('0123456789');
  });
  it('rejects invalid or unsatisfiable byte ranges', async () => {
    for (const range of ['bytes=10-11', 'bytes=3-2', 'bytes=-0', 'bytes=0-1,3-4', 'bytes=oops', 'bytes=999999999999999999999-']) {
      const response = await serveGeffenAudio(get({ range }), [fileName], root);
      expect(response.status).toBe(416); expect(response.headers.get('content-range')).toBe('bytes */10');
    }
  });
  it('rejects paths outside the dedicated public tree and symlinked files or directories', async () => {
    for (const segments of [['..', 'secret.mp3'], ['%2e%2e'], ['a/b'], ['plain.mp3'], [fileName, 'extra'], ['.hidden']]) expect((await serveGeffenAudio(get(), segments, root)).status).toBe(404);
    expect((await serveGeffenAudio(get(), [fileName], 'relative')).status).toBe(404);
    await writeFile(path.join(root, 'audio', fileName), '');
    expect((await serveGeffenAudio(get(), [fileName], root)).status).toBe(404);
    expect((await serveGeffenAudio(get(), [`${'b'.repeat(64)}.mp3`], root)).status).toBe(404);
    await writeFile(path.join(outside, fileName), 'private');
    await rm(path.join(root, 'audio'), { recursive: true });
    await symlink(outside, path.join(root, 'audio'), process.platform === 'win32' ? 'junction' : 'dir');
    expect((await serveGeffenAudio(get(), [fileName], root)).status).toBe(404);
    await rm(path.join(root, 'audio'), { recursive: true, force: true });
    await mkdir(path.join(root, 'audio'));
    // On Windows creating file symlinks needs a privilege; a junction test above still covers parent escape.
    if (process.platform !== 'win32') { await symlink(path.join(outside, fileName), path.join(root, 'audio', fileName)); expect((await serveGeffenAudio(get(), [fileName], root)).status).toBe(404); }
  });
});
