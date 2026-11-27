import 'server-only';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { configuredPublicMediaRoot, createStoredFolders, listStoredNames, storedCapacity, storedFolderReady, writeStoredFile } from '@/lib/storage/public-media-store';
import { safeOpen } from './geffen-volume';
import { mapConcurrent } from '@/lib/async/map-concurrent';

// Owner-published course media (explainer videos, narrated card videos, two-voice podcasts and
// narration). Public files only, in their own directory of the public media volume. Each item has a
// small manifest naming the pages it belongs to, so a newly published item appears on those pages
// without an application release. Nothing here records who plays anything.
const MAX_MEDIA = 32 * 1024 * 1024;
const MAX_TEXT = 1024 * 1024;
const MAX_IMAGE = 4 * 1024 * 1024;
const MAX_MANIFEST = 32 * 1024;
const ASSET = /^[a-f0-9]{64}\.(mp4|mp3|vtt|txt|png)$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PAGE = /^\/[A-Za-z0-9/_.\-]{0,200}$/;
const NO_STORE = { 'Cache-Control': 'no-store' };
const unavailable = (status = 404) => new Response(null, { status, headers: NO_STORE });
const success = () => new Response(null, { status: 204, headers: NO_STORE });
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const manifestName = (name: string) => name.endsWith('.json') && name.length <= 90 && ID.test(name.slice(0, -5));
const asset = (value: unknown, extension: string) => typeof value === 'string' && ASSET.test(value) && value.endsWith(extension);
const PREFIX = '/learning/course-media/';

export type CourseMediaItem = {
  format: 'course-media-v1'; id: string; title: string; kind: 'video' | 'audio'; summary: string;
  pages: string[]; media: string; captions: string; transcript: string; poster?: string;
  durationSeconds: number; chapters: { title: string; start: number }[];
};

/** The configured public media tree: on the volume, or in the media bucket (lib/storage/public-media-store.ts). */
export function configuredCourseMediaRoot(root: string | undefined, mount: string | undefined) {
  return configuredPublicMediaRoot(root, mount);
}

const text = (value: unknown, max: number) => typeof value === 'string' && value.trim().length > 0 && value.length <= max && !/[\x00-\x1f\x7f]/.test(value);

export function cleanCourseMediaManifest(input: unknown, id: string): CourseMediaItem | null {
  if (!input || typeof input !== 'object') return null;
  const row = input as Record<string, unknown>;
  if (row.format !== 'course-media-v1' || row.id !== id || !text(row.title, 200) || (row.kind !== 'video' && row.kind !== 'audio')) return null;
  const summary = typeof row.summary === 'string' && row.summary.length <= 400 && !/[\x00-\x1f\x7f]/.test(row.summary) ? row.summary : '';
  if (!Array.isArray(row.pages) || !row.pages.length || row.pages.length > 20 || !row.pages.every(page => typeof page === 'string' && PAGE.test(page) && !page.includes('..'))) return null;
  if (!asset(row.media, row.kind === 'video' ? '.mp4' : '.mp3') || !asset(row.captions, '.vtt') || !asset(row.transcript, '.txt')) return null;
  if (row.poster !== undefined && !asset(row.poster, '.png')) return null;
  const duration = Number(row.durationSeconds);
  if (!Number.isFinite(duration) || duration <= 0 || duration > 4 * 3600) return null;
  const chapters = Array.isArray(row.chapters) ? row.chapters.slice(0, 60).flatMap(c => {
    const item = c as Record<string, unknown>;
    return text(item?.title, 200) && Number.isFinite(Number(item?.start)) && Number(item.start) >= 0 ? [{ title: String(item.title), start: Number(item.start) }] : [];
  }) : [];
  return { format: 'course-media-v1', id, title: String(row.title), kind: row.kind, summary, pages: row.pages as string[], media: String(row.media), captions: String(row.captions), transcript: String(row.transcript), ...(row.poster ? { poster: String(row.poster) } : {}), durationSeconds: duration, chapters };
}

function limitFor(name: string) { return name.endsWith('.mp4') || name.endsWith('.mp3') ? MAX_MEDIA : name.endsWith('.png') ? MAX_IMAGE : MAX_TEXT; }

