import 'server-only';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, open, realpath } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

// This directory must be dedicated to public, publisher-controlled files only.
// Publishers write complete files under temporary names and atomically rename them;
// hash-named audio comes first, then a complete index is renamed into place.
const SHA = /^[a-f0-9]{64}$/;
const COURSE = /^[A-Za-z0-9_-]+$/;
const MAX_INDEX_BYTES = 2 * 1024 * 1024;
const missing = () => new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });

function samePath(a: string, b: string) {
  const x = path.normalize(a), y = path.normalize(b);
  return process.platform === 'win32' ? x.toLowerCase() === y.toLowerCase() : x === y;
}

export async function safeOpen(root: string | undefined, segments: string[]) {
  if (!root || !path.isAbsolute(root) || !segments.length || segments.some(s => !/^[A-Za-z0-9_-][A-Za-z0-9._-]*$/.test(s) || s.includes('..'))) return null;
  try {
    const base = path.resolve(root);
    // Refuse symlinks/junctions anywhere in the configured root or requested path.
    if (!samePath(await realpath(base), base) || !(await lstat(base)).isDirectory()) return null;
    let current = base;
    for (let i = 0; i < segments.length; i++) {
      current = path.join(current, segments[i]);
      const info = await lstat(current);
      if (info.isSymbolicLink() || (i < segments.length - 1 ? !info.isDirectory() : !info.isFile())) return null;
    }
    if (!samePath(await realpath(current), current)) return null;
    const file = await open(current, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    const info = await file.stat();
    if (!info.isFile()) { await file.close(); return null; }
    // Linux verifies the open descriptor as well, closing a parent-path race.
    if (process.platform === 'linux') {
      try {
        if (!samePath(await realpath(`/proc/self/fd/${file.fd}`), current)) { await file.close(); return null; }
      } catch { await file.close(); return null; }
    }
    return { file, info };
  } catch { return null; }
}

type Recording = { id: string; voice: 'geffen'; sourceTextHash: string; audioSha256: string; src: string; verified: true; parentSourceTextHash?: string };
export function cleanIndex(input: unknown, course: string): { format: string; recordings: Recording[] } | null {
  if (!input || typeof input !== 'object') return null;
  const data = input as Record<string, unknown>;
  if (data.format !== 'geffen-course-read-aloud-v1' || !Array.isArray(data.recordings) || data.recordings.length > 10000) return null;
  const seen = new Set<string>();
  const recordings: Recording[] = [];
  for (const value of data.recordings) {
    if (!value || typeof value !== 'object') return null;
    const r = value as Record<string, unknown>;
    if (typeof r.id !== 'string' || !r.id.startsWith(`course/${course}/`) || r.id.length > 500 || !/^course\/[A-Za-z0-9_/-]+$/.test(r.id) || r.id.split('/').some(part => !part) || seen.has(r.id) || r.voice !== 'geffen' || r.verified !== true || typeof r.sourceTextHash !== 'string' || !SHA.test(r.sourceTextHash) || typeof r.audioSha256 !== 'string' || !SHA.test(r.audioSha256) || typeof r.src !== 'string' || ![`.mp3`, `.wav`].some(ext => r.src === `/audio/geffen-read-aloud/${r.audioSha256}${ext}`) || (r.parentSourceTextHash !== undefined && (typeof r.parentSourceTextHash !== 'string' || !SHA.test(r.parentSourceTextHash)))) return null;
    seen.add(r.id);
    recordings.push({ id: r.id, voice: 'geffen', sourceTextHash: r.sourceTextHash, audioSha256: r.audioSha256, src: r.src, verified: true, ...(typeof r.parentSourceTextHash === 'string' ? { parentSourceTextHash: r.parentSourceTextHash } : {}) });
  }
  return { format: 'geffen-course-read-aloud-v1', recordings };
}

// A valid course with no recordings yet answers 204, so pages can check quietly; invalid names stay 404.
const none = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
async function readGeffenIndex(name: string, root: string | undefined) {
  if (!name.endsWith('.json') || !COURSE.test(name.slice(0, -5))) return null;
  const opened = await safeOpen(root, ['courses', name]);
  if (!opened) return undefined;
  try {
    if (opened.info.size > MAX_INDEX_BYTES) return null;
    return cleanIndex(JSON.parse(await opened.file.readFile('utf8')), name.slice(0, -5));
  } catch { return null; } finally { await opened.file.close(); }
}

export async function serveGeffenIndex(request: Request, name: string, root = process.env.PAC_GEFFEN_PUBLIC_MEDIA_ROOT) {
  const index = await readGeffenIndex(name, root);
  if (index === undefined) return none();
  if (!index) return missing();
  const body = JSON.stringify(index);
  return new Response(request.method === 'HEAD' ? null : body, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': String(Buffer.byteLength(body)), 'Cache-Control': 'public, no-cache', 'X-Content-Type-Options': 'nosniff' } });
}

/** Only use a publisher-verified recording of the currently displayed text. */
export async function getGeffenPassageRecordings(course: string, passages: readonly { id: string; text: string }[], root = process.env.PAC_GEFFEN_PUBLIC_MEDIA_ROOT) {
  const index = await readGeffenIndex(`${course}.json`, root);
  const byId = new Map(index?.recordings.map(recording => [recording.id, recording]));
  const sources = new Map<string, string>();
  for (const { id, text } of passages) {
    const recording = byId.get(id);
    if (recording?.sourceTextHash === createHash('sha256').update(text, 'utf8').digest('hex')) sources.set(id, recording.src);
  }
  return sources;
}

function byteRange(value: string, size: number): [number, number] | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2]) || size === 0) return null;
  const first = match[1] ? Number(match[1]) : undefined;
  const last = match[2] ? Number(match[2]) : undefined;
  if ((first !== undefined && !Number.isSafeInteger(first)) || (last !== undefined && !Number.isSafeInteger(last))) return null;
  if (first === undefined) {
    if (!last) return null;
    return [Math.max(0, size - last), size - 1];
  }
  if (first >= size || (last !== undefined && last < first)) return null;
  return [first, Math.min(last ?? size - 1, size - 1)];
}

export async function serveGeffenAudio(request: Request, segments: string[], root = process.env.PAC_GEFFEN_PUBLIC_MEDIA_ROOT) {
  if (segments.length !== 1 || !/^[a-f0-9]{64}\.(mp3|wav)$/.test(segments[0])) return missing();
  const opened = await safeOpen(root, ['audio', ...segments]);
  if (!opened) return missing();
  const size = opened.info.size;
  if (size === 0) { await opened.file.close(); return missing(); }
  const headers = new Headers({ 'Content-Type': segments[0].endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav', 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' });
  // Ignore Range when If-Range is supplied: no validator is emitted, so send a full response.
  const range = request.method !== 'HEAD' && !request.headers.has('if-range') ? request.headers.get('range') : null;
  const bounds = range ? byteRange(range, size) : null;
  if (range && !bounds) { await opened.file.close(); headers.set('Content-Range', `bytes */${size}`); return new Response(null, { status: 416, headers }); }
  const [start, end] = bounds ?? [0, size - 1];
  headers.set('Content-Length', String(bounds ? end - start + 1 : size));
  if (bounds) headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  if (request.method === 'HEAD' || size === 0) { await opened.file.close(); return new Response(null, { status: bounds ? 206 : 200, headers }); }
  const stream = opened.file.createReadStream({ start, end, autoClose: true });
  return new Response(Readable.toWeb(stream) as ReadableStream, { status: bounds ? 206 : 200, headers });
}
