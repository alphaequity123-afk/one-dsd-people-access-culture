const fs=require('fs');
const ts=require('typescript');
const source=fs.readFileSync('lib/program/dsd-logic-model.ts','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const data={}; new Function('exports',compiled)(data);
function grade(text){
 const words=text.toLowerCase().match(/[a-z]+(?:['’][a-z]+)?/g)||[];
 const sentences=(text.match(/[.!?]+/g)||[]).length||1;
 const syllables=words.reduce((sum,word)=>{let w=word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/,'').replace(/^y/,'');return sum+Math.max(1,(w.match(/[aeiouy]{1,2}/g)||[]).length);},0);
 return {words:words.length,sentences,estimatedGrade:Math.round((.39*words.length/sentences+11.8*syllables/words.length-15.59)*10)/10};
}
const results=data.logicStages.map(s=>({stage:s.label,...grade(s.introduction+' '+s.explanation)}));
const receipt={method:'Approximate Flesch–Kincaid diagnostic using heuristic syllable counts. Applies to newly authored stage introductions and explanations, not original source materials. Editorial judgment remains necessary.',results,combined:grade(data.logicStages.map(s=>s.introduction+' '+s.explanation).join(' '))};
fs.writeFileSync('evidence/dsd-logic-model/readability.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt,null,2));
const guideSource=fs.readFileSync('lib/program/dsd-practice-guides.ts','utf8');
const guideCompiled=ts.transpileModule(guideSource,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const guideData={}; new Function('exports',guideCompiled)(guideData);
const guideText=g=>[g.introduction,...g.steps.map(s=>s.body),g.example,g.review].join(' ');
const guideReceipt={method:'Approximate Flesch–Kincaid diagnostic using heuristic syllable counts. Applies only to new guide prose, excludes navigation, titles, prompts and original resources. Editorial review remains necessary.',results:guideData.practiceGuides.map(g=>({guide:g.title,...grade(guideText(g))})),combined:grade(guideData.practiceGuides.map(guideText).join(' '))};
fs.writeFileSync('evidence/dsd-full-smoke/guide-readability.json',JSON.stringify(guideReceipt,null,2));console.log(JSON.stringify(guideReceipt,null,2));
