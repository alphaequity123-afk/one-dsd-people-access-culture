import fs from 'node:fs/promises';
import path from 'node:path';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
const root=process.cwd();
const manifest=JSON.parse(await fs.readFile('config/railway-release-assets.json','utf8'));
if(manifest.format!=='one-dhs-release-assets-v1')throw Error('Unsupported release manifest.');
const reviewed=JSON.parse(await fs.readFile('config/reviewed-public-assets/index.json','utf8'));
if(reviewed.format!=='reviewed-public-assets-v1'||!Array.isArray(reviewed.files))throw Error('Invalid reviewed public asset manifest.');
const effectiveAssets=new Map(manifest.assets.map(asset=>[asset.path,asset]));
const overrides=JSON.parse(await fs.readFile('config/standalone-public-overrides/index.json','utf8'));
if(overrides.format!=='one-dsd-public-overrides-v1'||!Array.isArray(overrides.files))throw Error('Invalid standalone override manifest.');
const overridden=new Set(overrides.files.map(entry=>entry.path));
for(const entry of overrides.files){const archived=effectiveAssets.get(entry.path);if(!archived||archived.bytes!==entry.bytes||archived.sha256!==entry.sha256)throw Error('Standalone override differs from release identity: '+entry.path);}
for(const asset of reviewed.files){
  if(typeof asset.path!=='string'||!asset.path.startsWith('public/')||asset.path.includes('\\')||asset.path.includes(':')||asset.path.split('/').some(part=>!part||part==='.'||part==='..')||!Number.isSafeInteger(asset.bytes)||asset.bytes<0||!/^[a-f0-9]{64}$/.test(asset.sha256))throw Error('Invalid reviewed public asset identity.');
  if(overridden.has(asset.path))continue; // Applied last; the override identity above is the effective one.
  const archived=effectiveAssets.get(asset.path);
  // A reviewed ZIP recipe (an Office file) can be superseded by a newer release asset, as the course decks corrected on
  // 2026-11-10 are: the release identity is then the effective one and the file is checked against it below.
  // apply-reviewed-public-assets.mjs accepts such a file only when it already matches that release identity.
  if(archived&&asset.recipe&&(archived.bytes!==asset.bytes||archived.sha256!==asset.sha256))continue;
  if(archived&&(archived.bytes!==asset.bytes||archived.sha256!==asset.sha256))throw Error('Reviewed asset differs from effective release identity: '+asset.path);
  effectiveAssets.set(asset.path,asset);
}
let verified=0;
for(const asset of effectiveAssets.values()){ 
  if(!asset.path.startsWith('public/') && asset.path!=='models/bge-small-en-v1.5/onnx/model_quantized.onnx')throw Error('Asset outside approved release roots.');
  const filename=path.resolve(root,asset.path);
  if(!filename.startsWith(root+path.sep))throw Error('Invalid asset path.');
  const stat=await fs.stat(filename);if(stat.size!==asset.bytes)throw Error('Release asset size mismatch: '+asset.path);
  const hash=createHash('sha256');for await(const chunk of createReadStream(filename))hash.update(chunk);
  if(hash.digest('hex')!==asset.sha256)throw Error('Release asset hash mismatch: '+asset.path);
  verified++;
}
const series=path.join(root,'public/learning/self-directed');
const html=await fs.readFile(path.join(series,'index.html'),'utf8');
const match=html.match(/<script id="course-data" type="application\/json">([\s\S]*?)<\/script>/);
if(!match)throw Error('Course browser is missing its catalog.');
const courses=JSON.parse(match[1]);if(courses.length!==72||new Set(courses.map(c=>c.number)).size!==72)throw Error('Expected 72 distinct course entries.');
const included=new Set(effectiveAssets.keys());
function required(relative){const local=path.posix.normalize('public/learning/self-directed/'+relative);if(!included.has(local))throw Error('Referenced course asset is not included: '+local);}
for(const course of courses){
 required(course.filename);required(course.dataFile);
 const data=JSON.parse(await fs.readFile(path.join(series,course.dataFile),'utf8'));
 for(const slide of data.slides||[])if(slide.image)required(slide.image);
}
const covers=JSON.parse(await fs.readFile(path.join(series,'covers/index.json'),'utf8'));
for(const course of courses){const cover=Array.isArray(covers)?covers.find(c=>c.number===course.number):covers[course.number];if(!cover)throw Error('Missing topic cover: '+course.number);required('covers/'+course.number+'.jpg');}
const audioIndex=JSON.parse(await fs.readFile('public/learning/audio-discussions/index.json','utf8'));
let recordings=0;
function verifyAudio(value){
 if(Array.isArray(value)){value.forEach(verifyAudio);return;}
 if(!value||typeof value!=='object')return;
 for(const [key,item] of Object.entries(value)){
   if(key==='src'&&typeof item==='string'){
     const relative=item.startsWith('/')?'public'+item:path.posix.normalize('public/learning/self-directed/'+item);
     if(!included.has(relative))throw Error('Referenced audio is missing from release: '+relative);
     recordings++;
   }else verifyAudio(item);
 }
}
for(const id of Object.keys(audioIndex)){const file='public/learning/audio-discussions/'+id+'.json';if(!included.has(file))throw Error('Missing audio metadata: '+id);verifyAudio(JSON.parse(await fs.readFile(file,'utf8')));}
console.log(`PASS ${verified} current release assets; 72 editable PowerPoints, data files, topic covers, all referenced slide images and ${recordings} currently linked audio clips are included. Exact current release sizes and hashes verified.`);
