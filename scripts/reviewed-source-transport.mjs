import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createReadStream, createWriteStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { storageRequest } from './self-directed-storage.mjs';

const prefix = 'config/reviewed-public-assets/';
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const size = value => Number.isSafeInteger(value) && value >= 0;
const safe = value => typeof value === 'string' && !/[\\:\x00-\x1f\x7f]/.test(value) && value.split('/').every(part => part && part !== '.' && part !== '..' && !/[. ]$/.test(part));
const equal = (a, b) => a.bytes === b.bytes && a.sha256 === b.sha256;
const valid = entry => entry && size(entry.bytes) && digest(entry.sha256);

// Reviewed-source requests never follow redirects. This leaves the existing
// immutable-base downloader unchanged while enforcing HTTPS on every new hop.
export async function downloadReviewedPackage(url, headers, destination, item, timeoutMs = 600000, fetchImpl = fetch) {
  if (new URL(url).protocol !== 'https:') throw Error('Invalid reviewed package protocol');
  try {
    const response = await fetchImpl(url, { headers, redirect: 'error', signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok || !response.body) throw Error('Reviewed asset download HTTP ' + response.status);
    let bytes = 0;
    const hash = createHash('sha256');
    const verifier = new Transform({ transform(chunk, encoding, callback) {
      bytes += chunk.length;
      if (bytes > item.bytes) return callback(Error('Reviewed package exceeds expected size'));
      hash.update(chunk); callback(null, chunk);
    } });
    await pipeline(Readable.fromWeb(response.body), verifier, createWriteStream(destination, { flags: 'w' }));
    if (bytes !== item.bytes || hash.digest('hex') !== item.sha256) throw Error('Reviewed package checksum mismatch');
  } catch (error) {
    await fs.rm(destination, { force: true });
    throw error;
  }
}

// Every transported byte must be a raw reviewed source or an exact ZIP recipe
// blob already declared by the existing reviewed-public-assets index.
export function reviewedSourceIdentities(reviewed) {
  if (reviewed?.format !== 'reviewed-public-assets-v1' || !Array.isArray(reviewed.files)) throw Error('Invalid reviewed source index');
  const sources = new Map();
  const publicPaths = new Set();
  function add(source) {
    const previous = sources.get(source.path);
    if (previous && !equal(previous, source)) throw Error('Conflicting reviewed source identity');
    sources.set(source.path, source);
  }
  for (const entry of reviewed.files) {
    if (!valid(entry) || !safe(entry.path) || !entry.path.startsWith('public/') || publicPaths.has(entry.path.toLowerCase())) throw Error('Invalid reviewed public identity');
    publicPaths.add(entry.path.toLowerCase());
    if (!entry.recipe) add({ path: prefix + 'files/' + entry.path, bytes: entry.bytes, sha256: entry.sha256 });
    else {
      if (entry.recipe.format !== 'zip-records-v1' || !valid(entry.recipe.base) || !Array.isArray(entry.recipe.parts) || !entry.recipe.parts.length) throw Error('Invalid reviewed source recipe');
      let total = 0;
      for (const part of entry.recipe.parts) {
        if (!valid(part) || !part.bytes) throw Error('Invalid reviewed source part');
        total += part.bytes;
        if (!Number.isSafeInteger(total)) throw Error('Reviewed source length overflow');
        if (part.kind === 'base') {
          if (!size(part.offset) || part.offset > entry.recipe.base.bytes - part.bytes) throw Error('Invalid reviewed source base range');
        } else if (part.kind === 'blob') {
          if (part.path !== 'blobs/' + part.sha256 + '.bin') throw Error('Invalid reviewed source blob');
          add({ path: prefix + part.path, bytes: part.bytes, sha256: part.sha256 });
        } else throw Error('Invalid reviewed source part kind');
      }
      if (total !== entry.bytes) throw Error('Invalid reviewed source recipe length');
    }
  }
  const canonical = new Set();
  for (const source of sources.values()) {
    if (canonical.has(source.path.toLowerCase())) throw Error('Duplicate reviewed source path');
    canonical.add(source.path.toLowerCase());
  }
  return sources;
}

export function validateReviewedSourceTransport(transport, reviewed) {
  if (transport?.format !== 'reviewed-public-source-transport-v1' || !Array.isArray(transport.packages)) throw Error('Invalid reviewed source transport');
  const expected = reviewedSourceIdentities(reviewed);
  const covered = new Set();
  const keys = new Set();
  for (const item of transport.packages) {
    if (!valid(item) || !item.bytes || item.key !== 'one-dhs-unified/20261023/reviewed-source-' + item.sha256 + '.bin' || keys.has(item.key) || !Array.isArray(item.files) || !item.files.length) throw Error('Invalid reviewed source package');
    keys.add(item.key);
    let offset = 0;
    for (const file of item.files) {
      const identity = expected.get(file.path);
      if (!identity || !valid(file) || !equal(file, identity) || file.offset !== offset || covered.has(file.path)) throw Error('Invalid reviewed source package coverage');
      offset += file.bytes;
      if (!Number.isSafeInteger(offset) || offset > item.bytes) throw Error('Invalid reviewed source package bounds');
      covered.add(file.path);
    }
    if (offset !== item.bytes) throw Error('Reviewed source package length mismatch');
  }
  if (covered.size !== expected.size || [...expected.keys()].some(file => !covered.has(file))) throw Error('Missing reviewed source package coverage');
  return { packages: transport.packages, sources: expected };
}

export async function fileIdentity(filename) {
  const stat = await fs.lstat(filename);
  if (!stat.isFile() || stat.isSymbolicLink()) throw Error('Reviewed source is not a regular file');
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return { bytes: stat.size, sha256: hash.digest('hex') };
}

async function safeDestination(root, relative, createParents = false) {
  if (!safe(relative) || !relative.startsWith(prefix + 'files/public/') && !/^config\/reviewed-public-assets\/blobs\/[a-f0-9]{64}\.bin$/.test(relative)) throw Error('Reviewed source destination outside approved root');
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(root + path.sep)) throw Error('Reviewed source destination escaped root');
  let current = root;
  for (const component of relative.split('/').slice(0, -1)) {
    current = path.join(current, component);
    if (createParents) await fs.mkdir(current).catch(error => { if (error.code !== 'EEXIST') throw error; });
    const stat = await fs.lstat(current).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    if (stat && (!stat.isDirectory() || stat.isSymbolicLink())) throw Error('Unsafe reviewed source parent');
  }
  const stat = await fs.lstat(resolved).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
  if (stat && (!stat.isFile() || stat.isSymbolicLink())) throw Error('Unsafe reviewed source destination');
  return resolved;
}

