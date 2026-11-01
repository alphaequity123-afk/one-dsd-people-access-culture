import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { link, lstat, mkdir, open, realpath, rename, statfs, unlink } from 'node:fs/promises';
import path from 'node:path';
import { cleanIndex, safeOpen } from './geffen-volume';

export const MAX_AUDIO_BYTES = 32 * 1024 * 1024;
export const MAX_INDEX_BYTES = 2 * 1024 * 1024;
export const VOLUME_RESERVE_BYTES = 2 * 1024 * 1024 * 1024;
const error = (status: number) => new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });
const ok = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
const samePath = (a: string, b: string) => process.platform === 'win32' ? path.normalize(a).toLowerCase() === path.normalize(b).toLowerCase() : path.normalize(a) === path.normalize(b);

async function directory(root: string | undefined, subdir: 'audio' | 'courses') {
  if (!root || !path.isAbsolute(root)) return null;
  try {
    const base = path.resolve(root), dir = path.join(base, subdir);
    if (!samePath(await realpath(base), base) || !(await lstat(base)).isDirectory() || !(await lstat(dir)).isDirectory() || !samePath(await realpath(dir), dir)) return null;
    return dir;
  } catch { return null; }
}

/** Keep space for other services on this shared volume; uncertainty fails closed. */
type CapacityProbe = (path: string) => Promise<{ bavail: number; bsize: number }>;
export async function hasVolumeCapacity(dir: string, incomingBytes: number, probe: CapacityProbe = statfs) {
  try {
    const info = await probe(dir);
    const available = info.bavail * info.bsize;
    return Number.isSafeInteger(available) && Number.isSafeInteger(incomingBytes) && incomingBytes >= 0 && available >= VOLUME_RESERVE_BYTES + incomingBytes;
  } catch { return false; }
}

/** Creates only the fixed public-media directory under the mounted volume. */
export async function initializeGeffen(root: string | undefined, mount: string | undefined, probe?: CapacityProbe) {
  if (!root || !mount || !path.isAbsolute(root) || !path.isAbsolute(mount)) return error(503);
  const base = path.resolve(mount), target = path.join(base, 'geffen-public');
  if (!samePath(path.resolve(root), target)) return error(503);
  try {
    if (!(await lstat(base)).isDirectory() || !samePath(await realpath(base), base) || !await hasVolumeCapacity(base, 0, probe)) return error(503);
    for (const dir of [target, path.join(target, 'audio'), path.join(target, 'courses')]) {
      try { await mkdir(dir, { mode: 0o700 }); }
      catch (e) { if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e; }
      const info = await lstat(dir);
      if (!info.isDirectory() || info.isSymbolicLink() || !samePath(await realpath(dir), dir)) return error(503);
    }
    return ok();
  } catch { return error(503); }
}

async function boundedBody(request: Request, maximum: number): Promise<Buffer | null> {
  const declared = request.headers.get('content-length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > maximum)) return null;
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) { await reader.cancel(); return null; }
      chunks.push(value);
    }
    return Buffer.concat(chunks, size);
  } catch { return null; } finally { reader.releaseLock(); }
}

const digest = (buffer: Buffer) => createHash('sha256').update(buffer).digest('hex');
function audioSignature(name: string, bytes: Buffer) {
  if (name.endsWith('.wav')) return bytes.length > 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WAVE';
  return bytes.length > 3 && (bytes.subarray(0, 3).toString('ascii') === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0));
}

// Exclusive temporary file and atomic publication; never overwrite hash-named media.
async function publish(dir: string, name: string, bytes: Buffer, replace: boolean) {
  const temporary = path.join(dir, `.geffen-${randomUUID()}.tmp`), destination = path.join(dir, name);
  try {
    const file = await open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0), 0o600);
    try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
    if (!samePath(await realpath(dir), dir)) return false;
    if (replace) {
      try { const entry = await lstat(destination); if (!entry.isFile() || entry.isSymbolicLink()) return false; } catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') return false; }
      await rename(temporary, destination);
    } else await link(temporary, destination);
    return true;
  } catch { return false; } finally { try { await unlink(temporary); } catch { /* already renamed or absent */ } }
}

async function audioMatches(root: string, name: string, sha: string) {
  const opened = await safeOpen(root, ['audio', name]);
  if (!opened) return false;
  try {
    if (!opened.info.size || opened.info.size > MAX_AUDIO_BYTES) return false;
    const bytes = await opened.file.readFile();
    return digest(bytes) === sha && audioSignature(name, bytes);
  } catch { return false; } finally { await opened.file.close(); }
}

export async function ingestGeffen(request: Request, kind: string, name: string, root: string | undefined, probe?: CapacityProbe) {
  if (kind !== 'audio' && kind !== 'courses') return error(404);
  if (kind === 'audio' ? !/^[a-f0-9]{64}\.(mp3|wav)$/.test(name) : !/^[A-Za-z0-9_-]+\.json$/.test(name)) return error(400);
  const dir = await directory(root, kind);
  if (!dir || !root) return error(503);
  const body = await boundedBody(request, kind === 'audio' ? MAX_AUDIO_BYTES : MAX_INDEX_BYTES);
  if (!body || !body.length) return error(413);
  if (!await hasVolumeCapacity(dir, body.length, probe)) return error(503);
  if (kind === 'audio') {
    const sha = name.slice(0, 64);
    if (digest(body) !== sha || !audioSignature(name, body)) return error(400);
    if (await audioMatches(root, name, sha)) return ok();
    if (!await publish(dir, name, body, false)) return error(409);
    return ok();
  }
  try {
    const parsed = cleanIndex(JSON.parse(body.toString('utf8')), name.slice(0, -5));
    if (!parsed || parsed.recordings.length === 0) return error(400);
    for (const item of parsed.recordings) {
      const audio = item.src.slice('/audio/geffen-read-aloud/'.length);
      if (!await audioMatches(root, audio, item.audioSha256)) return error(409);
    }
    return await publish(dir, name, Buffer.from(JSON.stringify(parsed)), true) ? ok() : error(409);
  } catch { return error(400); }
}
