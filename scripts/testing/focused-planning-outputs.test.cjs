const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'../..');
function load(file){const mod={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{module:mod,exports:mod.exports,require,console,TextEncoder,Date});return mod.exports;}
const {DOMAIN_PATHS}=load('lib/content/paths-domain.ts');
const {practiceNotesText}=load('lib/client/practice-export.ts');
const {validPracticeValues}=load('lib/content/practice-artifact.ts');
const gp10=DOMAIN_PATHS.find(p=>p.id==='gp-10');
const later=gp10.artifactFields.find(f=>f.id==='later_decisions');
assert.ok(later);assert.equal(later.required,false);
assert.match(later.label,/Renewal, corrective action and closeout/);
assert.ok(validPracticeValues(gp10,{work_name:'General contract preparation'}));
const notes=practiceNotesText(gp10,{later_decisions:'Compare renewal with a correction or closeout using authorized review.'});
assert.match(notes,/Renewal, corrective action and closeout/);assert.match(notes,/Compare renewal with a correction or closeout/);
const {CLAS_PLANNING_FIELDS,clasPlanningText}=load('lib/content/clas-planning.ts');
assert.equal(CLAS_PLANNING_FIELDS.length,7);assert.equal(new Set(CLAS_PLANNING_FIELDS.map(f=>f.id)).size,7);
const values=Object.fromEntries(CLAS_PLANNING_FIELDS.map(f=>[f.id,'Draft answer for '+f.id]));const text=clasPlanningText(values);
for(const f of CLAS_PLANNING_FIELDS){assert.ok(text.includes(f.label));assert.ok(text.includes(values[f.id]));}
assert.match(text,/do not establish compliance, completed review or authorization/);
assert.match(clasPlanningText({}),/Not yet recorded/);assert.match(text,/https:\/\/thinkculturalhealth.hhs.gov\/clas\/standards/);
const component=fs.readFileSync(path.join(root,'components/clas-planning-worksheet.tsx'),'utf8');
assert.doesNotMatch(component,/localStorage|sessionStorage|\bfetch\(/);
console.log('Actual GP10 later-stage field is optional, legacy values accepted and notes include it. All seven CLAS planning fields and authority/source/unknown boundaries export correctly. No records or network used.');
