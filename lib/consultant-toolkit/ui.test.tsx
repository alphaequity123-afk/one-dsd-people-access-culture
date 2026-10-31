import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ConsultantToolkitWorkspace } from "@/components/consultant-toolkit-workspace";
import { getQuestions, TOOLKIT_VERSION } from "./instrument";
import type { ToolkitCase, ToolkitRequest, ToolkitResponse } from "./schema";

const request:ToolkitRequest={title:"Test service notice",question:"How can the notice improve access?",context:"Practice review for interface testing.",track:"scan",scope:"division",programs:["CFSS"],goals:[],sources:[{id:"source-1",title:"Practice notice",text:"A translated notice is available."}],routing:{priorAnalysisIntegrated:true,materialChange:false,knownDisparities:false,timeLimited:false},answers:{}};
const result:ToolkitResponse={summary:"Test summary.",answers:getQuestions("scan").map((question,index)=>({questionId:question.id,text:index===0?"The notice offers a translation.":"Further evidence is needed.",kind:index===0?"evidence":"gap",citations:index===0?[{sourceId:"source-1",excerpt:"A translated notice is available."}]:[]})),alternatives:[{title:"Offer a contact choice",benefits:"People choose a suitable channel.",burdens:"Staff need time.",evidenceNeeded:"Ask people about preferred channels."}],actions:[{action:"Review notice access",responsibleRole:"Program manager",dueDate:"Before release",resources:"Staff time",measure:"Successful contacts",followUp:"Review with participants"}],limitations:["No engagement findings supplied."],questionsForReview:["Whose input is missing?"]};
let record:ToolkitCase;
let updates:Record<string,unknown>[];
const json=(value:unknown)=>Promise.resolve({ok:true,json:async()=>value});

beforeEach(()=>{
  record={id:"46aad095-0bad-49ea-8e34-d343b91ceac5",version:1,instrumentVersion:TOOLKIT_VERSION,status:"draft",title:request.title,request:structuredClone(request),result:structuredClone(result),createdAt:"2026-10-15T12:00:00.000Z",updatedAt:"2026-10-15T12:00:00.000Z",finalizedAt:null};updates=[];
  vi.stubGlobal("fetch",vi.fn((url:string,options?:RequestInit)=>{
    if(url==="/api/consultant/toolkit")return json({analysisAvailable:true,caseSavingAvailable:true,privateProcessingNote:"Private test service."});
    if(url==="/api/consultant/toolkit/cases")return json({cases:[record],nextOffset:null});
    if(url.includes(record.id)&&options?.method==="PUT"){
      const body=JSON.parse(options.body as string);updates.push(body);
      record={...record,...body.payload,version:record.version+1,status:body.status,finalizedAt:body.status==="final"?"2026-10-15T12:10:00.000Z":null};return json({case:record});
    }
    if(url.includes(record.id))return json({case:record});
    throw new Error(`Unexpected request ${url}`);
  }));
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks();});

async function openSaved(){
  render(<ConsultantToolkitWorkspace/>);fireEvent.click(screen.getByRole("button",{name:"Saved analyses"}));
  fireEvent.click(await screen.findByRole("button",{name:"Open Test service notice"}));
  await screen.findByText("Saved analysis opened.");
}

