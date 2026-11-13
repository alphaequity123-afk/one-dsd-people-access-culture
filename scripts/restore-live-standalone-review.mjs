import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=process.cwd();
const stage=path.join(root,'.data/full-refactor/live-standalone');fs.mkdirSync(stage,{recursive:true});
const manifest=JSON.parse(execFileSync('git',['show','HEAD:config/railway-release-assets.json'],{encoding:'utf8',maxBuffer:12*1024*1024}));
const overrides=JSON.parse(fs.readFileSync('config/standalone-public-overrides/index.json'));
const wanted=overrides.files.filter(entry=>entry.path.endsWith('.html')).map(entry=>manifest.assets.find(asset=>asset.path===entry.path));
if(wanted.some(asset=>!asset))throw Error('An override is not in the deployed release.');
const live='https://one-dsd-people-access-culture-production-2454.up.railway.app';
let cursor=0;
const verified=[];
async function worker(){while(cursor<wanted.length){const asset=wanted[cursor++];const file=path.join(stage,asset.path);let bytes=fs.existsSync(file)?fs.readFileSync(file):null;
 if(!bytes){const response=await fetch(live+'/'+asset.path.slice(7).split('/').map(encodeURIComponent).join('/'),{signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error(`HTTP ${response.status}: ${asset.path}`);bytes=Buffer.from(await response.arrayBuffer());}
 if(bytes.length!==asset.bytes||createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw Error(`Live version differs from base release: ${asset.path}`);
 fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);verified.push({path:asset.path,bytes:bytes.length});
}}
await Promise.all(Array.from({length:3},worker));
// Restore only these reviewed HTML files; shared styles and scripts are separate files.
for(const asset of wanted){const target=path.resolve(root,asset.path);if(!target.startsWith(root+path.sep)||!asset.path.endsWith('.html'))throw Error('Invalid destination');fs.copyFileSync(path.join(stage,asset.path),target);}
fs.writeFileSync(path.join(stage,'verified.json'),JSON.stringify(verified,null,2));
console.log(`Restored ${verified.length} complete deployed pages, each matched to its release hash.`);
