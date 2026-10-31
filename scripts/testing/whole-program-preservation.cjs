const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('assert/strict'),cp=require('child_process');
const target=path.resolve(__dirname,'../..');
if(process.argv[2]==='inventory'){
 const base=process.argv[3],ts=require(path.join(target,'node_modules/typescript'));const resolve=Module._resolveFilename;
 Module._resolveFilename=function(n,p,...a){if(n==='server-only')return __filename;if(n.startsWith('@/'))n=path.join(base,n.slice(2));return resolve.call(this,n,p,...a)};
 require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,resolveJsonModule:true}}).outputText,f);
 const recovered=JSON.parse(fs.readFileSync(path.join(base,'lib/content/courses/recovered.json'),'utf8'));
 const authored=require(path.join(base,'lib/content/courses/authored')).AUTHORED_COURSE_PACKS;
 const corpus=require(path.join(base,'lib/content/staff-corpus')).staffCorpus();
 const selfFile=path.join(base,'lib/content/self-directed-data.json');const self=fs.existsSync(selfFile)?JSON.parse(fs.readFileSync(selfFile,'utf8')):[];
 let nativeDiscovery;
 if(base===target){
   const {courseContentItem}=require(path.join(base,'lib/content/courses/published.ts'));
   const {matchesLibraryFacets}=require(path.join(base,'lib/content/library-facets.ts'));
   const {matchesLibraryFilters}=require(path.join(base,'lib/content/work-index.ts'));
   const {DOMAINS,ROLE_FAMILY_LABEL}=require(path.join(base,'lib/domains'));
   const {REFERRAL_ONLY_COURSE_IDS}=require(path.join(base,'lib/program/retired-features.ts'));
   const native=[...recovered,...authored].filter(p=>!REFERRAL_ONLY_COURSE_IDS.has(p.course.id)).map(p=>courseContentItem(p));
   nativeDiscovery={activeNative:native.length,roles:Object.fromEntries(Object.keys(ROLE_FAMILY_LABEL).map(role=>[role,native.filter(item=>matchesLibraryFacets(item,{role})).length])),areas:Object.fromEntries(DOMAINS.map(area=>[area.id,native.filter(item=>matchesLibraryFilters(item,{area:area.id})).length]))};
 }
 console.log(JSON.stringify({courses:[...recovered,...authored].map(p=>({id:p.course.id,title:p.course.title,lessons:p.course.lessons.map(l=>l.id)})),resources:corpus.map(x=>({id:x.id,title:x.title,scope:x.scope})),self:self.map(x=>({id:x.number,title:x.title})),nativeDiscovery}));process.exit(0);
}
const snapshots={};for(const name of ['one-dhs-full-railway-recovered-20261010','one-dsd-railway-recovered-20261010','one-dhs-unified-20261010'])snapshots[name]=JSON.parse(cp.execFileSync(process.execPath,[__filename,'inventory',path.resolve(target,'..',name)],{encoding:'utf8',maxBuffer:8e6}));
const current=snapshots['one-dhs-unified-20261010'];const findings=[];
for(const [source,data] of Object.entries(snapshots).filter(([n])=>n!=='one-dhs-unified-20261010')){
 const missingCourses=data.courses.filter(x=>!current.courses.some(c=>c.id===x.id));const missingResources=data.resources.filter(x=>!current.resources.some(c=>c.id===x.id));const missingSelf=data.self.filter(x=>!current.self.some(c=>c.id===x.id));
 const missingLessons=data.courses.flatMap(c=>{const found=current.courses.find(x=>x.id===c.id);return found?c.lessons.filter(id=>!found.lessons.includes(id)).map(id=>({course:c.id,id})):[]});
 findings.push({source,courses:data.courses.length,resources:data.resources.length,selfDirected:data.self.length,missingCourses,missingResources,missingSelf,missingLessons});
 assert.equal(missingCourses.length,0,'Missing source courses: '+source);assert.equal(missingLessons.length,0,'Missing source lessons: '+source);assert.equal(missingSelf.length,0,'Missing self-directed records: '+source);
}
const receipt={targetCounts:{native:current.courses.length,nativeLessons:current.courses.reduce((n,c)=>n+c.lessons.length,0),resources:current.resources.length,selfDirected:current.self.length},sources:findings,boundary:'Identity/lesson preservation check only. Deliberately retired public resources are separately reported rather than mistaken for accidental loss. This is not a claim that every content passage is unchanged, every route works or agency outcomes are established.'};
receipt.nativeDiscovery=current.nativeDiscovery;
fs.writeFileSync(path.join(target,'../program-foundation/whole-program-review/Whole Program Preservation Regression.json'),JSON.stringify(receipt,null,2));
console.log(JSON.stringify(receipt,null,2));
