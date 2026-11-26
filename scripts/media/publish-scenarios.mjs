import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { mediaBucketConfiguration, headObject, putObject } from '../storage/media-bucket.mjs';
const root=process.cwd();
const config=mediaBucketConfiguration();
if(!config || process.env.PAC_PUBLIC_MEDIA_STORE!=='bucket') throw new Error('Configured public media bucket required');
const dir=path.join(root,'output/scenario-videos');
const expected=['cn-building-a-navigator-role','cn-culture-in-informed-choice','cn-navigating-disability-services-with-a-family','cn-navigators-and-system-change','cn-sustaining-the-navigator','cn-what-a-navigator-does','cn-working-alongside-a-navigator','cw-everyday-norms','cw-learning-organization','cw-pace-pressure-decisions','cw-sustainable-pace','cw-trauma-informed-teams','cw-workload-burnout'];
async function retry(operation){
 for(let attempt=0;;attempt++){try{return await operation();}catch(error){if(attempt>=3)throw error;await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));}}
}
const sha=b=>createHash('sha256').update(b).digest('hex');
const entries=[];
for(const id of expected){
 const folder=path.join(dir,id), manifest=JSON.parse(await readFile(path.join(folder,'manifest.json'),'utf8'));
 const audit=JSON.parse(await readFile(path.join(folder,'verification.json'),'utf8'));
 if(manifest.id!==`scenario-${id}` || audit.course!==id)throw new Error('Manifest identity mismatch');
 if(audit.speechDifferences.length && !audit.speechReview)throw new Error(`Unreviewed speech differences: ${id}`);
 if(!audit.videoVerified)throw new Error(`Video verification missing: ${id}`);
 const assets=[];
 for(const [field,file,type] of [['media','episode.mp4','video/mp4'],['captions','captions.vtt','text/vtt'],['transcript','transcript.txt','text/plain'],['poster','poster.png','image/png']]){
  const bytes=await readFile(path.join(folder,file));const name=manifest[field];
  if(!name.startsWith(sha(bytes)+'.') || audit.assets[field]!==name)throw new Error(`Asset mismatch: ${id}/${file}`);
  assets.push({name,bytes,type});
 }
 entries.push({manifest,assets});
}
// Publish content-addressed assets first. A manifest becomes visible only after every asset verifies.
for(const {manifest,assets} of entries){
 for(const {name,bytes,type} of assets){
  const key=`geffen-public/course-media/assets/${name}`;
  let existing=await retry(()=>headObject(config,key));
  if(existing && (existing.sha256!==sha(bytes)||existing.size!==bytes.length))throw new Error('Existing content-addressed object differs');
  if(!existing)await retry(()=>putObject(config,key,bytes,type));
  existing=await retry(()=>headObject(config,key));
  if(existing?.sha256!==sha(bytes)||existing?.size!==bytes.length)throw new Error('Uploaded asset verification failed');
 }
 await retry(()=>putObject(config,`geffen-public/course-media/manifests/${manifest.id}.json`,Buffer.from(JSON.stringify(manifest)),'application/json'));
 console.log('Published',manifest.id);
}
