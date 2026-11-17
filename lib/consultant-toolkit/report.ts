import { getInstrument, getQuestions } from "./instrument";
import { fullNames } from "./auto-route";
import { afterRun, beforeRun, INFORMATION_CHECK_NOTE } from "./information-needed";
import type { ToolkitCase } from "./schema";
import { ADSA_GOALS } from "@/lib/consultant-analysis/schema";

export const TOOLKIT_REPORT_KINDS = ["report", "worksheet", "action-plan", "information-request", "leadership-brief"] as const;
export type ToolkitReportKind = typeof TOOLKIT_REPORT_KINDS[number];
export type ToolkitReportBlock = { kind:"title"|"heading"|"subheading"|"text"|"quote"; text:string };
export class ToolkitPdfFontError extends Error { constructor(){super("Some characters in this analysis are not supported by the PDF font. Download the Word report to preserve the complete wording.");this.name="ToolkitPdfFontError";} }
const titles:Record<ToolkitReportKind,string>={report:"Equity analysis report",worksheet:"Equity analysis worksheet","action-plan":"Equity action plan","information-request":"Request for information","leadership-brief":"Leadership brief"};
/** File name stems for downloads, without the status or extension. */
export const TOOLKIT_REPORT_FILE_STEMS:Record<ToolkitReportKind,string>={report:"equity-analysis-report",worksheet:"equity-analysis-worksheet","action-plan":"equity-action-plan","information-request":"equity-information-request","leadership-brief":"equity-leadership-brief"};
const safeUrl=(value?:string)=>{try{const url=new URL(value||"");return ["https:","http:"].includes(url.protocol)&&!url.username&&!url.password?url.href:null;}catch{return null;}};

export function toolkitReportBlocks(value:ToolkitCase,kind:ToolkitReportKind):ToolkitReportBlock[]{
  if(kind==="information-request")return informationRequestBlocks(value);
  if(kind==="leadership-brief")return leadershipBriefBlocks(value);
  const {request,result}=value;
  const instrument=getInstrument(request.track);
  const blocks:ToolkitReportBlock[]=[];
  const add=(kind:ToolkitReportBlock["kind"],text:string)=>blocks.push({kind,text});
  add("title",request.title);
  add("text",`${titles[kind]} · ${request.track==="scan"?"Equity scan":"Full equity analysis"}`);
  add("text",statusLine(value));
  if(value.finalizedAt)add("text",`Review completed ${value.finalizedAt.slice(0,10)}. This records review, not agency approval.`);
  add("heading","Decision and purpose");add("text",request.question);
  add("text",`Scope: ${request.scope}. Programs and service lines: ${request.programs.join(", ")||"Not specified"}.`);
  if(request.context)add("text",request.context);
  if(request.goals.length)add("text",`Aging and Disability Services Administration goal connections: ${request.goals.map(id=>ADSA_GOALS.find(goal=>goal.id===id)?.title||id).join(", ")}.`);
  add("heading","Summary");add("text",result?.summary||"An analysis has not yet been prepared. This document contains preparation notes only.");
  const appendAnswer=(question:{id:string;prompt:string;help:string})=>{
    const answer=result?.answers.find(item=>item.questionId===question.id);
    add("subheading",question.prompt);
    if(question.help)add("text",question.help);
    add("text",answer?.text||request.answers[question.id]||"Not yet recorded.");
    if(answer){add("text",answer.kind==="evidence"?"Supported by cited material.":answer.kind==="inference"?"Interpretation to review against the evidence.":"Evidence still needed.");
      for(const citation of answer.citations){const source=request.sources.find(item=>item.id===citation.sourceId);add("quote",citation.excerpt);add("text",`Source: ${source?.title||citation.sourceId}${source?.date?` (${source.date})`:""}.`);const url=safeUrl(source?.url);if(url)add("text",url);}
    }
  };
  if(kind!=="action-plan"){
    add("heading","Prepare the analysis");add("text",fullNames(instrument.preparationIntro));
    instrument.preparation.forEach(appendAnswer);
    for(const [index,stage] of instrument.stages.entries()){add("heading",`${index+1}. ${stage.title}`);add("text",fullNames(stage.description));stage.questions.forEach(appendAnswer);}
  }
  if(kind==="report"&&result?.alternatives.length){add("heading","Comparison of alternatives");for(const [index,option]of result.alternatives.entries()){add("subheading",`${index+1}. ${option.title}`);add("text",`Potential benefits: ${option.benefits}`);add("text",`Burdens and unintended effects: ${option.burdens}`);add("text",`Evidence still needed: ${option.evidenceNeeded}`);}}
  if(kind!=="worksheet"){
    add("heading","Action plan");
    if(!result?.actions.length)add("text","Actions have not yet been recorded.");
    for(const [index,action]of (result?.actions||[]).entries()){add("subheading",`${index+1}. ${action.action}`);for(const [key,label]of [["responsibleRole","Responsible role"],["dueDate","Timing"],["resources","Resources and support"],["measure","How to check progress"],["followUp","Follow-up and reporting back"]] as const)add("text",`${label}: ${action[key]}`);}
  }
  if(result){add("heading","Limitations and unresolved questions");if(!result.limitations.length&&!result.questionsForReview.length)add("text","No additional limitations or questions were recorded. This does not establish that none exist.");result.limitations.forEach(text=>add("text",text));result.questionsForReview.forEach(text=>add("text",text));}
  add("heading","Sources considered");
  if(!request.sources.length)add("text","No documentary sources were supplied.");
  request.sources.forEach((source,index)=>{add("subheading",`${index+1}. ${source.title}`);add("text",source.origin==="application-context"?"Related application reference; verify its authority and currentness for this decision.":"Supplied document or pasted evidence.");if(source.origin==="application-context"){const notes=source.text.split("\n").filter(line=>/^(Authority:|Resource location:|Source review date:|Official source entry point|No dashboard dataset)/.test(line));notes.forEach(note=>add("text",note));if(!notes.length)add("text",source.text.split("\n\n")[0].slice(0,1800));}if(source.date)add("text",`Source date: ${source.date}`);const url=safeUrl(source.url);if(url)add("text",url);});
  add("heading","About this worksheet");add("text",fullNames(instrument.authorityNote));add("text",`Instrument version ${value.instrumentVersion}. Quotes retain the wording of the source material. A supporting quotation alone does not establish that a conclusion is correct.`);
  return blocks;
}

