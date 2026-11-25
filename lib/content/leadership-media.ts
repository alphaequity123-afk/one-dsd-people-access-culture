import 'server-only';
import { createHash } from 'node:crypto';
import { lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { configuredPublicMediaRoot, createStoredFolders, hasVolumeCapacity, publicMediaStore, readAloudMediaRoot, storedCapacity, storedFolderReady, writeStoredFile } from '@/lib/storage/public-media-store';
import { safeOpen } from './geffen-volume';

// This tree contains owner-published public media only. It is separate from
// both private data and the read-aloud audio and course-index directories.
const MAX_VIDEO = 32 * 1024 * 1024;
const MAX_TEXT = 512 * 1024;
const MAX_MANIFEST = 4096;
const ASSET = /^[a-f0-9]{64}\.(mp4|vtt|txt)$/;
const STYLE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NO_STORE = { 'Cache-Control': 'no-store' };
const unavailable = (status = 404) => new Response(null, { status, headers: NO_STORE });
const success = () => new Response(null, { status: 204, headers: NO_STORE });
const same = (a: string, b: string) => process.platform === 'win32' ? path.normalize(a).toLowerCase() === path.normalize(b).toLowerCase() : path.normalize(a) === path.normalize(b);
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const styleName = (name: string) => name.endsWith('.json') && name.length <= 69 && STYLE.test(name.slice(0, -5));
const relativeAsset = (name: string, extension: string) => ASSET.test(name) && name.endsWith(extension);

/** The public publisher never reads from an arbitrary configured directory. */
export function configuredLeadershipRoot(root: string | undefined, mount: string | undefined) {
  return configuredPublicMediaRoot(root, mount);
}

type CapacityProbe = Parameters<typeof hasVolumeCapacity>[2];
type VideoManifest = { format: 'leadership-video-v1'; style: string; video: string; captions: string; transcript: string };

function cleanManifest(input: unknown, style: string): VideoManifest | null {
  if (!input || typeof input !== 'object') return null;
  const row = input as Record<string, unknown>;
  if (row.format !== 'leadership-video-v1' || row.style !== style || typeof row.video !== 'string' || typeof row.captions !== 'string' || typeof row.transcript !== 'string') return null;
  if (!relativeAsset(row.video, '.mp4') || !relativeAsset(row.captions, '.vtt') || !relativeAsset(row.transcript, '.txt')) return null;
  // Unknown input properties are deliberately dropped; a public manifest may
  // expose only these public asset addresses.
  return { format: 'leadership-video-v1', style, video: row.video, captions: row.captions, transcript: row.transcript };
}

function validContent(name: string, data: Buffer) {
  if (name.endsWith('.mp4')) {
    if (data.length < 16 || data.subarray(4, 8).toString('ascii') !== 'ftyp') return false;
    const size = data.readUInt32BE(0);
    return size >= 8 && size <= data.length;
  }
  try {
    const value = new TextDecoder('utf-8', { fatal: true }).decode(data);
    if (!value.trim() || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)) return false;
    if (name.endsWith('.vtt')) return /^(?:\ufeff)?WEBVTT(?:[ \t][^\r\n]*)?(?:\r?\n|\r)/.test(value);
    return name.endsWith('.txt');
  } catch { return false; }
}

async function boundedBody(request: Request, maximum: number) {
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > maximum)) return null;
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = []; let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximum) { await reader.cancel(); return null; }
      chunks.push(value);
    }
    return Buffer.concat(chunks, total);
  } catch { return null; } finally { reader.releaseLock(); }
}

/** Creates only this publisher's fixed directory inside the dedicated public volume. The bucket needs no folders. */
export async function initializeLeadershipMedia(root: string | undefined, mount: string | undefined, probe?: CapacityProbe) {
  if (!configuredLeadershipRoot(root, mount) || !root) return unavailable(503);
  const folders = [['leadership'], ['leadership', 'assets'], ['leadership', 'manifests']];
  if (publicMediaStore() === 'bucket') return await createStoredFolders(root, folders) ? success() : unavailable(503);
  if (!mount) return unavailable(503);
  const base = path.resolve(mount), publicRoot = path.join(base, 'geffen-public');
  if (!same(path.resolve(root), publicRoot)) return unavailable(503);
  try {
    if (!(await lstat(base)).isDirectory() || !same(await realpath(base), base) || !(await lstat(publicRoot)).isDirectory() || !same(await realpath(publicRoot), publicRoot) || !await hasVolumeCapacity(publicRoot, 0, probe)) return unavailable(503);
    return await createStoredFolders(root, folders) ? success() : unavailable(503);
  } catch { return unavailable(503); }
}

async function assetMatches(root: string, name: string) {
  const opened = await safeOpen(root, ['leadership', 'assets', name]);
  if (!opened) return false;
  try {
    const limit = name.endsWith('.mp4') ? MAX_VIDEO : MAX_TEXT;
    if (!opened.info.size || opened.info.size > limit) return false;
    const data = await opened.file.readFile();
    return digest(data) === name.slice(0, 64) && validContent(name, data);
  } catch { return false; } finally { await opened.file.close(); }
}

