import 'server-only';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { openStoredFile, readAloudMediaRoot } from '@/lib/storage/public-media-store';

// This tree must be dedicated to public, publisher-controlled files only.
// Publishers write complete files under temporary names and atomically rename them (or write
// whole objects to the media bucket); hash-named audio comes first, then a complete index.
const SHA = /^[a-f0-9]{64}$/;
const COURSE = /^[A-Za-z0-9_-]+$/;
const MAX_INDEX_BYTES = 2 * 1024 * 1024;
const missing = () => new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });

/**
 * Open one stored public media file, on the volume or in the media bucket
 * (lib/storage/public-media-store.ts). The shape matches a file handle, so every reader works the
 * same way in either store. On the volume symbolic links and junctions are refused anywhere in the
 * root or the requested path.
 */
export async function safeOpen(root: string | undefined, segments: string[]) {
  const stored = await openStoredFile(root, segments);
  if (!stored) return null;
  const file = {
    readFile: (async (encoding?: BufferEncoding) => {
      const bytes = await stored.bytes();
      return encoding ? bytes.toString(encoding) : bytes;
    }) as { (): Promise<Buffer>; (encoding: BufferEncoding): Promise<string> },
    createReadStream: ({ start, end }: { start: number; end: number; autoClose?: boolean }) => stored.stream(start, end),
    close: () => stored.close(),
  };
  return { file, info: { size: stored.size } };
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

export async function serveGeffenIndex(request: Request, name: string, root = readAloudMediaRoot()) {
  const index = await readGeffenIndex(name, root);
  if (index === undefined) return none();
  if (!index) return missing();
  const body = JSON.stringify(index);
  return new Response(request.method === 'HEAD' ? null : body, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': String(Buffer.byteLength(body)), 'Cache-Control': 'public, no-cache', 'X-Content-Type-Options': 'nosniff' } });
}

/** Only use a publisher-verified recording of the currently displayed text. */
export async function getGeffenPassageRecordings(course: string, passages: readonly { id: string; text: string }[], root = readAloudMediaRoot()) {
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

export async function serveGeffenAudio(request: Request, segments: string[], root = readAloudMediaRoot()) {
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
