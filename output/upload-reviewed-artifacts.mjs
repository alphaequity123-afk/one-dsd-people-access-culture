import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {storageRequest} from '../scripts/self-directed-storage.mjs';
const manifest=JSON.parse(await fs.readFile('docs/editorial/reference-artifact-transport-review.json','utf8'));
const credentials={endpoint:process.env.SERIES_ASSET_ENDPOINT,bucketName:process.env.SERIES_ASSET_BUCKET,region:process.env.SERIES_ASSET_REGION,accessKeyId:process.env.SERIES_ASSET_ACCESS_KEY_ID,secretAccessKey:process.env.SERIES_ASSET_SECRET_ACCESS_KEY};
if(Object.values(credentials).some(v=>!v))throw Error('Existing asset configuration unavailable');
const results=[];
for(const row of manifest.records.filter(x=>x.path.endsWith('.docx'))){
 const bytes=await fs.readFile(row.path),hash=createHash('sha256').update(bytes).digest('hex');
 if(hash!==row.sha256||bytes.length!==row.bytes)throw Error('Reviewed asset mismatch');
 const key='one-dsd/github-assets/'+hash;
 const put=storageRequest(credentials,key,'PUT',hash);
 const response=await fetch(put.url,{method:'PUT',headers:put.headers,body:bytes});
 if(!response.ok)throw Error('Asset upload failed with status '+response.status);
 const get=storageRequest(credentials,key);const check=await fetch(get.url,{headers:get.headers});
 const restored=Buffer.from(await check.arrayBuffer());
 if(!check.ok||createHash('sha256').update(restored).digest('hex')!==hash)throw Error('Uploaded asset verification failed');
 results.push({path:row.path,sha256:hash,bytes:bytes.length,verified:true});
 console.log('Verified reviewed artifact: '+row.path);
}
await fs.writeFile('output/reviewed-artifact-upload-receipt.json',JSON.stringify({uploadedAt:new Date().toISOString(),results},null,2));
