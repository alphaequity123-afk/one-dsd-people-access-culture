import { ADSA_GOALS, type AnalysisRequest, type AnalysisResponse } from './schema';

export type AnalysisReportInput = {
 request: AnalysisRequest; analysis: AnalysisResponse | null; sources: AnalysisRequest['sources']; researchNote: string;
 gap: Record<string,string>; gapResult: {gap:number|null;targetMet:boolean|null;scenario:number|null;current:number|null;target:number|null}|null;
 review: Record<string,{status:string;note:string}>;
};
export type ReportBlock = {kind:'title'|'heading'|'text'|'quote';text:string;url?:string};
export function safeReportUrl(value:string|undefined):string|undefined {
 if(!value)return;try{const url=new URL(value);if(['https:','http:'].includes(url.protocol)&&!url.username&&!url.password)return url.href;}catch{/* plain text only */}
}
export function analysisReportBlocks(input:AnalysisReportInput):ReportBlock[]{
 const {request,analysis,sources,gap,gapResult,review}=input;
 const blocks:ReportBlock[]=[];
 const add=(kind:ReportBlock['kind'],text:string,url?:string)=>blocks.push({kind,text,...(url?{url}:{})});
 const goals=(ids:AnalysisRequest['goals'])=>ids.map(id=>ADSA_GOALS.find(g=>g.id===id)?.title??id).join(', ')||'No ADSA goals selected';
 const citations=(entries:AnalysisResponse['findings'][number]['citations'])=>{
  for(const citation of entries){const source=sources.find(s=>s.id===citation.sourceId);add('quote',citation.excerpt);add('text',`Source: ${source?.title??'Source unavailable'}`,safeReportUrl(source?.url));}
 };
 add('title',request.title||'One DSD equity analysis');
 add('text','One DSD People, Access and Culture · Working analysis for review');
 add('text',request.mode==='practice'?'Practice — not evidence about actual staff, services or decisions.':'Working findings and proposed actions; this report is not an official DHS position or a legal determination.');
 add('heading','Question and scope');add('text',request.question||'Question not yet recorded');
 const scopes:Record<string,string>={individual:'Individual work',team:'Team',division:'Division',administration:'Administration',agency:'Agency'};
 const subjects:Record<string,string>={policy:'Policy or procedure',bill:'Bill or legislative proposal',hcbs:'Home and community-based services',research:'Research',workplace:'Workplace practice',workforce:'Workforce practice',program:'Program or service'};
 add('text',`Scope: ${scopes[request.scope]??request.scope}. Subject: ${subjects[request.kind]??request.kind}.`);add('text',`ADSA goals: ${goals(request.goals)}`);
 if(request.context)add('text',request.context);
 add('heading','Working summary');add('text',analysis?.summary??'Analysis has not been prepared.');
 if(analysis){
  add('heading','Findings');
  analysis.findings.forEach((finding,i)=>{add('heading',`${i+1}. ${finding.kind==='evidence'?'Evidence':finding.kind==='gap'?'Gap to investigate':'Interpretation to review'}`);add('text',finding.statement);add('text',`Reasoning: ${finding.reasoning}`);add('text',`People to consider: ${finding.affectedGroups.join(', ')||'Not yet identified'}`);add('text',`ADSA connection: ${goals(finding.goals)}`);citations(finding.citations);});
  add('heading','Alternatives');analysis.alternatives.forEach(a=>{add('heading',a.title);add('text',`Benefits: ${a.benefits}`);add('text',`Risks: ${a.risks}`);add('text',`Evidence still needed: ${a.evidenceNeeded}`);});
  add('heading','Proposed actions');analysis.recommendations.forEach((r,i)=>{add('heading',`${i+1}. ${r.action}`);add('text',`Rationale: ${r.rationale}`);add('text',`Responsible role: ${r.responsibleRole}`);add('text',`How to check the result: ${r.measure}`);add('text',`Next step: ${r.nextStep}`);add('text',`ADSA connection: ${goals(r.goals)}`);citations(r.citations);});
  add('heading','Limits and questions for review');analysis.limitations.forEach(t=>add('text',t));analysis.questionsForReview.forEach(t=>add('text',t));
 }
 add('heading','Sources');sources.forEach(s=>{add('text',s.title||'Untitled source',safeReportUrl(s.url));if(s.date)add('text',`Source date: ${s.date}`);});
 if(input.researchNote)add('text',input.researchNote);
 add('heading','Measure, assumptions and uncertainty');
 for(const [key,label] of [['label','Measure'],['value','Entered current value'],['target','Target'],['unit','Unit'],['numerator','Number meeting the measure'],['denominator','Measured group size'],['direction','Desired direction'],['start','Period begins'],['end','Period ends'],['change','Assumed change (%)'],['uncertainty','Evidence, assumptions and uncertainty']])if(gap[key])add('text',`${label}: ${gap[key]}`);
 if(gapResult){add('text',`Calculated current: ${gapResult.current??'Unknown'}. Target: ${gapResult.target??'Unknown'}. Gap: ${gapResult.gap??'Unknown'}.`);add('text',`What-if result: ${gapResult.scenario??'Unknown'}. This scenario is not a forecast and does not establish the cause of a difference.`);}else add('text','No current calculation included. Entered values and assumptions have not been confirmed by a calculation.');
 add('heading','Review notes');
 const labels:Record<string,string>={perspectives:'Perspectives',barriers:'Barriers',evidence:'Evidence',alternatives:'Alternatives',action:'Action'};
 Object.entries(review).forEach(([key,value])=>{add('heading',labels[key]??key);add('text',`Observation: ${value.status.replaceAll('-',' ')||'Not reviewed yet'}`);if(value.note)add('text',value.note);});
 if(!Object.keys(review).length)add('text','No review notes recorded.');
 return blocks;
}
export const escapeReportHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function analysisReportHtml(input:AnalysisReportInput):string {
 const body=analysisReportBlocks(input).map(b=>{const tag=b.kind==='title'?'h1':b.kind==='heading'?'h2':b.kind==='quote'?'blockquote':'p';const link=safeReportUrl(b.url);return `<${tag}>${escapeReportHtml(b.text)}${link?`<br><a href="${escapeReportHtml(link)}" rel="noopener noreferrer">${escapeReportHtml(link)}</a>`:''}</${tag}>`;}).join('\n');
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeReportHtml(input.request.title||'One DSD equity analysis')}</title><style>body{font:17px/1.6 system-ui,sans-serif;color:#183149;background:#fff;max-width:850px;margin:2rem auto;padding:0 1.5rem}h1,h2{line-height:1.25}h2{font-size:1.25rem;margin-top:2rem}p,blockquote{white-space:pre-wrap;overflow-wrap:anywhere}blockquote{border-left:4px solid #596b7c;margin:1rem 0;padding-left:1rem}a{color:#17395d}@media print{body{margin:0;max-width:none}}</style></head><body><main>${body}</main></body></html>`;
}
export async function analysisReportWord(input:AnalysisReportInput):Promise<Blob>{
 const {Document,Paragraph,TextRun,Packer,HeadingLevel}=await import('docx');
 const children=analysisReportBlocks(input).map(block=>new Paragraph({
  heading:block.kind==='title'?HeadingLevel.TITLE:block.kind==='heading'?HeadingLevel.HEADING_1:undefined,
  spacing:{after:180},indent:block.kind==='quote'?{left:360}:undefined,
  children:[...block.text.split('\n').flatMap((text,index)=>[new TextRun({text,break:index?1:0,italics:block.kind==='quote'})]),...(block.url?[new TextRun({text:block.url,break:1})]:[])],
 }));
 return Packer.toBlob(new Document({creator:'One DSD People, Access and Culture',title:input.request.title,subject:"Working equity analysis",styles:{default:{document:{run:{font:'Calibri',size:24,color:'183149',language:{value:'en-US'}},paragraph:{spacing:{line:300}}}}},sections:[{children}]}));
}
