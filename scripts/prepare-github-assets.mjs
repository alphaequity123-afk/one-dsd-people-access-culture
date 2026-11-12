import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {downloadVerifiedPackage} from './download-verified-package.mjs';
import {storageRequest} from './self-directed-storage.mjs';
import {validateReviewedSourceTransport} from './reviewed-source-transport.mjs';

export function isLfsPointer(bytes) {
  return bytes.length < 1024 && /^version https:\/\/git-lfs.github.com\/spec\/v1\r?\noid sha256:[a-f0-9]{64}\r?\nsize \d+\r?\n?$/.test(bytes.toString('utf8'));
}
export function assetPath(root, relative) {
  if (typeof relative !== 'string' || !/^(public|models|config\/standalone-public-overrides\/files)\//.test(relative)
      || relative.includes('\\') || relative.includes(':') || relative.split('/').some(p => !p || p === '.' || p === '..')) throw Error('Invalid supplemental asset path');
  return path.join(root, relative);
}
export async function restoreSupplemental(root, manifest, credentials, download = downloadVerifiedPackage) {
  if (manifest.format !== 'one-dsd-github-assets-v1' || !Array.isArray(manifest.files)) throw Error('Invalid supplemental manifest');
  const seen = new Set();
  for (const item of manifest.files) {
    const target = assetPath(root, item.path);
    if (seen.has(item.path) || !Number.isSafeInteger(item.bytes) || item.bytes < 1 || !/^[a-f0-9]{64}$/.test(item.sha256)
        || item.key !== `one-dsd/github-assets/${item.sha256}`) throw Error('Invalid supplemental asset identity');
    seen.add(item.path);
    const current = await fs.readFile(target).catch(e => { if (e.code === 'ENOENT') return null; throw e; });
    if (current && current.length === item.bytes && createHash('sha256').update(current).digest('hex') === item.sha256) continue;
    if (current && !isLfsPointer(current)) throw Error('Supplemental asset checksum mismatch: ' + item.path);
    if (current && !current.toString().includes(`oid sha256:${item.sha256}`)) throw Error('Supplemental pointer identity mismatch: ' + item.path);
    if (Object.values(credentials).some(v => !v)) throw Error('Existing asset store is unavailable');
    const {url, headers} = storageRequest(credentials, item.key);
    if (new URL(url).protocol !== 'https:') throw Error('Asset transport requires HTTPS');
    await fs.mkdir(path.dirname(target), {recursive:true});
    const temporary = target + '.restore-' + randomUUID();
    try {
      for (let attempt=0; attempt<3; attempt++) {
        try { await download(url, headers, temporary, item); break; }
        catch (error) { if (attempt===2) throw error; await new Promise(resolve=>setTimeout(resolve,1500)); }
      }
      const bytes = await fs.readFile(temporary);
      if (bytes.length !== item.bytes || createHash('sha256').update(bytes).digest('hex') !== item.sha256) throw Error('Supplemental download checksum mismatch');
      await fs.rename(temporary, target);
    } finally { await fs.rm(temporary, {force:true}); }
  }
}

export async function prepareGithubAssets(root = process.cwd()) {
  const read = async p => JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
  const manifest = await read('config/github-supplemental-assets.json');
  const credentials = {endpoint:process.env.SERIES_ASSET_ENDPOINT,bucketName:process.env.SERIES_ASSET_BUCKET,region:process.env.SERIES_ASSET_REGION,accessKeyId:process.env.SERIES_ASSET_ACCESS_KEY_ID,secretAccessKey:process.env.SERIES_ASSET_SECRET_ACCESS_KEY};
  await restoreSupplemental(root,manifest,credentials);
  const release = await read('config/railway-release-assets.json');
  const reviewed = await read('config/reviewed-public-assets/index.json');
  const transport = validateReviewedSourceTransport(await read('config/reviewed-public-source-transport.json'), reviewed);
  const paths = new Set([...release.assets.map(x=>x.path),...transport.sources.keys(),...reviewed.files.map(x=>x.path),
    ...(await read('config/equity-video-transport.json')).items.map(x=>x.path),
    ...(await read('config/intercultural-video-transport.json')).items.map(x=>x.path)]);
  let removed = 0;
  for (const relative of paths) {
    if (!/^(public|models|config\/reviewed-public-assets)\//.test(relative) || relative.includes('\\') || relative.split('/').includes('..')) throw Error('Invalid restored asset path');
    const target = path.join(root,relative);
    const stat = await fs.stat(target).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
    if (stat && stat.size < 1024 && isLfsPointer(await fs.readFile(target))) { await fs.unlink(target); removed++; }
  }
  async function check(directory) {
    for (const entry of await fs.readdir(directory,{withFileTypes:true}).catch(e=>{if(e.code==='ENOENT')return [];throw e;})) {
      const filename=path.join(directory,entry.name);
      if (entry.isSymbolicLink()) throw Error('Linked asset path is not supported');
      if (entry.isDirectory()) await check(filename);
      else if (entry.isFile() && (await fs.stat(filename)).size < 1024 && isLfsPointer(await fs.readFile(filename))) {
        throw Error('Add this LFS asset to a verified transport manifest: ' + path.relative(root,filename));
      }
    }
  }
  for (const directory of ['public','models','config/standalone-public-overrides/files','config/reviewed-public-assets']) await check(path.join(root,directory));
  console.log(`Verified ${manifest.files.length} supplemental assets; cleared ${removed} LFS placeholders for the existing checksum-verified restoration steps.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await prepareGithubAssets();
