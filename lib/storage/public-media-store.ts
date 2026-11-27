import "server-only";
import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { link, lstat, mkdir, open, readdir, realpath, rename, statfs, unlink } from "node:fs/promises";
import path from "node:path";
import { PassThrough, Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { getMediaObject, headMediaObject, listMediaNames, mediaBucketConfiguration, putMediaObject, type MediaBucketConfiguration } from "./media-bucket";

/**
 * Where the owner-published public media lives: course media, leadership videos and the read-aloud
 * recordings and indexes. All three publishers share one tree, `geffen-public`.
 *
 * PAC_PUBLIC_MEDIA_STORE unset or "volume" (today's default) keeps the tree on the persistent
 * volume at PAC_GEFFEN_PUBLIC_MEDIA_ROOT. "bucket" keeps it under `geffen-public/` in the private
 * media bucket (./media-bucket.ts), so the service can run without a volume.
 *
 * A root is a string either way, so the publishers keep one shape: a volume root is an absolute
 * path, and the bucket root is BUCKET_MEDIA_ROOT, which is deliberately not a path, so any file
 * system call that is ever handed it refuses it.
 */
export const BUCKET_MEDIA_ROOT = "bucket:geffen-public";
const BUCKET_PREFIX = "geffen-public";
const SEGMENT = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/;
export const VOLUME_RESERVE_BYTES = 2 * 1024 * 1024 * 1024;

export type PublicMediaStore = "volume" | "bucket";

export function publicMediaStore(environment: NodeJS.ProcessEnv = process.env): PublicMediaStore {
  const configured = environment.PAC_PUBLIC_MEDIA_STORE?.trim().toLowerCase();
  if (!configured || configured === "volume") return "volume";
  if (configured === "bucket") return "bucket";
  throw new Error("PAC_PUBLIC_MEDIA_STORE must be volume or bucket.");
}

const same = (a: string, b: string) => process.platform === "win32" ? path.normalize(a).toLowerCase() === path.normalize(b).toLowerCase() : path.normalize(a) === path.normalize(b);

function bucketFor(root: string | undefined): MediaBucketConfiguration | undefined {
  return root === BUCKET_MEDIA_ROOT && publicMediaStore() === "bucket" ? mediaBucketConfiguration() : undefined;
}

const validSegments = (segments: string[]) => segments.every(segment => SEGMENT.test(segment) && !segment.includes(".."));
const bucketKey = (segments: string[]) => [BUCKET_PREFIX, ...segments].join("/");

/**
 * The publishers' root. In the volume store it is the configured directory, and only when it is
 * `geffen-public` directly under the mounted volume. In the bucket store it is the bucket root
 * once the bucket is configured; until then publishing and serving stay off.
 */
export function configuredPublicMediaRoot(root: string | undefined, mount: string | undefined) {
  if (publicMediaStore() === "bucket") return mediaBucketConfiguration() ? BUCKET_MEDIA_ROOT : undefined;
  if (!root || !mount || !path.isAbsolute(root) || !path.isAbsolute(mount)) return undefined;
  return same(path.resolve(root), path.join(path.resolve(mount), "geffen-public")) ? path.resolve(root) : undefined;
}

/** The read-aloud root, which has never required the mount check: the configured directory, or the bucket. */
export function readAloudMediaRoot(environment: NodeJS.ProcessEnv = process.env) {
  if (publicMediaStore(environment) === "bucket") return mediaBucketConfiguration(environment) ? BUCKET_MEDIA_ROOT : undefined;
  return environment.PAC_GEFFEN_PUBLIC_MEDIA_ROOT || undefined;
}

export type StoredFile = {
  size: number;
  bytes(): Promise<Buffer>;
  /** An inclusive byte range, streamed. The stream releases the file when it ends. */
  stream(start: number, end: number): Readable;
  close(): Promise<void>;
};

/** Read a small current file without a separate bucket HEAD round trip.
 * The byte limit is enforced while streaming, even if Content-Length is absent
 * or incorrect. Volume reads retain all of openStoredFile's path checks. */
export async function readStoredFile(root: string | undefined, segments: string[], maximum: number): Promise<Buffer | null> {
  if (!segments.length || !validSegments(segments) || !Number.isSafeInteger(maximum) || maximum <= 0) return null;
  const bucket = bucketFor(root);
  if (bucket) {
    try {
      const response = await getMediaObject(bucket, bucketKey(segments));
      if (!response?.body) return null;
      const length = response.headers.get("content-length");
      if (length !== null && (!/^\d+$/.test(length) || !Number.isSafeInteger(Number(length)) || Number(length) > maximum)) {
        await response.body.cancel(); return null;
      }
      const reader = response.body.getReader();
      try {
        const chunks: Uint8Array[] = []; let size = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) return size ? Buffer.concat(chunks, size) : null;
          size += value.byteLength;
          if (size > maximum) { await reader.cancel(); return null; }
          chunks.push(value);
        }
      } finally { reader.releaseLock(); }
    } catch { return null; }
  }
  const opened = await openStoredFile(root, segments);
  if (!opened) return null;
  try {
    if (!opened.size || opened.size > maximum) return null;
    const bytes = await opened.bytes();
    return bytes.length > 0 && bytes.length <= maximum ? bytes : null;
  } catch { return null; } finally { await opened.close(); }
}

