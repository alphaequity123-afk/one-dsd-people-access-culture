// Moves large public files out of the Docker image into the media bucket.
//
// Runs in the Dockerfile after `npm run build`, when every release, video, accessibility and
// curriculum check has already passed on the complete public folder. Each selected file is
// uploaded under its SHA-256 (public-offload/<sha256>), the list of moved files is written to
// public-offload.json, and only then are the files removed from public/. The running app answers
// those addresses from the bucket (proxy.ts -> /api/public-offload). Nothing is deleted from the
// bucket, so an older image keeps working.
//
// Only runs when PAC_PUBLIC_OFFLOAD=on (the Dockerfile sets it); local builds are unchanged.
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { headObject, mediaBucketConfiguration, putObject, signedBucketRequest } from "./storage/media-bucket.mjs";

export const FORMAT = "one-dsd-public-offload-v1";
export const PREFIX = "public-offload/";
export const MANIFEST = "public-offload.json";
export const MIN_BYTES = 64 * 1024;

export const CONTENT_TYPES = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", avif: "image/avif",
  mp4: "video/mp4", webm: "video/webm", mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", m4a: "audio/mp4",
  pdf: "application/pdf", zip: "application/zip",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

// Read from disk as files by server code (lib/learning/resource-media-renderer.ts chapter cards).
export const KEEP = new Set([
  "/learning/water-we-swim-in/06/image-3.webp", "/learning/water-we-swim-in/01/image-4.webp",
  "/learning/water-we-swim-in/04/image-4.webp", "/learning/water-we-swim-in/05/image-2.webp",
  "/learning/water-we-swim-in/05/image-4.webp",
]);

export function contentType(publicPath) {
  // Lower-case extensions only: proxy.ts matches these addresses case-sensitively.
  const extension = publicPath.match(/\.([a-z0-9]+)$/)?.[1];
  return extension ? CONTENT_TYPES[extension] : undefined;
}

export function selected(publicPath, bytes) {
  return bytes >= MIN_BYTES && !KEEP.has(publicPath) && contentType(publicPath) !== undefined;
}

async function walk(root, folder, out) {
  for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
    const full = path.join(folder, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) await walk(root, full, out);
    else if (entry.isFile()) {
      const publicPath = "/" + path.relative(root, full).split(path.sep).join("/");
      const { size } = await fs.stat(full);
      if (selected(publicPath, size)) out.push({ full, publicPath, size });
    }
  }
  return out;
}

async function listNames(config) {
  const names = new Set();
  let token;
  do {
    const { url, init } = signedBucketRequest(config, { method: "GET", key: null, query: { "list-type": "2", prefix: PREFIX, "max-keys": "1000", ...(token ? { "continuation-token": token } : {}) } });
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(60_000) });
    if (!response.ok) throw new Error(`Listing the media bucket answered ${response.status}.`);
    const xml = await response.text();
    for (const match of xml.matchAll(/<Key>([^<]+)<\/Key>/g)) if (match[1].startsWith(PREFIX)) names.add(match[1].slice(PREFIX.length));
    token = /<IsTruncated>true<\/IsTruncated>/.test(xml) ? /<NextContinuationToken>([^<]+)<\/NextContinuationToken>/.exec(xml)?.[1]?.replace(/&amp;/g, "&") : undefined;
  } while (token);
  return names;
}

async function pool(items, limit, task) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) await task(items[next++]);
  }));
}

export async function offload(projectRoot, config, { put = putObject, head = headObject, list = listNames, log = console.log } = {}) {
  const publicRoot = path.join(projectRoot, "public");
  const candidates = await walk(publicRoot, publicRoot, []);
  const files = {};
  const bySha = new Map();
  for (const item of candidates) {
    const bytes = await fs.readFile(item.full);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    files[item.publicPath] = { sha256, bytes: bytes.length, type: contentType(item.publicPath), head: bytes.subarray(0, 16).toString("base64") };
    if (!bySha.has(sha256)) bySha.set(sha256, item.full);
  }
  const existing = await list(config);
  const missing = [...bySha].filter(([sha256]) => !existing.has(sha256));
  let uploadedBytes = 0, done = 0;
  await pool(missing, 6, async ([sha256, full]) => {
    const bytes = await fs.readFile(full);
    if (createHash("sha256").update(bytes).digest("hex") !== sha256) throw new Error(`Changed during offload: ${full}`);
    await put(config, PREFIX + sha256, bytes, "application/octet-stream");
    const stored = await head(config, PREFIX + sha256);
    if (!stored || stored.size !== bytes.length) throw new Error(`The media bucket did not keep ${full}.`);
    uploadedBytes += bytes.length;
    if (++done % 100 === 0) log(`Uploaded ${done}/${missing.length} public files.`);
  });
  const manifest = { format: FORMAT, prefix: PREFIX, files: Object.fromEntries(Object.entries(files).sort(([a], [b]) => (a < b ? -1 : 1))) };
  const target = path.join(projectRoot, MANIFEST);
  await fs.writeFile(target + ".tmp", JSON.stringify(manifest) + "\n");
  await fs.rename(target + ".tmp", target);
  // Only after every object is confirmed in the bucket and the list is written.
  for (const item of candidates) await fs.unlink(item.full);
  const moved = candidates.reduce((sum, item) => sum + item.size, 0);
  log(`Public offload: ${candidates.length} files (${(moved / 1e6).toFixed(0)} MB) now served from the media bucket; ${missing.length} uploaded (${(uploadedBytes / 1e6).toFixed(0)} MB), ${bySha.size - missing.length} already there.`);
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.env.PAC_PUBLIC_OFFLOAD?.trim().toLowerCase() !== "on") {
    console.log("Public offload is off; public files stay in the image.");
  } else {
    const config = mediaBucketConfiguration();
    if (!config) throw new Error("PAC_PUBLIC_OFFLOAD=on needs the PAC_MEDIA_BUCKET_* settings at build time.");
    await offload(process.cwd(), config);
  }
}
