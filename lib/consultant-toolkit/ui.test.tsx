import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ConsultantToolkitWorkspace } from "@/components/consultant-toolkit-workspace";
import { navigation } from "@/components/consultant-toolkit/outputs";
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
    await openSaved();fireEvent.click(screen.getByRole("button",{name:"4. Run the analysis"}));
    fireEvent.click(screen.getByText("Read the complete analysis — 10 responses and evidence"));
    for(const question of getQuestions("scan"))expect(screen.getByLabelText(question.prompt)).toBeTruthy();
    expect(screen.getByText("A translated notice is available.")).toBeTruthy();
  });
  it("saves edits as draft then records an unchanged review before finalizing",async()=>{
    await openSaved();fireEvent.click(screen.getByRole("button",{name:"4. Run the analysis"}));
    fireEvent.click(screen.getByText("Edit the summary"));
    fireEvent.change(screen.getByLabelText("Summary"),{target:{value:"Reviewed summary."}});
    fireEvent.click(screen.getByRole("button",{name:"6. Download the outputs"}));
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
    await openSaved();fireEvent.click(screen.getByRole("button",{name:"1. Attach the document"}));expect((screen.getByLabelText("Analysis title") as HTMLInputElement).disabled).toBe(false);
    expect(screen.getByLabelText("Analysis title").closest("fieldset")?.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button",{name:"Reopen as draft"}));
    await screen.findByText("Reopened as a draft. It will need your review again before it can be marked final.");
    expect(record.status).toBe("draft");expect(record.finalizedAt).toBeNull();
  });
  it("requires an explicit choice before abandoning unsaved work and does not store it in the browser",async()=>{
    const store=vi.spyOn(Storage.prototype,"setItem");
    await openSaved();fireEvent.click(screen.getByRole("button",{name:"2. Check the setup"}));fireEvent.change(screen.getByLabelText("Decision or question"),{target:{value:"A revised decision question."}});
    fireEvent.click(screen.getByRole("button",{name:"New analysis"}));
    expect(screen.getByText("You have unsaved changes. Save them before opening another analysis, or discard them.")).toBeTruthy();
    expect(store).not.toHaveBeenCalled();
  });
  it("provides clear long-term services and supports evidence links without claiming their data is loaded",async()=>{
    await openSaved();fireEvent.click(screen.getByRole("button",{name:"1. Attach the document"}));expect(screen.getByRole("link",{name:"Who uses long-term services and supports"})).toBeTruthy();
    expect(screen.getByText(/Opening a dashboard does not load its data/)).toBeTruthy();
    const attach=screen.getByRole("button",{name:"Attach documents"});expect(attach.querySelector("svg")).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"4. Run the analysis"}));
    await waitFor(()=>expect((screen.getByRole("button",{name:"Run the analysis again"}) as HTMLButtonElement).disabled).toBe(false));
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

