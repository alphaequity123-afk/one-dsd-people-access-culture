import {createHash,createHmac} from 'node:crypto';
const hash=value=>createHash('sha256').update(value).digest('hex');
const hmac=(key,value)=>createHmac('sha256',key).update(value).digest();
export function storageRequest(credentials,key,method='GET',payloadHash=hash('')){
  const endpoint=new URL(credentials.endpoint);
  endpoint.hostname=credentials.bucketName+'.'+endpoint.hostname;
  endpoint.pathname='/'+key.split('/').map(encodeURIComponent).join('/');
  const stamp=new Date().toISOString().replace(/[:-]|\.\d{3}/g,'');
  const day=stamp.slice(0,8),region=credentials.region||'auto';
  const scope=day+'/'+region+'/s3/aws4_request';
  const headers={'host':endpoint.host,'x-amz-content-sha256':payloadHash,'x-amz-date':stamp};
  const signed='host;x-amz-content-sha256;x-amz-date';
  const canonical=method+'\n'+endpoint.pathname+'\n\n'+Object.entries(headers).map(([k,v])=>k+':'+v+'\n').join('')+'\n'+signed+'\n'+payloadHash;
  const signingKey=hmac(hmac(hmac(hmac('AWS4'+credentials.secretAccessKey,day),region),'s3'),'aws4_request');
  const signature=createHmac('sha256',signingKey).update('AWS4-HMAC-SHA256\n'+stamp+'\n'+scope+'\n'+hash(canonical)).digest('hex');
  headers.Authorization='AWS4-HMAC-SHA256 Credential='+credentials.accessKeyId+'/'+scope+', SignedHeaders='+signed+', Signature='+signature;
  return {url:endpoint.href,headers};
}
