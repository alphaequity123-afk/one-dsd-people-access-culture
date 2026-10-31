import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {storageRequest} from './self-directed-storage.mjs';

const digest = async file => createHash('sha256').update(await fs.readFile(file)).digest('hex');
const expected = [
  ...Array.from({length:9},(_,i)=>`public/learning/clas-curriculum/${String(i+1).padStart(2,'0')}/lesson.mp4`),
  ...Array.from({length:8},(_,i)=>`public/learning/equity-everyday-decisions/${String(i+1).padStart(2,'0')}/lesson.mp4`),
];
export function validate(manifest) {
 if(manifest.format!=='one-dsd-verified-video-transport-v1' || manifest.stageReceiptSha256!=='a694462bf2347d1b450b253f3873c9731d84da9086350119279b8c706fb53843' || !Array.isArray(manifest.items) || manifest.items.length!==17) throw Error('Video transport manifest is incomplete');
 if(manifest.items.some((x,i)=>x.path!==expected[i] || !/^[a-f0-9]{64}$/.test(x.sha256) || !Number.isSafeInteger(x.bytes) || x.bytes<=0 || x.key!==`one-dsd/equity-release-20261028/${x.sha256}.mp4`)) throw Error('Invalid video transport entry');
 return manifest.items;
}
async function plain(root,relative) {
 let current=path.resolve(root); const parts=relative.split('/');
 for(let ancestor=current;;ancestor=path.dirname(ancestor)) {
  try {const s=await fs.lstat(ancestor);if(s.isSymbolicLink())throw Error('Linked video transport root');}
  catch(e){if(e.code!=='ENOENT')throw e;}
  if(path.dirname(ancestor)===ancestor)break;
 }
 for(const part of ['',...parts]) {
  if(part)current=path.join(current,part);
  try {const s=await fs.lstat(current); if(s.isSymbolicLink())throw Error('Linked video transport path');}
  catch(e){if(e.code!=='ENOENT')throw e;}
 }
}
export async function restore(root,manifest,credentials,fetchImpl=fetch,tempId=randomUUID,linkImpl=fs.link) {
 const items=validate(manifest); root=path.resolve(root);
 for(const item of items) {
  await plain(root,item.path);const dest=path.join(root,...item.path.split('/'));let exists=true;
  try {await fs.access(dest);} catch(e) {if(e.code==='ENOENT')exists=false;else throw e;}
  if(exists) {const stat=await fs.stat(dest);if(!stat.isFile()||stat.size!==item.bytes||await digest(dest)!==item.sha256)throw Error('Existing video differs');continue;}
  if(Object.values(credentials).some(x=>!x)) throw Error('Existing asset store is unavailable');
  const endpoint=new URL(credentials.endpoint);
  if(endpoint.protocol!=='https:'||endpoint.hostname!=='t3.storageapi.dev'||endpoint.port||endpoint.username||endpoint.password||endpoint.pathname!=='/'||endpoint.search||endpoint.hash||!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(credentials.bucketName)||process.env.NODE_TLS_REJECT_UNAUTHORIZED==='0')throw Error('Strict asset transport is unavailable');
  await fs.mkdir(path.dirname(dest),{recursive:true});await plain(root,item.path);
  const identifier=tempId();if(!/^[a-f0-9-]{36}$/.test(identifier))throw Error('Invalid temporary identity');
  const temp=path.join(path.dirname(dest),'.restore-'+identifier+'.tmp');let file,owned=false,identity;
  try {
   const {url,headers}=storageRequest(credentials,item.key);
   const response=await fetchImpl(url,{headers,redirect:'error',signal:AbortSignal.timeout(600000)});
   if(!response.ok || !response.body)throw Error('Video download failed');
   file=await fs.open(temp,'wx');owned=true;identity=await file.stat();let bytes=0;const hash=createHash('sha256');
   for await(const chunk of response.body) {bytes+=chunk.length;if(bytes>item.bytes)throw Error('Video download exceeds expected size');hash.update(chunk);await file.writeFile(chunk);}
   if(bytes!==item.bytes || hash.digest('hex')!==item.sha256)throw Error('Downloaded video differs');
   await file.close();file=null;await plain(root,item.path);
   const before=await fs.lstat(temp);if(before.ino!==identity.ino||before.dev!==identity.dev||await digest(temp)!==item.sha256)throw Error('Downloaded temporary video changed');
   await linkImpl(temp,dest);const installed=await fs.lstat(dest);
   if(installed.ino!==identity.ino||installed.dev!==identity.dev||installed.size!==item.bytes||await digest(dest)!==item.sha256)throw Error('Installed video changed');
  } finally {
   if(file)await file.close();
   if(owned) {const current=await fs.lstat(temp).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(current && current.ino===identity.ino && current.dev===identity.dev)await fs.unlink(temp);}
  }
 }
 console.log('Restored and verified 17 curriculum videos.');
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
 const manifest=JSON.parse(await fs.readFile('config/equity-video-transport.json','utf8'));
 const credentials={endpoint:process.env.SERIES_ASSET_ENDPOINT,bucketName:process.env.SERIES_ASSET_BUCKET,region:process.env.SERIES_ASSET_REGION,accessKeyId:process.env.SERIES_ASSET_ACCESS_KEY_ID,secretAccessKey:process.env.SERIES_ASSET_SECRET_ACCESS_KEY};
 await restore(process.cwd(),manifest,credentials);
}