async function rangeToFile(archive, file, target) {
  const hash = createHash('sha256');
  let bytes = 0;
  if (file.bytes) {
    const verifier = new Transform({ transform(chunk, encoding, callback) {
      bytes += chunk.length;
      if (bytes > file.bytes) return callback(Error('Reviewed source exceeds declared size'));
      hash.update(chunk);
      callback(null, chunk);
    } });
    await pipeline(createReadStream(archive, { start: file.offset, end: file.offset + file.bytes - 1 }), verifier, createWriteStream(target, { flags: 'wx' }));
  } else await fs.writeFile(target, '', { flag: 'wx' });
  if (bytes !== file.bytes || hash.digest('hex') !== file.sha256) throw Error('Reviewed source checksum mismatch');
}

export async function hydrateReviewedSources(root = process.cwd(), reviewed, options = {}) {
  root = path.resolve(root);
  reviewed ??= JSON.parse(await fs.readFile(path.join(root, prefix, 'index.json'), 'utf8'));
  const transport = options.transport ?? JSON.parse(await fs.readFile(path.join(root, 'config/reviewed-public-source-transport.json'), 'utf8'));
  const plan = validateReviewedSourceTransport(transport, reviewed);
  const missing = new Set();
  for (const file of plan.sources.values()) {
    const target = await safeDestination(root, file.path);
    const current = await fileIdentity(target).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    if (!current || !equal(current, file)) missing.add(file.path);
  }
  if (!missing.size) return { restored: 0, verified: plan.sources.size };
  const credentials = options.credentials ?? { endpoint: process.env.SERIES_ASSET_ENDPOINT, bucketName: process.env.SERIES_ASSET_BUCKET, region: process.env.SERIES_ASSET_REGION, accessKeyId: process.env.SERIES_ASSET_ACCESS_KEY_ID, secretAccessKey: process.env.SERIES_ASSET_SECRET_ACCESS_KEY };
  if (Object.values(credentials).some(value => !value)) throw Error('Existing reviewed asset store is unavailable');
  const endpoint = new URL(credentials.endpoint);
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== '/') throw Error('Invalid reviewed asset store endpoint');
  const download = options.download ?? downloadReviewedPackage;
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'reviewed-source-transport-'));
  const prepared = [];
  try {
    // Prepare and verify all missing sources before replacing any source file.
    for (const item of plan.packages) {
      if (!item.files.some(file => missing.has(file.path))) continue;
      const archive = path.join(temporary, item.sha256 + '.bin');
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { url, headers } = storageRequest(credentials, item.key);
          await download(url, headers, archive, item);
          break;
        } catch {
          if (attempt === 2) throw Error('Verified reviewed source package download failed');
        }
      }
      // Defense in depth also covers alternate download implementations in tests.
      if (!equal(await fileIdentity(archive), item)) throw Error('Reviewed source package checksum mismatch');
      for (const file of item.files) {
        if (!missing.has(file.path)) continue;
        const candidate = path.join(temporary, 'source-' + prepared.length + '.bin');
        await rangeToFile(archive, file, candidate);
        prepared.push({ file, candidate });
      }
      await fs.rm(archive);
    }
    for (const { file, candidate } of prepared) {
      const target = await safeDestination(root, file.path, true);
      await fs.copyFile(candidate, target);
      if (!equal(await fileIdentity(target), file)) throw Error('Restored reviewed source checksum mismatch');
    }
    return { restored: prepared.length, verified: plan.sources.size };
  } finally {
    const resolved = path.resolve(temporary);
    if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('reviewed-source-transport-')) throw Error('Unexpected reviewed source temporary root');
    await fs.rm(resolved, { recursive: true, force: true });
  }
}