const trackLabel=(value:ToolkitCase)=>value.request.track==="scan"?"Equity scan":"Full equity analysis";
function statusLine(value:ToolkitCase){return `Status: ${value.status==="final"?"Final, reviewed":value.status==="review"?"For review":"Draft"}. Saved ${value.updatedAt.slice(0,10)}. Version ${value.version}.`;}
/** Shortens long text at a sentence boundary so a brief stays within one to two pages. */
function brief(text:string,maximum=420){const value=text.replace(/\s+/g," ").trim();if(value.length<=maximum)return value;const cut=value.slice(0,maximum);const end=Math.max(cut.lastIndexOf(". "),cut.lastIndexOf("? "));return end>maximum*.5?cut.slice(0,end+1):`${cut.slice(0,cut.lastIndexOf(" ")).trimEnd()}…`;}
const evidenceWords={evidence:"Supported by cited material",inference:"Interpretation to review against the evidence",gap:"Evidence still needed"} as const;

/** A request addressed to whoever holds the information. No names; roles only. */
function informationRequestBlocks(value:ToolkitCase):ToolkitReportBlock[]{
  const {request,result}=value;
  const blocks:ToolkitReportBlock[]=[];
  const add=(kind:ToolkitReportBlock["kind"],text:string)=>blocks.push({kind,text});
  const prompts=new Map(getQuestions(request.track).map(question=>[question.id,question.prompt]));
  add("title",request.title);
  add("text",`${titles["information-request"]} · ${trackLabel(value)}`);
  add("text",`Prepared ${value.updatedAt.slice(0,10)}. Version ${value.version}.`);
  add("heading","Purpose");
  add("text","This request asks for information needed to complete an equity analysis of the decision described below. The analysis follows the Department of Human Services Equity Analysis Toolkit. The information helps show who is affected and how, so that the decision can reduce unequal burdens and widen its benefits.");
  add("text","It is sent to the person or area that may hold the information. If another person or area holds it, please pass this request on.");
  add("heading","The decision being analyzed");add("text",request.question);
  if(request.programs.length)add("text",`Programs and service lines: ${request.programs.join(", ")}.`);
  const missing=beforeRun(request).filter(item=>item.status==="missing");
  const covered=new Set(missing.flatMap(item=>item.questionIds));
  const gaps=result?afterRun(request,result):[];
  const questionGaps=gaps.filter(item=>item.questionIds.length&&!item.questionIds.every(id=>covered.has(id)));
  const openItems=gaps.filter(item=>!item.questionIds.length);
  add("heading","Information requested");
  if(!missing.length&&!questionGaps.length&&!openItems.length)add("text","No further information has been identified as needed. Any additional evidence about the people affected is still welcome.");
  let number=0;
  for(const item of [...missing,...questionGaps]){
    number++;
    add("subheading",`${number}. ${item.need}`);
    add("text",`Why it is needed: ${item.why}`);
    const answers=item.questionIds.map(id=>prompts.get(id)).filter((prompt):prompt is string=>Boolean(prompt));
    if(answers.length)add("text",`It helps answer: ${answers.join(" ")}`);
    add("text",`Who might have it: ${item.whoMightHaveIt}.`);
  }
  if(openItems.length){add("heading","Other open questions");for(const item of openItems)add("text",item.need);}
  add("heading","How to send it back");
  add("text","Reply to the person or area that sent this request. Documents, data tables, notes from meetings or a short written answer are all useful. Partial information is welcome; say what is not available or not yet known.");
  add("text","For any figures, include the date or period they cover, where they come from, how groups were defined and the number they are counted out of. Keep suppressed or missing values as reported.");
  add("text","Do not send information that identifies individual people unless it is needed for this analysis and you are permitted to share it.");
  add("heading","About this request");add("text",INFORMATION_CHECK_NOTE);
  return blocks;
}

