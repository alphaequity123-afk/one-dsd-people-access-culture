import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync('config/railway-release-assets.json'));
const wanted=manifest.assets.filter(asset=>asset.path.startsWith('public/learning/')&&asset.path.endsWith('.json')&&asset.bytes<10*1024*1024);
const live='https://one-dsd-people-access-culture-production-2454.up.railway.app';let index=0,restored=0;
async function worker(){while(index<wanted.length){const asset=wanted[index++];const file=path.resolve(asset.path);if(!file.startsWith(process.cwd()+path.sep))throw Error('Invalid asset path');if(fs.existsSync(file)&&fs.statSync(file).size===asset.bytes)continue;const response=await fetch(live+'/'+asset.path.slice(7).split('/').map(encodeURIComponent).join('/'),{signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error(`HTTP ${response.status}: ${asset.path}`);const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length!==asset.bytes||createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw Error(`Live asset differs: ${asset.path}`);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);restored++;}}
await Promise.all(Array.from({length:3},worker));console.log(`Restored ${restored} course data files from the verified live release.`);
