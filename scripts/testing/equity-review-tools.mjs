import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const dir=new URL('../../public/library/equity-review-tools/',import.meta.url);
let checks=0;
for(const name of ['DSD_Equity_Policy_Analysis_Tool.html','DSD_HCBS_Equity_Policy_Analysis_Tool.html']){
 const html=fs.readFileSync(new URL(name,dir),'utf8');
 const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]).join('\n');
 new vm.Script(script);checks++;
 const context=vm.createContext({document:{querySelector(){return null;}}});
 const definitions=script.slice(0,script.indexOf('document.addEventListener("input"'));
 const validator=script.slice(script.indexOf('function validateDraft'),script.indexOf('function persistDraft'));
 vm.runInContext(definitions+'\n'+validator,context);
 const run=code=>vm.runInContext(code,context);
 assert.equal(run('validateDraft(blank()).toolKind'),name.includes('HCBS')?'hcbs':'general');checks++;
 assert.equal(run('S=blank(); S.meta.type="policy";S.meta.duration="prolonged";S.meta.approval="director";S.meta.prior="yes";track().key'),'full');checks++;
 assert.equal(run('S.meta.unchanged="yes";S.meta.priorCitation="Earlier review";track().key'),'scan');checks++;
 assert.equal(run('S=blank();S.groups=[];rubricItems()[3][0]'),false);checks++;
 assert.equal(run('rubricItems()[4][0]'),false);checks++;
 assert.throws(()=>run('const wrong=blank();wrong.toolKind="other";validateDraft(wrong)'));checks++;
 assert.throws(()=>run('const broken=blank();broken.groups="invalid";validateDraft(broken)'));checks++;
 assert.throws(()=>run('const huge=blank();huge.meta.title="x".repeat(30001);validateDraft(huge)'));checks++;
 assert.throws(()=>run('const partial=blank();partial.s1={};validateDraft(partial)'));checks++;
 assert.throws(()=>run('const inherited=blank();inherited.meta.type="toString";validateDraft(inherited)'));checks++;
 assert.throws(()=>run('const badEnum=blank();badEnum.meta.approval="invented";validateDraft(badEnum)'));checks++;
 assert.throws(()=>run('const badRoute=blank();badRoute[badRoute.toolKind==="hcbs"?"s8":"s7"].routes=["invented"];validateDraft(badRoute)'));checks++;
 assert.throws(()=>run('const proto=blank();Object.defineProperty(proto.meta,"__proto__",{value:{},enumerable:true});validateDraft(proto)'));checks++;
 assert(!html.includes('#E6F2E9')&&!html.includes('#F8E7E3'));checks++;
 assert(html.includes('localStorage.setItem')&&html.includes('localStorage.removeItem'));checks++;
 assert(html.includes('Your current work is unchanged.'));checks++;
 assert(html.includes('not an official legislative position'));checks++;
 if(name.includes('HCBS')){assert.equal(run('S=blank();S.sample=true;record().includes("Fictional worked example")'),true);checks++;assert.equal(run('render=()=>{};toast=()=>{};loadExample();validateDraft(S).sample'),true);checks++;}
 console.log(`${name}: checks passed`);
}
console.log(`${checks} equity review tool checks passed. Browser visual and assistive-technology verification remain separate.`);