/**
 * Open one stored file. On the volume it refuses symbolic links and junctions anywhere in the root
 * or the requested path, and on Linux checks the open descriptor too, closing a parent-path race.
 */
export async function openStoredFile(root: string | undefined, segments: string[]): Promise<StoredFile | null> {
  if (!segments.length || !validSegments(segments)) return null;
  const bucket = bucketFor(root);
  if (bucket) {
    const key = bucketKey(segments);
    let size: number | null;
    try { size = await headMediaObject(bucket, key); } catch { return null; }
    if (size === null) return null;
    const read = async (range?: [number, number]) => {
      const response = await getMediaObject(bucket, key, range);
      if (!response?.body) throw new Error("Stored media is unavailable");
      return response;
    };
    return {
      size,
      bytes: async () => Buffer.from(await (await read()).arrayBuffer()),
      stream: (start, end) => {
        const output = new PassThrough();
        read([start, end]).then(
          response => { Readable.fromWeb(response.body as NodeReadableStream).on("error", error => output.destroy(error)).pipe(output); },
          error => output.destroy(error instanceof Error ? error : new Error("Stored media is unavailable")),
        );
        return output;
      },
      close: async () => undefined,
    };
  }
  if (!root || !path.isAbsolute(root)) return null;
  try {
    const base = path.resolve(root);
    if (!same(await realpath(base), base) || !(await lstat(base)).isDirectory()) return null;
    let current = base;
    for (let i = 0; i < segments.length; i++) {
      current = path.join(current, segments[i]);
      const info = await lstat(current);
      if (info.isSymbolicLink() || (i < segments.length - 1 ? !info.isDirectory() : !info.isFile())) return null;
    }
    if (!same(await realpath(current), current)) return null;
    const file = await open(current, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    const info = await file.stat();
    if (!info.isFile()) { await file.close(); return null; }
    if (process.platform === "linux") {
      try {
        if (!same(await realpath(`/proc/self/fd/${file.fd}`), current)) { await file.close(); return null; }
      } catch { await file.close(); return null; }
    }
    let closed = false;
    const close = async () => { if (!closed) { closed = true; await file.close(); } };
    return {
      size: info.size,
      bytes: () => file.readFile(),
      stream: (start, end) => {
        closed = true; // the stream closes the descriptor when it ends
        return file.createReadStream({ start, end, autoClose: true });
      },
      close,
    };
  } catch { return null; }
}

/** Whether a publisher's folder exists and is a real directory. The bucket has no folders, so it is always ready. */
export async function storedFolderReady(root: string | undefined, segments: string[]): Promise<boolean> {
  if (!validSegments(segments)) return false;
  if (bucketFor(root)) return true;
  if (!root || !path.isAbsolute(root)) return false;
  try {
    let current = path.resolve(root);
    for (const part of [null, ...segments]) {
      if (part) current = path.join(current, part);
      const info = await lstat(current);
      if (!info.isDirectory() || info.isSymbolicLink() || !same(await realpath(current), current)) return false;
    }
    return true;
  } catch { return false; }
}

/** Create a publisher's folders. Nothing to create in the bucket. */
export async function createStoredFolders(root: string | undefined, folders: string[][]): Promise<boolean> {
  if (!folders.every(validSegments)) return false;
  if (bucketFor(root)) return true;
  if (!root || !path.isAbsolute(root)) return false;
  try {
    for (const segments of folders) {
      const dir = path.join(path.resolve(root), ...segments);
      try { await mkdir(dir, { mode: 0o700 }); } catch (e) { if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e; }
      const info = await lstat(dir);
      if (!info.isDirectory() || info.isSymbolicLink() || !same(await realpath(dir), dir)) return false;
    }
    return true;
  } catch { return false; }
}

/** The names of the files in one folder, or null when it cannot be read. */
export async function listStoredNames(root: string | undefined, segments: string[]): Promise<string[] | null> {
  if (!validSegments(segments)) return null;
  const bucket = bucketFor(root);
  if (bucket) {
    try { return await listMediaNames(bucket, `${bucketKey(segments)}/`); } catch { return null; }
  }
  if (!await storedFolderReady(root, segments) || !root) return null;
  try { return await readdir(path.join(path.resolve(root), ...segments)); } catch { return null; }
}

type CapacityProbe = (path: string) => Promise<{ bavail: number; bsize: number }>;

/** Keep space for other services on a shared volume; uncertainty fails closed. */
export async function hasVolumeCapacity(dir: string, incomingBytes: number, probe: CapacityProbe = statfs) {
  try {
    const info = await probe(dir);
    const available = info.bavail * info.bsize;
    return Number.isSafeInteger(available) && Number.isSafeInteger(incomingBytes) && incomingBytes >= 0 && available >= VOLUME_RESERVE_BYTES + incomingBytes;
  } catch { return false; }
}

/** Room for an upload. The bucket has no fixed size, so only the volume is checked. */
export async function storedCapacity(root: string | undefined, segments: string[], incomingBytes: number, probe?: CapacityProbe) {
  if (bucketFor(root)) return Number.isSafeInteger(incomingBytes) && incomingBytes >= 0;
  if (!root || !path.isAbsolute(root) || !validSegments(segments)) return false;
  return hasVolumeCapacity(path.join(path.resolve(root), ...segments), incomingBytes, probe);
}

const MIME: Record<string, string> = {
  ".mp4": "video/mp4", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".png": "image/png",
  ".vtt": "text/vtt; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".json": "application/json",
};

/**
 * Store one complete file. Hash-named files are never replaced (`replace` false); a manifest or
 * index is replaced whole. On the volume a reader sees the whole old file or the whole new one.
 */
export async function writeStoredFile(root: string | undefined, segments: string[], bytes: Buffer, replace: boolean, temporaryPrefix = ".media"): Promise<boolean> {
  if (!segments.length || !validSegments(segments)) return false;
  const bucket = bucketFor(root);
  if (bucket) {
    try {
      return await putMediaObject(bucket, bucketKey(segments), bytes, MIME[path.extname(segments.at(-1) ?? "")] ?? "application/octet-stream", !replace);
    } catch { return false; }
  }
  if (!root || !path.isAbsolute(root)) return false;
  const dir = path.join(path.resolve(root), ...segments.slice(0, -1));
  const temp = path.join(dir, `${temporaryPrefix}-${randomUUID()}.tmp`), dest = path.join(dir, segments.at(-1)!);
  try {
    const file = await open(temp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0), 0o600);
    try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
    if (!same(await realpath(dir), dir)) return false;
    if (replace) {
      try { const info = await lstat(dest); if (!info.isFile() || info.isSymbolicLink()) return false; } catch (e) { if ((e as NodeJS.ErrnoException).code !== "ENOENT") return false; }
      await rename(temp, dest);
    } else await link(temp, dest);
    return true;
  } catch { return false; } finally { try { await unlink(temp); } catch { /* already renamed or absent */ } }
}