function validContent(name: string, data: Buffer) {
  if (name.endsWith('.mp4')) return data.length > 16 && data.subarray(4, 8).toString('ascii') === 'ftyp';
  if (name.endsWith('.mp3')) return data.length > 4 && (data.subarray(0, 3).toString('ascii') === 'ID3' || (data[0] === 0xff && (data[1] & 0xe0) === 0xe0));
  if (name.endsWith('.png')) return data.length > 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  try {
    const value = new TextDecoder('utf-8', { fatal: true }).decode(data);
    if (!value.trim() || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)) return false;
    return name.endsWith('.vtt') ? /^(?:﻿)?WEBVTT/.test(value) : true;
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

export async function initializeCourseMedia(root: string | undefined, mount: string | undefined) {
  if (!configuredCourseMediaRoot(root, mount) || !root) return unavailable(503);
  return await createStoredFolders(root, [[], ['course-media'], ['course-media', 'assets'], ['course-media', 'manifests']]) ? success() : unavailable(503);
}

async function assetPresent(root: string, name: string, verify: boolean) {
  const opened = await safeOpen(root, ['course-media', 'assets', name]);
  if (!opened) return false;
  try {
    if (!opened.info.size || opened.info.size > limitFor(name)) return false;
    if (!verify) return true;
    const data = await opened.file.readFile();
    return digest(data) === name.slice(0, 64) && validContent(name, data);
  } catch { return false; } finally { await opened.file.close(); }
}

/** Receive one immutable hash-named asset, or publish an item's manifest once all its files exist. */
export async function ingestCourseMedia(request: Request, name: string, root: string | undefined) {
  const isAsset = ASSET.test(name), isManifest = manifestName(name);
  if (!isAsset && !isManifest) return unavailable(400);
  const folder = ['course-media', isAsset ? 'assets' : 'manifests'];
  if (!root || !await storedFolderReady(root, folder)) return unavailable(503);
  const bytes = await boundedBody(request, isManifest ? MAX_MANIFEST : limitFor(name));
  if (!bytes || !bytes.length) return unavailable(413);
  if (!await storedCapacity(root, folder, bytes.length)) return unavailable(503);
  if (isAsset) {
    if (digest(bytes) !== name.slice(0, 64) || !validContent(name, bytes)) return unavailable(400);
    if (await assetPresent(root, name, true)) return success();
    return await writeStoredFile(root, [...folder, name], bytes, false, '.course-media') ? success() : unavailable(409);
  }
  try {
    const item = cleanCourseMediaManifest(JSON.parse(bytes.toString('utf8')), name.slice(0, -5));
    if (!item) return unavailable(400);
    for (const file of [item.media, item.captions, item.transcript, ...(item.poster ? [item.poster] : [])]) if (!await assetPresent(root, file, true)) return unavailable(409);
    return await writeStoredFile(root, [...folder, name], Buffer.from(JSON.stringify(item)), true, '.course-media') ? success() : unavailable(409);
  } catch { return unavailable(400); }
}

let cache: { at: number; root: string; items: CourseMediaItem[] } | undefined;

/** Owner decision 2026-11-22: the 14 leadership films are retired. Their files stay in storage but are never listed. */
export const RETIRED_COURSE_MEDIA = /^leadership-film-\d{2}-/;

/** Every published item whose files are all present. Cached for one minute. */
export async function publishedCourseMedia(root: string | undefined, fresh = false): Promise<CourseMediaItem[]> {
  if (!root) return [];
  if (!fresh && cache && cache.root === root && Date.now() - cache.at < 60_000) return cache.items;
  const names = await listStoredNames(root, ['course-media', 'manifests']);
  if (!names) return [];
  let items: CourseMediaItem[];
  try {
    // Storage may be remote. Keep fresh manifest and file checks, but do not
    // serialize hundreds of independent network round trips. Each worker has
    // only one storage read active, so concurrency stays bounded at eight.
    const checked = await mapConcurrent(names.filter(manifestName).sort().slice(0, 500), 8, async name => {
      const opened = await safeOpen(root, ['course-media', 'manifests', name]);
      if (!opened) return null;
      try {
        if (!opened.info.size || opened.info.size > MAX_MANIFEST) return null;
        const item = cleanCourseMediaManifest(JSON.parse(await opened.file.readFile('utf8')), name.slice(0, -5));
        if (!item || RETIRED_COURSE_MEDIA.test(item.id)) return null;
        let present = true;
        for (const file of [item.media, item.captions, item.transcript]) if (!await assetPresent(root, file, false)) { present = false; break; }
        return present ? item : null;
      } catch { return null; /* skip unreadable manifest */ } finally { await opened.file.close(); }
    });
    items = checked.filter((item): item is CourseMediaItem => item !== null);
  } catch { return []; }
  cache = { at: Date.now(), root, items };
  return items;
}

export function publicCourseMedia(item: CourseMediaItem) {
  return { ...item, media: PREFIX + item.media, captions: PREFIX + item.captions, transcript: PREFIX + item.transcript, ...(item.poster ? { poster: PREFIX + item.poster } : {}) };
}

export function mediaForPage(items: CourseMediaItem[], pathname: string) {
  const clean = pathname.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return items.filter(item => item.pages.some(page => page.replace(/\/+$/, '') === clean)).map(publicCourseMedia);
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

/** Serve a hash-addressed public asset with byte ranges. */
export async function serveCourseMediaAsset(request: Request, name: string, root: string | undefined) {
  if (!ASSET.test(name)) return unavailable();
  const opened = await safeOpen(root, ['course-media', 'assets', name]);
  if (!opened) return unavailable();
  const size = opened.info.size;
  if (!size || size > limitFor(name)) { await opened.file.close(); return unavailable(); }
  const mime = name.endsWith('.mp4') ? 'video/mp4' : name.endsWith('.mp3') ? 'audio/mpeg' : name.endsWith('.png') ? 'image/png' : name.endsWith('.vtt') ? 'text/vtt; charset=utf-8' : 'text/plain; charset=utf-8';
  const headers = new Headers({ 'Content-Type': mime, 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' });
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