describe("automated run",()=>{
  it("suggests a setup after a document is pasted and applies it only when chosen",async()=>{
    render(<ConsultantToolkitWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:"Paste a document"}));
    fireEvent.change(screen.getByLabelText("Source title"),{target:{value:"Waiver notice proposal"}});
    fireEvent.change(screen.getByLabelText("Source text"),{target:{value:"The department will adopt new eligibility requirements for the CADI waiver. American Indian participants are underrepresented."}});
    fireEvent.click(screen.getByRole("button",{name:"2. Check the setup"}));
    await waitFor(()=>expect(document.activeElement?.textContent).toBe("Step 2 of 6: Check the setup"));
    const panel=screen.getByRole("region",{name:"Suggested setup"});
    expect(within(panel).getByText(/Suggested; you decide\./)).toBeTruthy();
    expect(within(panel).getByText("Community Access for Disability Inclusion Waiver")).toBeTruthy();
    expect((screen.getByLabelText("Decision or question") as HTMLTextAreaElement).value).toBe("");
    fireEvent.click(within(panel).getByRole("button",{name:"Use this setup"}));
    expect((screen.getByLabelText("Decision or question") as HTMLTextAreaElement).value).toMatch(/^How would .*Community Access for Disability Inclusion Waiver/);
    expect((screen.getByLabelText(/^Programs and service lines/) as HTMLInputElement).value).toBe("Community Access for Disability Inclusion Waiver");
    expect((screen.getByRole("radio",{name:/Full equity analysis/}) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole("button",{name:"3. See what is still needed"}));
    const needs=screen.getByRole("region",{name:"What is still needed"});
    expect(within(needs).getByText(/Dated information describing who is served/)).toBeTruthy();
    expect(within(needs).getByText(/not a judgement/)).toBeTruthy();
  });

  it("runs again on the same case, keeps typed notes and shows what closed since the last run",async()=>{
    record.request.answers={"scan-1":"Typed note from the review team."};
    let analyzeBody:{request:ToolkitRequest}|undefined;
    const rerun:ToolkitResponse={...structuredClone(result),answers:result.answers.map((answer,index)=>index===1?{...answer,kind:"inference",text:"Now answered from new data."}:answer),limitations:["Fewer gaps remain."]};
    const base=(globalThis.fetch as ReturnType<typeof vi.fn>).getMockImplementation() as (url:string,options?:RequestInit)=>Promise<unknown>;
    vi.stubGlobal("fetch",vi.fn((url:string,options?:RequestInit)=>{
      if(url==="/api/consultant/toolkit/analyze"){analyzeBody=JSON.parse(options!.body as string);return json({analysis:rerun,sources:analyzeBody!.request.sources,contextNote:""});}
      return base(url,options);
    }));
    await openSaved();
    fireEvent.click(screen.getByRole("button",{name:"5. Close the gaps"}));
    expect(screen.getByRole("region",{name:"What is still needed after this run"})).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Attach more material and run again"}));
    expect(screen.getByText(/The same case and your typed notes are kept/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Go to step 4 and run again"}));
    fireEvent.click(await screen.findByRole("button",{name:"Run the analysis again"}));
    const closedList=await screen.findByRole("region",{name:"Closed since the last run"});
    expect(within(closedList).getByText("Whether the review team reflects the identities of the people the decision will affect.")).toBeTruthy();
    expect(analyzeBody!.request.answers).toEqual({"scan-1":"Typed note from the review team."});
    expect(updates).toEqual([]);
  });

  it("sends the analysis to the Equity Policy Analyzer and opens the new case",async()=>{
    record.request.sources.push({id:"program-ref",title:"Reference",text:"Application reference.",origin:"application-context"});
    let sent:Record<string,unknown>|undefined;
    const assign=vi.spyOn(navigation,"assign").mockImplementation(()=>{});
    const base=(globalThis.fetch as ReturnType<typeof vi.fn>).getMockImplementation() as (url:string,options?:RequestInit)=>Promise<unknown>;
    vi.stubGlobal("fetch",vi.fn((url:string,options?:RequestInit)=>{
      if(url==="/api/equity-workspace/policy-analysis/cases"){sent=JSON.parse(options!.body as string);return Promise.resolve({ok:true,status:201,json:async()=>({case:{id:"9b2f7a52-3c3e-4d55-9a5e-0d1c9e4c7f11"}})});}
      return base(url,options);
    }));
    await openSaved();
    fireEvent.click(screen.getByRole("button",{name:"6. Download the outputs"}));
    for(const name of ["Download Leadership brief as Word","Download Request for information as PDF","Download Analysis report as Word"])expect(screen.getByRole("button",{name})).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Turn the recommendations into policy changes"}));
    await waitFor(()=>expect(assign).toHaveBeenCalledWith("/equity-workspace/policy-analyzer?case=9b2f7a52-3c3e-4d55-9a5e-0d1c9e4c7f11"));
    expect(sent).toEqual({title:request.title,policy:{title:request.title,programs:["CFSS"]},sources:[{id:"source-1",title:"Practice notice",text:"A translated notice is available.",origin:"user"}],context:`${request.question}\n\n${result.summary}`});
  });

  it("shows the error when the Equity Policy Analyzer refuses the case",async()=>{
    const base=(globalThis.fetch as ReturnType<typeof vi.fn>).getMockImplementation() as (url:string,options?:RequestInit)=>Promise<unknown>;
    vi.stubGlobal("fetch",vi.fn((url:string,options?:RequestInit)=>url==="/api/equity-workspace/policy-analysis/cases"?Promise.resolve({ok:false,status:400,json:async()=>({error:"Check the policy title."})}):base(url,options)));
    await openSaved();
    fireEvent.click(screen.getByRole("button",{name:"6. Download the outputs"}));
    fireEvent.click(screen.getByRole("button",{name:"Turn the recommendations into policy changes"}));
    expect((await screen.findByRole("alert")).textContent).toBe("Check the policy title.");
  });
});

describe("a course opened from its own page",()=>{
  const COURSE_TEXT="One DSD People, Access and Culture · Self-directed learning\nMicroaggressions: Recognizing Messages and Responding with Care\nFoundation · All staff\n\nPAGE 1: LISTEN TO THE MESSAGE\nA small exchange can carry more meaning than the speaker intended.\n";
  function linked(search:string,answer:()=>Promise<unknown>=()=>Promise.resolve({ok:true,status:200,text:async()=>COURSE_TEXT})){
    const base=(globalThis.fetch as ReturnType<typeof vi.fn>).getMockImplementation() as (url:string,options?:RequestInit)=>Promise<unknown>;
    const calls:{url:string;method:string}[]=[];
    vi.stubGlobal("fetch",vi.fn((url:string,options?:RequestInit)=>{calls.push({url,method:options?.method??"GET"});return url.startsWith("/api/downloads/")?answer():base(url,options);}));
    window.history.replaceState(null,"",`/consultant/toolkit${search}`);
    return calls;
  }
  afterEach(()=>window.history.replaceState(null,"","/"));

  it("loads the course as one pasted source and runs or saves nothing",async()=>{
    const calls=linked("?source=self-directed-course%3AF07");
    render(<ConsultantToolkitWorkspace/>);
    await screen.findByText("Microaggressions: Recognizing Messages and Responding with Care is loaded as a source. Check it below, then continue to the setup. Nothing has been run or saved.");
    expect((screen.getByLabelText("Source title") as HTMLInputElement).value).toBe("Microaggressions: Recognizing Messages and Responding with Care");
    expect((screen.getByLabelText("Source text") as HTMLTextAreaElement).value).toBe(COURSE_TEXT.trim());
    expect(screen.getByText("1 / 40 sources")).toBeTruthy();
    expect(calls.filter(call=>call.url.startsWith("/api/downloads/")).map(call=>call.url)).toEqual(["/api/downloads/self-directed-course/F07?format=txt"]);
    expect(calls.every(call=>call.method==="GET")).toBe(true);
    expect(calls.some(call=>/analyze|upload|export/.test(call.url))).toBe(false);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("loads a catalog course by its id",async()=>{
    const calls=linked("?source=course:div-f02-microaggressions");
    render(<ConsultantToolkitWorkspace/>);
    await screen.findByLabelText("Source title");
    expect(calls.some(call=>call.url==="/api/downloads/course/div-f02-microaggressions?format=txt")).toBe(true);
  });

  it("never adds the same course twice",async()=>{
    linked("?source=self-directed-course:F07");
    const first=render(<React.StrictMode><ConsultantToolkitWorkspace/></React.StrictMode>);
    await screen.findByLabelText("Source title");
    await waitFor(()=>expect(screen.getByText("1 / 40 sources")).toBeTruthy());
    expect(screen.getAllByLabelText("Source title")).toHaveLength(1);
    first.unmount();
  });

  it("refuses an unknown kind or id with a plain message and asks for nothing",async()=>{
    for(const search of ["?source=lesson:div-f02~lesson-1","?source=self-directed-course:F99","?source=course:../secret","?source=","?source=course:cultural-intelligence-tribal"]){
      const calls=linked(search);
      const view=render(<ConsultantToolkitWorkspace/>);
      expect((await screen.findByRole("alert")).textContent).toBe("That course could not be loaded. Attach the document or paste its text instead. Your work here is unchanged.");
      expect(calls.some(call=>call.url.startsWith("/api/downloads/")),search).toBe(false);
      expect(screen.getByText("0 / 40 sources")).toBeTruthy();
      view.unmount();
    }
  });

  it("shows a plain message when the course cannot be fetched",async()=>{
    for(const answer of [()=>Promise.resolve({ok:false,status:404,text:async()=>"{}"}),()=>Promise.resolve({ok:true,status:200,text:async()=>"   "}),()=>Promise.reject(new Error("offline"))]){
      linked("?source=self-directed-course:F07",answer);
      const view=render(<ConsultantToolkitWorkspace/>);
      expect((await screen.findByRole("alert")).textContent).toBe("That course could not be loaded. Attach the document or paste its text instead. Your work here is unchanged.");
      expect(screen.getByText("0 / 40 sources")).toBeTruthy();
      expect(screen.queryByLabelText("Source title")).toBeNull();
      view.unmount();
    }
  });

  it("does nothing without the parameter",async()=>{
    const calls=linked("");
    render(<ConsultantToolkitWorkspace/>);
    await waitFor(()=>expect(calls.length).toBeGreaterThan(1));
    expect(calls.some(call=>call.url.startsWith("/api/downloads/"))).toBe(false);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
