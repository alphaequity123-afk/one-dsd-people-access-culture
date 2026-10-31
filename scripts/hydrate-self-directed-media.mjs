import fs from 'node:fs/promises';
import {createReadStream,createWriteStream} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {spawnSync} from 'node:child_process';
import {storageRequest} from './self-directed-storage.mjs';
const credentials={endpoint:process.env.SERIES_ASSET_ENDPOINT,bucketName:process.env.SERIES_ASSET_BUCKET,region:process.env.SERIES_ASSET_REGION,accessKeyId:process.env.SERIES_ASSET_ACCESS_KEY_ID,secretAccessKey:process.env.SERIES_ASSET_SECRET_ACCESS_KEY};
if(Object.values(credentials).some(v=>!v))throw Error('The course image storage connection is unavailable.');
for(const manifestFile of ['media-manifest.json','download-manifest.json']){
const manifest=JSON.parse(await fs.readFile('data/self-directed-assets/'+manifestFile,'utf8'));
const {url,headers}=storageRequest(credentials,manifest.key);
const response=await fetch(url,{headers,signal:AbortSignal.timeout(600000)});
if(!response.ok)throw Error('Course image download returned HTTP '+response.status);
const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'one-dsd-course-images-'));
const archive=path.join(temporary,'media.tar');
try{
  await pipeline(Readable.fromWeb(response.body),createWriteStream(archive));
  const digest=createHash('sha256');for await(const chunk of createReadStream(archive))digest.update(chunk);
  if((await fs.stat(archive)).size!==manifest.bytes||digest.digest('hex')!==manifest.sha256)throw Error('The course images did not match the approved collection.');
  const result=spawnSync('tar',['-xf',archive,'-C',process.cwd()],{stdio:'inherit'});
  if(result.status!==0)throw Error('The course images could not be restored.');
  console.log(manifest.images?'Verified and restored all '+manifest.images+' approved course images.':'Verified and restored the approved PowerPoint asset package.');
}finally{await fs.rm(temporary,{recursive:true,force:true});}
}
