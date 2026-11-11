import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { hydrateReviewedSources } from './reviewed-source-transport.mjs';

const root = process.cwd();
const reviewedRoot = path.resolve(root, 'config/reviewed-public-assets');
const sourceRoot = path.join(reviewedRoot, 'files');
const publicRoot = path.resolve(root, 'public');
const manifest = JSON.parse(await fs.readFile(path.join(reviewedRoot, 'index.json'), 'utf8'));
if (manifest.format !== 'reviewed-public-assets-v1' || !Array.isArray(manifest.files)) throw Error('Invalid reviewed asset manifest');
await hydrateReviewedSources(root, manifest);
const digestPattern = /^[a-f0-9]{64}$/;
const validSize = value => Number.isSafeInteger(value) && value >= 0;
const safeRelative = value => typeof value === 'string' && !value.includes('\\') && !value.includes(':') && value.split('/').every(part => part && part !== '.' && part !== '..' && !/[. ]$/.test(part));
const under = (base, relative) => {
  const result = path.resolve(base, relative);
  if (!result.startsWith(base + path.sep)) throw Error('Reviewed asset outside approved root');
  return result;
};
function validIdentity(entry) {
  return validSize(entry.bytes) && digestPattern.test(entry.sha256);
}
async function identity(filename) {
  const stat = await fs.stat(filename);
  if (!stat.isFile()) throw Error('Reviewed asset is not a file');
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return { bytes: stat.size, sha256: hash.digest('hex') };
}
const equal = (first, second) => first.bytes === second.bytes && first.sha256 === second.sha256;

// Recipes concatenate exact original compressed ZIP records and reviewed new
// records. They do not recompress Office files or change their reviewed hashes.
const paths = new Set();
const entries = manifest.files.map(entry => {
  const canonicalPath = typeof entry.path === 'string' ? entry.path.toLowerCase() : '';
  if (!safeRelative(entry.path) || !entry.path.startsWith('public/') || paths.has(canonicalPath) || !validIdentity(entry)) throw Error('Invalid or duplicate reviewed asset identity');
  paths.add(canonicalPath);
  const target = under(root, entry.path);
  if (!target.startsWith(publicRoot + path.sep)) throw Error('Reviewed target outside public');
  if (!entry.recipe) return { entry, target, source: under(sourceRoot, entry.path) };
  const recipe = entry.recipe;
  if (recipe.format !== 'zip-records-v1' || !validIdentity(recipe.base) || !Array.isArray(recipe.parts) || recipe.parts.length === 0) throw Error('Invalid reviewed ZIP recipe');
  let total = 0;
  for (const part of recipe.parts) {
    if (!validIdentity(part) || part.bytes === 0) throw Error('Invalid ZIP recipe part identity');
    total += part.bytes;
    if (!Number.isSafeInteger(total)) throw Error('ZIP recipe length exceeds safe bounds');
    if (part.kind === 'base') {
      if (!validSize(part.offset) || part.offset > recipe.base.bytes - part.bytes) throw Error('ZIP recipe source range is out of bounds');
    } else if (part.kind === 'blob') {
      if (!safeRelative(part.path) || !/^blobs\/[a-f0-9]{64}\.bin$/.test(part.path) || part.path !== `blobs/${part.sha256}.bin`) throw Error('Invalid ZIP recipe blob path');
      under(reviewedRoot, part.path);
    } else throw Error('Invalid ZIP recipe part kind');
  }
  if (total !== entry.bytes) throw Error('ZIP recipe total length mismatch');
  return { entry, target };
});

const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'reviewed-public-assets-'));
const prepared = [];
let reused = 0;
let superseded = 0;
const releaseManifest = JSON.parse(await fs.readFile(path.join(root, 'config/railway-release-assets.json'), 'utf8'));
const releaseIdentity = new Map((releaseManifest.assets ?? []).filter(validIdentity).map(asset => [asset.path, { bytes: asset.bytes, sha256: asset.sha256 }]));
try {
  // Check or reconstruct every candidate before replacing any public file.
  for (const row of entries) {
    const { entry, target } = row;
    if (!entry.recipe) {
      if (!equal(await identity(row.source), entry)) throw Error('Reviewed asset checksum mismatch: ' + entry.path);
      prepared.push(row);
      continue;
    }
    const existing = await identity(target);
    if (equal(existing, entry)) {
      reused++;
      continue;
    }
    // A later release may replace a reviewed file (for example the course decks corrected on 2026-11-10).
    // Accept the file only when it is exactly the current release's recorded identity for this path; the final
    // gate (verify-railway-release-assets.mjs) checks every release asset against that same record.
    const released = releaseIdentity.get(entry.path);
    if (released && !equal(released, entry) && equal(existing, released)) {
      superseded++;
      continue;
    }
    if (!equal(existing, entry.recipe.base)) throw Error('ZIP recipe original checksum mismatch: ' + entry.path);
    const candidate = path.join(temporary, randomUUID() + '.zip');
    const output = await fs.open(candidate, 'wx');
    const fullHash = createHash('sha256');
    let bytes = 0;
    try {
      for (const part of entry.recipe.parts) {
        const source = part.kind === 'base' ? target : under(reviewedRoot, part.path);
        if (part.kind === 'blob') {
          const stat = await fs.stat(source);
          if (!stat.isFile() || stat.size !== part.bytes) throw Error('ZIP recipe blob size mismatch');
        }
        const stream = part.kind === 'base'
          ? createReadStream(source, { start: part.offset, end: part.offset + part.bytes - 1, highWaterMark: 1024 * 1024 })
          : createReadStream(source, { highWaterMark: 1024 * 1024 });
        const partHash = createHash('sha256');
        let partBytes = 0;
        for await (const chunk of stream) {
          partHash.update(chunk);
          fullHash.update(chunk);
          partBytes += chunk.length;
          let written = 0;
          while (written < chunk.length) {
            const result = await output.write(chunk, written, chunk.length - written, null);
            if (!result.bytesWritten) throw Error('Cannot write reconstructed ZIP');
            written += result.bytesWritten;
          }
        }
        if (partBytes !== part.bytes || partHash.digest('hex') !== part.sha256) throw Error('ZIP recipe part checksum mismatch: ' + entry.path);
        bytes += partBytes;
      }
    } finally {
      await output.close();
    }
    if (bytes !== entry.bytes || fullHash.digest('hex') !== entry.sha256) throw Error('Reconstructed ZIP checksum mismatch: ' + entry.path);
    prepared.push({ entry, target, source: candidate });
  }
  for (const { entry, target, source } of prepared) {
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(source, target);
    if (!equal(await identity(target), entry)) throw Error('Applied asset checksum mismatch: ' + entry.path);
  }
  console.log(`Applied ${prepared.length} verified reviewed public assets; ${reused} reconstructed assets already match; ${superseded} replaced by a newer release asset.`);
} finally {
  // Only the absolute temporary folder created by this process is removed.
  const resolved = path.resolve(temporary);
  if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('reviewed-public-assets-')) throw Error('Unexpected reviewed temporary root');
  await fs.rm(resolved, { recursive: true, force: true });
}
