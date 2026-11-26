import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Large public files (slides, images, video, audio and documents) that the Docker build moved to
 * the media bucket after every build-time check passed (scripts/public-offload.mjs). The image
 * keeps this list instead of the bytes; the proxy answers those addresses from the bucket and
 * server checks that once looked at the file on disk read its recorded identity here.
 *
 * No list (local development, tests, a build without the offload step) means nothing moved and
 * every file is still on disk. This module has no "server-only" import because the proxy uses it.
 */
export type OffloadedPublicFile = {
  /** SHA-256 of the exact bytes that passed the build's checks; also the object name. */
  sha256: string;
  bytes: number;
  type: string;
  /** First bytes of the file (base64), for checks that only inspect a file's header. */
  head: string;
};

export const PUBLIC_OFFLOAD_FORMAT = "one-dsd-public-offload-v1";
export const PUBLIC_OFFLOAD_MANIFEST = "public-offload.json";
export const PUBLIC_OFFLOAD_PREFIX = "public-offload/";

const SHA256 = /^[a-f0-9]{64}$/;
const PUBLIC_PATH = /^\/(?:[^/\\\0]+\/)*[^/\\\0]+$/;

let cached: { file: string; files: ReadonlyMap<string, OffloadedPublicFile> } | undefined;

function validEntry(publicPath: string, value: unknown): value is OffloadedPublicFile {
  if (!PUBLIC_PATH.test(publicPath) || publicPath.split("/").some(part => part === "." || part === "..")) return false;
  const entry = value as Partial<OffloadedPublicFile> | null;
  return !!entry && typeof entry.sha256 === "string" && SHA256.test(entry.sha256)
    && Number.isSafeInteger(entry.bytes) && (entry.bytes as number) > 0
    && typeof entry.type === "string" && /^[a-z]+\/[a-z0-9.+-]+$/.test(entry.type)
    && typeof entry.head === "string";
}

/** The offloaded files, keyed by decoded public path ("/learning/x/slide-1.webp"). */
export function publicOffloadFiles(root = process.cwd()): ReadonlyMap<string, OffloadedPublicFile> {
  const file = path.join(root, PUBLIC_OFFLOAD_MANIFEST);
  if (cached?.file === file) return cached.files;
  const files = new Map<string, OffloadedPublicFile>();
  if (existsSync(file)) {
    try {
      const raw = JSON.parse(readFileSync(file, "utf8")) as { format?: unknown; files?: Record<string, unknown> };
      if (raw.format === PUBLIC_OFFLOAD_FORMAT && raw.files && typeof raw.files === "object") {
        for (const [publicPath, entry] of Object.entries(raw.files)) if (validEntry(publicPath, entry)) files.set(publicPath, entry);
      }
    } catch {
      // An unreadable list moves nothing; the files it named are simply unavailable, as a missing file was.
    }
  }
  cached = { file, files };
  return files;
}

/** The offloaded file at a decoded public path, if the build moved it. */
export function offloadedPublicFile(publicPath: string, root = process.cwd()): OffloadedPublicFile | undefined {
  return publicOffloadFiles(root).get(publicPath);
}

/**
 * The offloaded file for an absolute path under the app's own public folder. Paths under any other
 * root (a test fixture, a volume) are never looked up, so the list only speaks for files it moved.
 */
export function offloadedFileAt(file: string, root = process.cwd()): OffloadedPublicFile | undefined {
  const publicRoot = path.join(root, "public");
  const resolved = path.resolve(file);
  if (!resolved.startsWith(publicRoot + path.sep)) return undefined;
  return offloadedPublicFile("/" + path.relative(publicRoot, resolved).split(path.sep).join("/"), root);
}

/** existsSync for public files that also counts a file the build moved to the bucket. */
export function publicFileAvailable(file: string, root = process.cwd()): boolean {
  return existsSync(file) || offloadedFileAt(file, root) !== undefined;
}

/** Test hook: forget the cached list. */
export function resetPublicOffloadCache() {
  cached = undefined;
}
