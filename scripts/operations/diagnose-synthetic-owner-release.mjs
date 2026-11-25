import {readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const origin='https://one-dsd-people-access-culture-production.up.railway.app';
const folder=path.join(root,'.data/supabase-activation');
const state=JSON.parse(readFileSync(path.join(folder,'synthetic-owner-check.json'),'utf8'));
if(state.title!=='Synthetic editing verification'||!/^synthetic-editing-verification-[a-z0-9-]+$/.test(state.resourceId??'')||!['/resources/'+state.resourceId,'/library/'+state.resourceId].includes(state.route))throw new Error('Exact synthetic target required.');
const key=JSON.parse(readFileSync(path.join(folder,'secrets.json'),'utf8')).ownerKey;
if(typeof key!=='string'||key.length<32)throw new Error('Private owner access unavailable.');
const allowedErrors=new Set(['Check the review information and try again.','That change could not be completed right now.','This resource changed. Reload the page before continuing.','This resource is not available for review.','Complete every required review before publishing this resource.','Sign in to the Consultant Workspace to review resources.','Open this resource from the program before making changes.','The resource review could not be opened right now.']);
let cookie='';
const receipt={kind:'exact-synthetic-release-diagnostic',resourceId:state.resourceId,at:new Date().toISOString(),resourcePublicationChanged:false,existingStaffContentRead:false,existingStaffContentChanged:false};
const send=(route,method='GET',body,form=false)=>fetch(origin+route,{method,redirect:'manual',signal:AbortSignal.timeout(30000),headers:{origin,cookie:'one_dsd_context=one_dsd'+(cookie?'; '+cookie:''),...(method==='GET'?{}:{'content-type':form?'application/x-www-form-urlencoded':'application/json'})},body:method==='GET'?undefined:form?body:JSON.stringify(body)});
try{
 const login=await send('/api/consultant/login','POST',new URLSearchParams({key,returnTo:'/consultant'}).toString(),true);
 receipt.loginStatus=login.status;
 if(login.status!==303)throw new Error('Private owner sign-in failed.');
 const session=login.headers.getSetCookie().find(value=>value.startsWith('pac_dsd_owner='));
 if(!session)throw new Error('Owner session unavailable.');cookie=session.split(';',1)[0];
 const response=await send('/api/consultant/resources/'+state.resourceId+'/release');
 receipt.releaseReadStatus=response.status;
 const body=await response.json();
 if(response.status!==200){receipt.error=allowedErrors.has(body.error)?body.error:'Response body omitted.';throw new Error('Synthetic release read failed.');}
 let current=body.release;
 if(current?.contentItemId!==state.resourceId)throw new Error('Release target mismatch.');
 receipt.release={requestedScopeId:current.requestedScopeId,scopeDecisionId:current.scopeDecisionId,scopeDecision:current.scopeDecision,withdrawn:current.withdrawn,publishedRevisionMatchesPrepared:current.published?.revisionId===state.revisionId,historyCount:current.history?.length};
 receipt.withdrawContract={revisionIdValid:/^[a-f0-9-]{36}$/i.test(state.revisionId??''),scopeDecisionIdValid:current.scopeDecisionId===null||/^[1-9]\d*$/.test(current.scopeDecisionId??''),reasonLength:'Synthetic activation verification only.'.length,requiredFieldsOnly:true};
 if(process.argv.includes('--recover-canonical')){
  if(current.requestedScopeId!=='dsd'||!current.history?.some(version=>version.revisionId===state.revisionId))throw new Error('Prepared synthetic revision unavailable.');
  if(current.withdrawn){
   const restored=await send('/api/consultant/resources/'+state.resourceId+'/release','POST',{action:'republish',revisionId:state.revisionId,expectedScopeDecisionId:current.scopeDecisionId,reason:'Synthetic activation verification only.',sensitivityClass:'S0',unauthenticatedExposurePermitted:true,exposureReason:'Synthetic verification content contains no staff information.'});
   receipt.republishStatus=restored.status;
   const result=await restored.json();
   if(restored.status!==200){receipt.error=allowedErrors.has(result.error)?result.error:'Response body omitted.';throw new Error('Synthetic republish failed.');}
   current=result.release;receipt.resourcePublicationChanged=true;
  }
  if(current.published?.revisionId!==state.revisionId||current.withdrawn)throw new Error('Synthetic publication mismatch.');
  receipt.finalRelease={withdrawn:false,publishedRevisionMatchesPrepared:true};
  const legacy=await send('/api/page-text','POST',{route:'/resources/'+state.resourceId,entries:[]});
  receipt.legacyOverrideClearStatus=legacy.status;
  if(legacy.status!==200)throw new Error('Legacy synthetic override clear failed.');
  state.route='/library/'+state.resourceId;
  writeFileSync(path.join(folder,'synthetic-owner-check.json'),JSON.stringify(state,null,2));
  receipt.canonicalRoute=state.route;
 }
 if(process.argv.includes('--restore-heading')||process.argv.includes('--recover-canonical')){
  const saved=await send('/api/page-text','POST',{route:state.route,entries:[{key:'h1:999:synthetic',original:'Synthetic editing verification',text:'Synthetic saved heading verification'}]});
  receipt.headingRestoreStatus=saved.status;
  if(saved.status!==200)throw new Error('Synthetic heading save failed.');
  const check=await send('/api/page-text?route='+encodeURIComponent(state.route));
  const result=await check.json();receipt.headingReadyForBrowser=check.status===200&&result.entries?.some(entry=>entry.text==='Synthetic saved heading verification');
 }
 receipt.passed=true;
}catch(error){receipt.passed=false;receipt.failure=/^[A-Za-z .]{1,80}$/.test(error.message??'')?error.message:'Diagnostic unavailable.';process.exitCode=1;}
finally{
 if(cookie){try{receipt.logoutStatus=(await send('/api/consultant/logout','POST',{})).status;}catch{receipt.logoutStatus='unconfirmed';}}
 writeFileSync(path.join(root,'evidence/activation-20261004/live-owner-editing/synthetic-release-diagnostic.json'),JSON.stringify(receipt,null,2));
 console.log(JSON.stringify(receipt,null,2));
}
