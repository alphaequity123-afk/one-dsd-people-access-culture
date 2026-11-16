import fs from 'node:fs'; import crypto from 'node:crypto';
const h=s=>crypto.createHash('sha256').update(s).digest('hex');
const O='C:/Users/garyb/Projects/one-dsd-community-language-20261115/output/community-editorial/';
const F='lib/content/water-we-swim-in.json'; const raw=fs.readFileSync(F,'utf8');
const ser=o=>JSON.stringify(o,null,1).replace(/\n/g,'\r\n')+(raw.endsWith('\r\n')?'\r\n':'');
const doc=JSON.parse(raw); if(ser(doc)!==raw) throw Error('serializer does not round-trip');
const review=JSON.parse(fs.readFileSync(O+'water-independent-review.json','utf8'));
const get=(o,p)=>p.reduce((t,k)=>t[k],o), set=(o,p,v)=>{get(o,p.slice(0,-1))[p.at(-1)]=v};
const originalDoc=structuredClone(doc); const records=[];
for(const [key,file] of [['framing','water-framing-candidate.json'],['rights','water-rights-candidate.json']]){
  const cand=JSON.parse(fs.readFileSync(O+file,'utf8')); if(cand.sourceSha256!==h(raw)) throw Error('drift '+key);
  const out=new Map();
  for(const cf of cand.changedFields){ if(get(doc,cf.path)!==cf.before) throw Error('before mismatch '+cf.path); out.set(JSON.stringify(cf.path),cf.after); }
  for(const c of review[key].corrections){ const k=JSON.stringify(c.path); let cur=out.has(k)?out.get(k):get(doc,c.path);
    if(c.currentFragment!==undefined){ if(cur.split(c.currentFragment).length!==2) throw Error('fragment not unique '+k+' #'+c.draftFragmentIndex); cur=cur.replace(c.currentFragment,()=>c.correctedFragment); }
    else if(c.corrected!==undefined){ cur=c.corrected; } else throw Error('unknown correction shape '+JSON.stringify(Object.keys(c)));
    out.set(k,cur); }
  for(const [k,v] of out){ const p=JSON.parse(k); const before=get(originalDoc,p); set(doc,p,v);
    const mod=p.slice(0,2); records.push({id:'lib--content--water-we-swim-in--'+mod.join('-'),file:F,path:mod,module:key,changes:[{path:p,before,after:v}]}); }
}
const out=ser(doc); fs.writeFileSync(F,out);
const batch={status:'independent_review_accepted',scope:'Written module bodies of The Water We Swim In: framing batch (modules 0, 1, 2, 3, 5; 38 drafted fragments, 11 reviewer corrections) and rights batch (module 4; 18 drafted fragments plus the goal field, 8 reviewer corrections). Quotations, citations and the approved video, podcast and transcripts unchanged except the declared DHS report-host repair.',
 verification:{beforeFileSha256:h(raw),afterFileSha256:h(out),exactBeforePassed:true,correctionsUniqueInDraft:true,review:'water-independent-review.json (independent reviewer); statutes 256B.4905 and 245D.07 checked; report URL verified.'},
 records:records.map(r=>({...r,status:'reviewed_partial_body',editorialAcceptance:true,reviewer:'independent reviewer full-module read with correction pass',acceptedChangedFieldCount:r.changes.length})),
 notes:review.notes??null};
fs.writeFileSync('docs/editorial/community-water-modules-batch.json',JSON.stringify(batch,null,2)+'\n');
console.log(JSON.stringify({records:records.length,paths:records.map(r=>r.changes[0].path.join('.')),after:h(out)}));
