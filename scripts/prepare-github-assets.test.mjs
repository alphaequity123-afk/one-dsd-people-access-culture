import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {isLfsPointer,assetPath,restoreSupplemental} from './prepare-github-assets.mjs';
const payload=Buffer.from('real asset bytes');
const sha256=createHash('sha256').update(payload).digest('hex');
const item={path:'public/test.bin',bytes:payload.length,sha256,key:'one-dsd/github-assets/'+sha256};
const manifest={format:'one-dsd-github-assets-v1',files:[item]};
const credentials={endpoint:'https://storage.example',bucketName:'test',region:'auto',accessKeyId:'fixture',secretAccessKey:'fixture'};
async function fixture(fn){const root=await fs.mkdtemp(path.join(os.tmpdir(),'github-assets-test-'));try{await fs.mkdir(path.join(root,'public'));await fn(root);}finally{await fs.rm(root,{recursive:true,force:true});}}
test('rejects path traversal and accepts only exact LFS pointers',()=>{assert.throws(()=>assetPath('/tmp','public/../secret'));assert.throws(()=>assetPath('/tmp','private/a'));assert.equal(isLfsPointer(payload),false);assert.equal(isLfsPointer(Buffer.from(`version https://git-lfs.github.com/spec/v1\noid sha256:${sha256}\nsize ${payload.length}\n`)),true);});
test('restores pointer with verified bytes and reuses valid file offline',async()=>fixture(async root=>{const target=path.join(root,item.path);await fs.writeFile(target,`version https://git-lfs.github.com/spec/v1\noid sha256:${sha256}\nsize ${payload.length}\n`);let calls=0;await restoreSupplemental(root,manifest,credentials,async(_u,_h,p)=>{calls++;await fs.writeFile(p,payload);});assert.deepEqual(await fs.readFile(target),payload);await restoreSupplemental(root,manifest,{},async()=>{throw Error('must not download');});assert.equal(calls,1);}));
test('rejects corrupted downloads and preserves the original pointer',async()=>fixture(async root=>{const target=path.join(root,item.path);const pointer=`version https://git-lfs.github.com/spec/v1\noid sha256:${sha256}\nsize ${payload.length}\n`;await fs.writeFile(target,pointer);await assert.rejects(restoreSupplemental(root,manifest,credentials,async(_u,_h,p)=>fs.writeFile(p,'bad')),/checksum/);assert.equal(await fs.readFile(target,'utf8'),pointer);assert.deepEqual(await fs.readdir(path.dirname(target)),['test.bin']);}));
test('fails closed for modified real assets and mismatched pointer identities',async()=>fixture(async root=>{const target=path.join(root,item.path);await fs.writeFile(target,'unexpected bytes');await assert.rejects(restoreSupplemental(root,manifest,credentials),/checksum/);await fs.writeFile(target,`version https://git-lfs.github.com/spec/v1\noid sha256:${'0'.repeat(64)}\nsize 12\n`);await assert.rejects(restoreSupplemental(root,manifest,credentials),/identity/);}));