describe("consultant toolkit review",()=>{
  it("shows every preparation and scan response with exact evidence",async()=>{
    await openSaved();fireEvent.click(screen.getByRole("button",{name:"2. Examine"}));
    fireEvent.click(screen.getByText("Read the complete analysis — 10 responses and evidence"));
    for(const question of getQuestions("scan"))expect(screen.getByLabelText(question.prompt)).toBeTruthy();
    expect(screen.getByText("A translated notice is available.")).toBeTruthy();
  });
  it("saves edits as draft then records an unchanged review before finalizing",async()=>{
    await openSaved();fireEvent.click(screen.getByRole("button",{name:"2. Examine"}));
    fireEvent.click(screen.getByText("Edit the summary"));
    fireEvent.change(screen.getByLabelText("Summary"),{target:{value:"Reviewed summary."}});
    fireEvent.click(screen.getByRole("button",{name:"3. Review and download"}));
    fireEvent.click(screen.getByRole("button",{name:"Save for review"}));
    await screen.findByText("Saved for your final review.");
    expect(updates.map(item=>item.status)).toEqual(["draft","review"]);
    expect(updates.map(item=>item.expectedVersion)).toEqual([1,2]);
    for(const checkbox of screen.getAllByRole("checkbox"))fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button",{name:"Approve final copy"}));
    await screen.findByText("Final copy saved. You can download it below.");
    expect(updates[2]).toMatchObject({status:"final",approveFinal:true,expectedVersion:3});
  });
  it("locks a final analysis until explicitly reopened and clears final approval",async()=>{
    record={...record,status:"final",finalizedAt:"2026-10-15T12:10:00.000Z"};
    await openSaved();fireEvent.click(screen.getByRole("button",{name:"1. Prepare"}));expect((screen.getByLabelText("Analysis title") as HTMLInputElement).disabled).toBe(false);
    expect(screen.getByLabelText("Analysis title").closest("fieldset")?.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button",{name:"Reopen as draft"}));
    await screen.findByText("Reopened as a draft. It will need your review again before it can be marked final.");
    expect(record.status).toBe("draft");expect(record.finalizedAt).toBeNull();
  });
  it("requires an explicit choice before abandoning unsaved work and does not store it in the browser",async()=>{
    const store=vi.spyOn(Storage.prototype,"setItem");
    await openSaved();fireEvent.click(screen.getByRole("button",{name:"1. Prepare"}));fireEvent.change(screen.getByLabelText("Decision or question"),{target:{value:"A revised decision question."}});
    fireEvent.click(screen.getByRole("button",{name:"New analysis"}));
    expect(screen.getByText("You have unsaved changes. Save them before opening another analysis, or discard them.")).toBeTruthy();
    expect(store).not.toHaveBeenCalled();
  });
  it("provides clear LTSS evidence links without claiming their data is loaded",async()=>{
    await openSaved();fireEvent.click(screen.getByRole("button",{name:"1. Prepare"}));expect(screen.getByRole("link",{name:"Who uses LTSS"})).toBeTruthy();
    expect(screen.getByText(/Opening a dashboard does not load its data/)).toBeTruthy();
    const attach=screen.getByRole("button",{name:"Attach documents"});expect(attach.querySelector("svg")).toBeTruthy();
    await waitFor(()=>expect(screen.getByRole("button",{name:"Prepare scan draft"})).toBeTruthy());
  });
});

describe("evidence-preserving decision brief",()=>{
  it.each(["scan","full"] as const)("opens a saved %s at its brief without hiding qualifications or changing evidence",async(track)=>{
    const summary="A staged approach may improve access. This finding is conditional on meaningful engagement and continuity protections; it is not evidence that services have improved.";
    record.request.track=track;
    record.result={...structuredClone(result),summary,answers:getQuestions(track).map((question,index)=>({...structuredClone(result.answers[index%result.answers.length]),questionId:question.id})),limitations:["No engagement findings supplied.","A lower allocation does not by itself establish a loss of services."],questionsForReview:["Whose input is missing?","What evidence could change the proposed recommendation?"]};
    const original=structuredClone(record);
    await openSaved();
    const brief=screen.getByRole("region",{name:"Decision brief"});
    expect(within(brief).getByText(summary,{selector:"p"})).toBeTruthy();
    expect(within(brief).getByText(request.question)).toBeTruthy();
    const attention=screen.getByRole("region",{name:"What needs attention before a decision"});
    for(const limitation of original.result!.limitations)expect(within(attention).getByText(limitation,{selector:"li"})).toBeTruthy();
    for(const question of original.result!.questionsForReview)expect(within(attention).getByText(question,{selector:"li"})).toBeTruthy();
    const disclosure=screen.getByText(`Read the complete analysis — ${getQuestions(track).length} responses and evidence`).closest("details")!;
    expect(disclosure.open).toBe(false);
    fireEvent.click(disclosure.querySelector("summary")!);
    await waitFor(()=>expect(disclosure.open).toBe(true));
    for(const answer of original.result!.answers){
      const question=getQuestions(track).find(item=>item.id===answer.questionId)!;
      expect((screen.getByLabelText(question.prompt) as HTMLTextAreaElement).value).toBe(answer.text);
    }
    expect(screen.getAllByText("A translated notice is available.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Supported by the cited material").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Evidence still needed").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText("Compare the options"));
    expect((screen.getByLabelText("Potential benefits") as HTMLTextAreaElement).value).toBe(result.alternatives[0].benefits);
    fireEvent.click(screen.getByText("Turn findings into action"));
    expect((screen.getByLabelText("How to check progress") as HTMLTextAreaElement).value).toBe(result.actions[0].measure);
    expect(record).toEqual(original);expect(updates).toEqual([]);
  });
  it("keeps consultant edits in the brief and saves all untouched responses, citations, and actions",async()=>{
    await openSaved();
    fireEvent.click(screen.getByText("Edit the summary"));
    fireEvent.change(screen.getByLabelText("Summary"),{target:{value:"Consultant interpretation, subject to participant review."}});
    fireEvent.click(screen.getByText("Edit limitations and review questions"));
    fireEvent.change(screen.getByLabelText("Limitation 1"),{target:{value:"The affected participants have not yet reviewed the proposal."}});
    expect(within(screen.getByRole("region",{name:"Decision brief"})).getByText("Consultant interpretation, subject to participant review.",{selector:"p"})).toBeTruthy();
    expect(within(screen.getByRole("region",{name:"What needs attention before a decision"})).getByText("The affected participants have not yet reviewed the proposal.",{selector:"li"})).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Save draft"}));
    await screen.findByText("Draft saved in your private case library.");
    expect(record.result).toEqual({...result,summary:"Consultant interpretation, subject to participant review.",limitations:["The affected participants have not yet reviewed the proposal."]});
    expect(record.status).toBe("draft");expect(record.request).toEqual(request);
    expect(updates).toHaveLength(1);
  });
});
