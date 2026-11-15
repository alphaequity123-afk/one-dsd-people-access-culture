import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {restoreSupplemental} from '../prepare-github-assets.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
test('reviewed artifacts survive historical restoration, including LFS-only source checkout',async()=>{
 const receipt=await read('docs/editorial/reference-artifact-transport-review.json');
 const allOverrides=await read('config/standalone-public-overrides/index.json');
 const release=await read('config/railway-release-assets.json');
 const allSupplemental=await read('config/github-supplemental-assets.json');
 const selected=new Set(receipt.records.map(r=>r.path));
 const overrides={...allOverrides,files:allOverrides.files.filter(r=>selected.has(r.path))};
 assert.equal(overrides.files.length,10);
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'reviewed-artifacts-'));
 try{
  const blobs=new Map();
  for(const row of receipt.records){
   assert.deepEqual(release.assets.find(r=>r.path===row.path),row);
   assert.deepEqual(overrides.files.find(r=>r.path===row.path),row);
   const bytes=await fs.readFile(path.join(root,row.path));
   assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256);
   blobs.set(row.sha256,bytes);
   for(const relative of [row.path,'config/standalone-public-overrides/files/'+row.path]){
    await fs.mkdir(path.dirname(path.join(temp,relative)),{recursive:true});
    await fs.writeFile(path.join(temp,relative),row.path.endsWith('.docx')?`version https://git-lfs.github.com/spec/v1\noid sha256:${row.sha256}\nsize ${row.bytes}\n`:bytes);
   }
  }
  await fs.writeFile(path.join(temp,'config/standalone-public-overrides/index.json'),JSON.stringify(overrides));
  const supplemental={...allSupplemental,files:allSupplemental.files.filter(r=>selected.has(r.path)||selected.has(r.path.replace('config/standalone-public-overrides/files/','')))};
  assert.equal(supplemental.files.length,8);
  await restoreSupplemental(temp,supplemental,{endpoint:'https://storage.example',bucketName:'fixture',region:'auto',accessKeyId:'fixture',secretAccessKey:'fixture'},async(_u,_h,target,item)=>fs.writeFile(target,blobs.get(item.sha256)));
  for(const row of receipt.records)await fs.writeFile(path.join(temp,row.path),'historical release bytes');
  const result=spawnSync(process.execPath,[path.join(root,'scripts/apply-standalone-public-overrides.mjs')],{cwd:temp,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  for(const row of receipt.records)assert.equal(createHash('sha256').update(await fs.readFile(path.join(temp,row.path))).digest('hex'),row.sha256);
 }finally{
  assert.ok(temp.startsWith(path.join(os.tmpdir(),'reviewed-artifacts-')));
  await fs.rm(temp,{recursive:true,force:true});
 }
});