/** One to two pages for leadership: the question, findings, options, actions, unknowns and the decision needed. */
function leadershipBriefBlocks(value:ToolkitCase):ToolkitReportBlock[]{
  const {request,result}=value;
  const blocks:ToolkitReportBlock[]=[];
  const add=(kind:ToolkitReportBlock["kind"],text:string)=>blocks.push({kind,text});
  add("title",request.title);
  add("text",`${titles["leadership-brief"]} · ${trackLabel(value)}`);
  add("text",statusLine(value));
  add("heading","The question");add("text",brief(request.question,600));
  add("heading","Summary");add("text",result?brief(result.summary,900):"An analysis has not yet been prepared.");
  if(result){
    const findings=[...result.answers.filter(answer=>answer.kind==="evidence"),...result.answers.filter(answer=>answer.kind==="inference")].slice(0,6);
    add("heading","Key findings");
    if(!findings.length)add("text","The analysis did not yet establish findings from the material supplied.");
    for(const answer of findings)add("text",`${evidenceWords[answer.kind]}: ${brief(answer.text,380)}`);
    if(result.alternatives.length){add("heading","Alternatives");for(const option of result.alternatives.slice(0,4))add("text",`${brief(option.title,160)}. Benefits: ${brief(option.benefits,220)} Burdens: ${brief(option.burdens,220)}`);}
    add("heading","Recommended actions");
    if(!result.actions.length)add("text","Actions have not yet been recorded.");
    for(const action of result.actions.slice(0,6))add("text",`${brief(action.action,260)} Responsible role: ${brief(action.responsibleRole,120)}. Timing: ${brief(action.dueDate,120)}.`);
    const unknown=afterRun(request,result);
    add("heading","What is still unknown");
    if(!unknown.length)add("text","No open gaps were recorded. This does not establish that none exist.");
    for(const item of unknown.slice(0,8))add("text",brief(item.need,260));
    if(unknown.length>8)add("text",`${unknown.length-8} further items are listed in the full report.`);
  }
  add("heading","Decision needed");
  add("text",result?.alternatives.length?"Choose among the alternatives above, confirm the responsible roles and dates for the recommended actions, and decide how the information still unknown will be gathered, before or after the decision.":"Confirm the responsible roles and dates for the recommended actions, and decide how the information still unknown will be gathered, before or after the decision.");
  add("text","This brief summarizes a working analysis. It is not an agency approval. The full report holds every response, source quotation and limitation.");
  return blocks;
}

