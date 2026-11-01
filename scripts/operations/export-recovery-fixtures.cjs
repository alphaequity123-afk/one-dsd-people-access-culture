// Isolated read-only loader: produces synthetic records using application validators.
const fs=require('node:fs'),Module=require('node:module'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'../..'),resolve=Module._resolveFilename;
Module._resolveFilename=function(request,parent,isMain,options){return resolve.call(this,request==='server-only'?path.join(root,'tests/helpers/server-only.ts'):request.startsWith('@/')?path.join(root,request.slice(2)):request,parent,isMain,options);};
require.extensions['.ts']=function(module,filename){module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},fileName:filename}).outputText,filename);};
const fixture=require(path.join(root,'tests/helpers/consultation-record.ts'));
const {assertWorkObjectPersistence}=require(path.join(root,'lib/trust/work-object-contract.ts'));
const {consultationExpiry}=require(path.join(root,'lib/intelligence/consult/retention.ts'));
const created=new Date(Date.now()-86400000).toISOString();
const active=fixture.buildTestConsultationRecord({sequence:9911,createdAt:created,retentionExpiresAt:consultationExpiry(created,{retentionCalendarYears:2})});
active.retention_policy_id='synthetic-two-calendar-years';
const received=fixture.withConsultationStatus(active,'received',new Date(Date.parse(created)+1000).toISOString());
const reviewed=fixture.withConsultationStatus(received,'under_review',new Date(Date.parse(created)+2000).toISOString());
const old=fixture.buildTestConsultationRecord({sequence:9912,createdAt:'2022-01-01T00:00:00.000Z',retentionExpiresAt:'2024-01-01T00:00:00.000Z'});
old.retention_policy_id='synthetic-two-calendar-years';
const asOf=new Date().toISOString();
const tombstone=fixture.buildTestConsultationTombstone(old,asOf);
for(const r of [active,received,reviewed,old,tombstone])assertWorkObjectPersistence('consult_request',r.request_id,r);
process.stdout.write(JSON.stringify({active,received,reviewed,expired:old,tombstone,asOf}));
