// @vitest-environment node
import { describe,expect,it } from "vitest";
import { getQuestions, TOOLKIT_VERSION } from "./instrument";
import { toolkitReportBlocks,toolkitReportWord,toolkitReportPdf } from "./report";
import type { ToolkitCase } from "./schema";
import { mkdir,writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const fixture:ToolkitCase={
  id:"46aad095-0bad-49ea-8e34-d343b91ceac5",version:3,instrumentVersion:TOOLKIT_VERSION,status:"final",title:"Improving access to a service notice",
  request:{title:"Improving access to a service notice",question:"How could a revised service notice improve access while preserving clear information?",context:"Synthetic example used only to check the report. No actual program findings are asserted.",track:"scan",scope:"division",programs:["CFSS"],goals:["equity-goal-6"],sources:[{id:"notice",title:"Synthetic notice excerpt",text:"People may request a translated copy.",url:"https://mn.gov/dhs/"}],routing:{priorAnalysisIntegrated:false,materialChange:true,knownDisparities:false,timeLimited:false},answers:{}},
  result:{summary:"This practice review identifies questions about language access and follow-up. The supplied excerpt offers a translated copy, but does not establish whether people can obtain it when needed.",answers:getQuestions("scan").map((question,index)=>({questionId:question.id,text:index===0?"The supplied notice offers a translated copy. Evidence about the review team and affected people's experiences is still needed.":"The source does not answer this question. Gather the relevant evidence and document what affected people say before reaching a conclusion.",kind:index===0?"inference":"gap",citations:index===0?[{sourceId:"notice",excerpt:"People may request a translated copy."}]:[]})),alternatives:[{title:"Retain the current notice",benefits:"Uses existing materials.",burdens:"Existing barriers may remain.",evidenceNeeded:"Evidence about receipt, understanding, and follow-up."},{title:"Test a revised notice with participants",benefits:"Identifies barriers before wider use.",burdens:"Requires participant time and support.",evidenceNeeded:"Documented feedback and suitable measures."}],actions:[{action:"Invite people who use the notice to review it",responsibleRole:"Program manager and engagement staff",dueDate:"Agree a date with participants",resources:"Accessible formats, interpretation, and staff time",measure:"Document whether participants can identify and complete the next step",followUp:"Share revisions and invite a second review"}],limitations:["No engagement findings or measured outcomes were supplied."],questionsForReview:["Which perspectives are missing, and how will people influence the next decision?"]},
  createdAt:"2026-10-15T12:00:00.000Z",updatedAt:"2026-10-15T12:10:00.000Z",finalizedAt:"2026-10-15T12:10:00.000Z",
};

describe("consultant toolkit reports",()=>{
  it("includes every preparation and scan response, sources, and final review boundary",()=>{
    const text=toolkitReportBlocks(fixture,"report").map(block=>block.text).join("\n");
    for(const question of getQuestions("scan"))expect(text).toContain(question.prompt);
    expect(text).toContain("People may request a translated copy.");expect(text).toContain("not agency approval");expect(text).toContain("Communication and Accessibility");
  });
  it("keeps each download focused without omitting limits or source references",()=>{
    const actions=toolkitReportBlocks(fixture,"action-plan").map(block=>block.text).join("\n");
    expect(actions).toContain("Responsible role: Program manager");expect(actions).toContain("No engagement findings");expect(actions).toContain("Synthetic notice excerpt");
    expect(actions).not.toContain(getQuestions("scan")[0].prompt);
    expect(toolkitReportBlocks(fixture,"worksheet").some(block=>block.text==="Comparison of alternatives")).toBe(false);
  });
  it("creates real Word and PDF documents and saves synthetic fixtures for visual inspection",async()=>{
    const word=await toolkitReportWord(fixture,"report");const pdf=await toolkitReportPdf(fixture,"report");
    expect(Buffer.from(word).subarray(0,2).toString()).toBe("PK");expect(Buffer.from(pdf).subarray(0,5).toString()).toBe("%PDF-");
    const directory=resolve(process.cwd(),"../checks/export-fixtures");await mkdir(directory,{recursive:true});
    await writeFile(resolve(directory,"synthetic-analysis.docx"),word);await writeFile(resolve(directory,"synthetic-analysis.pdf"),pdf);
  });
  it("preserves supported multilingual text and rejects unsupported PDF glyphs instead of losing them",async()=>{
    const multilingual=structuredClone(fixture);multilingual.request.context="Thông tin · Hmoob · Soomaali · العربية";
    const pdf=await toolkitReportPdf(multilingual,"action-plan");expect(pdf.byteLength).toBeGreaterThan(5000);
    multilingual.request.context="中文";
    await expect(toolkitReportPdf(multilingual,"report")).rejects.toThrow("Download the Word report");
  });
});