export async function toolkitReportWord(value:ToolkitCase,kind:ToolkitReportKind):Promise<Uint8Array>{
  const { Document,Paragraph,TextRun,Packer,HeadingLevel,Footer,PageNumber }=await import("docx");
  const children=toolkitReportBlocks(value,kind).map(block=>new Paragraph({
    heading:block.kind==="title"?HeadingLevel.TITLE:block.kind==="heading"?HeadingLevel.HEADING_1:block.kind==="subheading"?HeadingLevel.HEADING_2:undefined,
    keepNext:["title","heading","subheading"].includes(block.kind),
    spacing:{before:block.kind==="heading"?240:block.kind==="subheading"?120:0,after:160},
    indent:block.kind==="quote"?{left:300,right:160}:undefined,
    children:block.text.split("\n").map((text,index)=>new TextRun({text,break:index?1:0,italics:block.kind==="quote"})),
  }));
  const doc=new Document({creator:"People, Access and Culture",title:value.title,description:titles[kind],subject:titles[kind],styles:{default:{document:{run:{font:"Aptos",size:22,color:"000000",language:{value:"en-US"}},paragraph:{spacing:{line:285}}}},paragraphStyles:[
    {id:"Title",name:"Title",basedOn:"Normal",next:"Normal",run:{font:"Aptos",size:38,bold:true,color:"000000"}},
    {id:"Heading1",name:"Heading 1",basedOn:"Normal",next:"Normal",run:{font:"Aptos",size:28,bold:true,color:"000000"}},
    {id:"Heading2",name:"Heading 2",basedOn:"Normal",next:"Normal",run:{font:"Aptos",size:23,bold:true,color:"000000"}},
  ]},sections:[{properties:{page:{size:{width:12240,height:15840},margin:{top:900,bottom:900,left:1000,right:1000}}},footers:{default:new Footer({children:[new Paragraph({children:[new TextRun({text:`${value.status==="final"?"Final":"Working copy"} · `,size:18}),new TextRun({children:[PageNumber.CURRENT],size:18})]})]})},children}]});
  return new Uint8Array(await Packer.toBuffer(doc));
}

export async function toolkitReportPdf(value:ToolkitCase,kind:ToolkitReportKind):Promise<Uint8Array>{
  const {default:PDFDocument}=await import("pdfkit");
  const {join}=await import("node:path");
  const doc=new PDFDocument({size:"LETTER",margins:{top:54,bottom:56,left:54,right:54},bufferPages:true,tagged:true,lang:"en-US",pdfVersion:"1.7",displayTitle:true,info:{Title:value.title,Author:"People, Access and Culture",Subject:titles[kind]}});
  doc.registerFont("Toolkit",join(process.cwd(),"lib/consultant-toolkit/fonts/DejaVuSans.ttf")).font("Toolkit");
  const font=(doc as unknown as {_font:{font:{hasGlyphForCodePoint:(point:number)=>boolean}}})._font.font;
  const blocks=toolkitReportBlocks(value,kind);
  for(const block of blocks)for(const character of block.text){if(!/\s/u.test(character)&&!font.hasGlyphForCodePoint(character.codePointAt(0)!)){doc.destroy();throw new ToolkitPdfFontError();}}
  const chunks:Buffer[]=[];
  const finished=new Promise<Uint8Array>((resolve,reject)=>{doc.on("data",chunk=>chunks.push(Buffer.from(chunk)));doc.on("end",()=>resolve(new Uint8Array(Buffer.concat(chunks))));doc.on("error",reject);});
  const root=doc.struct("Document");doc.addStructure(root);
  const width=doc.page.width-108;
  for(const block of blocks){
    const heading=["title","heading","subheading"].includes(block.kind);
    const size=block.kind==="title"?22:block.kind==="heading"?15:block.kind==="subheading"?11.5:10.5;
    if(heading && doc.y>doc.page.height-120)doc.addPage();
    if(block.kind==="heading")doc.moveDown(.7);
    doc.font("Toolkit").fontSize(size).fillColor("000000");
    const tag=block.kind==="title"?"H1":block.kind==="heading"?"H2":block.kind==="subheading"?"H3":block.kind==="quote"?"BlockQuote":"P";
    root.add(doc.struct(tag,{},[()=>doc.text(block.text,block.kind==="quote"?68:54,doc.y,{width:width-(block.kind==="quote"?28:0),lineGap:3,paragraphGap:3})]));
    if(block.kind==="heading")doc.outline.addItem(block.text);
    doc.moveDown(block.kind==="title"?.6:.55);
  }
  const pages=doc.bufferedPageRange();
  for(let i=pages.start;i<pages.start+pages.count;i++){doc.switchToPage(i);const bottom=doc.page.margins.bottom;doc.page.margins.bottom=0;doc.markContent("Artifact",{type:"Pagination"});doc.font("Toolkit").fontSize(8).fillColor("444444").text(`${value.status==="final"?"Final copy":"Working copy"} · ${i+1} / ${pages.count}`,54,doc.page.height-36,{width,align:"right",lineBreak:false});doc.endMarkedContent();doc.page.margins.bottom=bottom;}
  root.end();doc.end();return finished;
}