// Hash-named assets are never overwritten; a complete manifest is replaced
// only after its three independently validated public files exist.
/** Receives an immutable asset or atomically publishes one style's complete manifest. */
export async function ingestLeadershipMedia(request: Request, name: string, root: string | undefined, probe?: CapacityProbe) {
  const asset = ASSET.test(name), manifest = styleName(name);
  if (!asset && !manifest) return unavailable(400);
  const folder = ['leadership', asset ? 'assets' : 'manifests'];
  if (!root || !await storedFolderReady(root, folder)) return unavailable(503);
  const bytes = await boundedBody(request, manifest ? MAX_MANIFEST : name.endsWith('.mp4') ? MAX_VIDEO : MAX_TEXT);
  if (!bytes || !bytes.length) return unavailable(413);
  if (!await storedCapacity(root, folder, bytes.length, probe)) return unavailable(503);
  if (asset) {
    if (digest(bytes) !== name.slice(0, 64) || !validContent(name, bytes)) return unavailable(400);
    if (await assetMatches(root, name)) return success();
    return await writeStoredFile(root, [...folder, name], bytes, false, '.leadership') ? success() : unavailable(409);
  }
  try {
    const parsed = cleanManifest(JSON.parse(bytes.toString('utf8')), name.slice(0, -5));
    if (!parsed) return unavailable(400);
    for (const item of [parsed.video, parsed.captions, parsed.transcript]) if (!await assetMatches(root, item)) return unavailable(409);
    return await writeStoredFile(root, [...folder, name], Buffer.from(JSON.stringify(parsed)), true, '.leadership') ? success() : unavailable(409);
  } catch { return unavailable(400); }
}

function byteRange(value: string, size: number): [number, number] | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2]) || !size) return null;
  const first = match[1] ? Number(match[1]) : undefined, last = match[2] ? Number(match[2]) : undefined;
  if ((first !== undefined && !Number.isSafeInteger(first)) || (last !== undefined && !Number.isSafeInteger(last))) return null;
  if (first === undefined) return last ? [Math.max(0, size - last), size - 1] : null;
  if (first >= size || (last !== undefined && last < first)) return null;
  return [first, Math.min(last ?? size - 1, size - 1)];
}

/** Serve an independently published manifest or a hash-addressed public asset. */
// A known style with no published video answers 204, so lessons can check quietly.
const none = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
export async function serveLeadershipMedia(request: Request, name: string, root = readAloudMediaRoot()) {
  if (styleName(name)) {
    const opened = await safeOpen(root, ['leadership', 'manifests', name]);
    if (!opened) return none();
    try {
      if (!opened.info.size || opened.info.size > MAX_MANIFEST) return unavailable();
      const item = cleanManifest(JSON.parse(await opened.file.readFile('utf8')), name.slice(0, -5));
      if (!item) return unavailable();
      // Hashes and formats were checked before publishing. Hide the player if
      // any required file has subsequently disappeared or become unsafe.
      for (const name of [item.video, item.captions, item.transcript]) {
        const asset = await safeOpen(root, ['leadership', 'assets', name]);
        if (!asset) return unavailable();
        const limit = name.endsWith('.mp4') ? MAX_VIDEO : MAX_TEXT;
        const present = asset.info.size > 0 && asset.info.size <= limit;
        await asset.file.close();
        if (!present) return unavailable();
      }
      const prefix = '/learning/leadership-videos/';
      const body = JSON.stringify({ ...item, video: prefix + item.video, captions: prefix + item.captions, transcript: prefix + item.transcript });
      return new Response(request.method === 'HEAD' ? null : body, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': String(Buffer.byteLength(body)), 'Cache-Control': 'public, no-cache', 'X-Content-Type-Options': 'nosniff' } });
    } catch { return unavailable(); } finally { await opened.file.close(); }
  }
  if (!ASSET.test(name)) return unavailable();
  const opened = await safeOpen(root, ['leadership', 'assets', name]);
  if (!opened) return unavailable();
  const size = opened.info.size, max = name.endsWith('.mp4') ? MAX_VIDEO : MAX_TEXT;
  if (!size || size > max) { await opened.file.close(); return unavailable(); }
  const mime = name.endsWith('.mp4') ? 'video/mp4' : name.endsWith('.vtt') ? 'text/vtt; charset=utf-8' : 'text/plain; charset=utf-8';
  const headers = new Headers({ 'Content-Type': mime, 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' });
  const range = request.method !== 'HEAD' && !request.headers.has('if-range') ? request.headers.get('range') : null;
  const bounds = range ? byteRange(range, size) : null;
  if (range && !bounds) { await opened.file.close(); headers.set('Content-Range', `bytes */${size}`); return new Response(null, { status: 416, headers }); }
  const [start, end] = bounds ?? [0, size - 1];
  headers.set('Content-Length', String(bounds ? end - start + 1 : size));
  if (bounds) headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  if (request.method === 'HEAD') { await opened.file.close(); return new Response(null, { status: 200, headers }); }
  const stream = opened.file.createReadStream({ start, end, autoClose: true });
  return new Response(Readable.toWeb(stream) as ReadableStream, { status: bounds ? 206 : 200, headers });
}
