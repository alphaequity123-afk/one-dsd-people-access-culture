"use client";
import { SourceLink } from "@/components/app-link";


import { useEffect, useMemo, useRef, useState } from "react";
import { ADSA_GOALS } from "@/lib/consultant-analysis/schema";
import { fullNames, suggestSetup } from "@/lib/consultant-toolkit/auto-route";
import { afterRun, beforeRun, closedSinceLastRun, gapQuestionIds } from "@/lib/consultant-toolkit/information-needed";
import { getInstrument, getQuestions, recommendTrack } from "@/lib/consultant-toolkit/instrument";
import { casePayloadSchema, toolkitCaseSchema, toolkitRequestSchema, toolkitResponseSchema, TOOLKIT_LIMITS, type ToolkitCase, type ToolkitRequest, type ToolkitResponse } from "@/lib/consultant-toolkit/schema";
import { LTSS_RESOURCES } from "@/lib/consultant-toolkit/ltss";
import { linkedSourceId, linkedSourceTextHref, linkedSourceTitle, parseLinkedSource } from "@/lib/consultant-toolkit/linked-source";
import { AnalysisView, sourceNotes } from "./consultant-toolkit/analysis-view";
import { Field, ROUTING_LABELS, SCOPE_LABELS, spelledOut, TRACK_LABELS } from "./consultant-toolkit/field";
import { ClosedSinceLastRun, InformationNeededPanel } from "./consultant-toolkit/information-needed-panel";
import { navigation, OutputsPanel, policyCaseBody, type DownloadFormat, type DownloadKind } from "./consultant-toolkit/outputs";
import { SuggestedSetupPanel } from "./consultant-toolkit/suggested-setup";
import styles from "./consultant-toolkit-workspace.module.css";

type Availability = { analysisAvailable: boolean; analysisUnavailableReason: string | null; caseSavingAvailable: boolean; caseSavingUnavailableReason: string | null; privateProcessingNote: string };
type CaseSummary = Pick<ToolkitCase,"id"|"version"|"status"|"title"|"createdAt"|"updatedAt">;
type Source = ToolkitRequest["sources"][number];
type Step = "attach"|"setup"|"needs"|"run"|"gaps"|"outputs";
type SetupFields = Partial<Pick<ToolkitRequest,"title"|"track"|"routing"|"programs"|"scope"|"question">>;
const STEPS: [Step,string][] = [
  ["attach","Attach the document"],
  ["setup","Check the setup"],
  ["needs","See what is still needed"],
  ["run","Run the analysis"],
  ["gaps","Close the gaps"],
  ["outputs","Download the outputs"],
];
const emptyRequest = (): ToolkitRequest => ({ title: "", question: "", context: "", track: "full", scope: "division", programs: [], goals: [], sources: [], routing: { priorAnalysisIntegrated: false, materialChange: false, knownDisparities: false, timeLimited: false }, answers: {} });
const readReview = { evidence: false, perspectives: false, actions: false };
const shownDate = (value: string) => new Date(value).toLocaleDateString(undefined,{ year:"numeric",month:"short",day:"numeric" });
const plainError = (cause: unknown, fallback: string) => cause instanceof Error ? cause.message : fallback;
/** Typed notes stay with the case; only notes that belong to the selected track's questions are kept. */
const answersFor = (answers: ToolkitRequest["answers"], track: ToolkitRequest["track"]) => { const ids = new Set(getQuestions(track).map(question=>question.id)); return Object.fromEntries(Object.entries(answers).filter(([id])=>ids.has(id))); };
const fileName = (header: string|null, fallback: string) => /filename="([^"]+)"/.exec(header||"")?.[1] || fallback;
const POLICY_ERROR = "The Equity Policy Analyzer could not open this analysis. Your work here is unchanged.";
const LINKED_SOURCE_ERROR = "That course could not be loaded. Attach the document or paste its text instead. Your work here is unchanged.";

export function ConsultantToolkitWorkspace() {
  const [request,setRequest] = useState<ToolkitRequest>(emptyRequest);
  const [programText,setProgramText] = useState("");
  const [result,setResult] = useState<ToolkitResponse|null>(null);
  const [saved,setSaved] = useState<ToolkitCase|null>(null);
  const [cases,setCases] = useState<CaseSummary[]>([]);
  const [nextOffset,setNextOffset] = useState<number|null>(null);
  const [availability,setAvailability] = useState<Availability|null>(null);
  const [step,setStep] = useState<Step>("attach");
  const [dirty,setDirty] = useState(false);
  const [busy,setBusy] = useState("");
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");
  const [contextNote,setContextNote] = useState("");
  const [review,setReview] = useState(readReview);
  const [library,setLibrary] = useState(false);
  const [pendingOpen,setPendingOpen] = useState<string|null>(null);
  const [removeConfirm,setRemoveConfirm] = useState(false);
  const [lastRunGaps,setLastRunGaps] = useState<string[]|null>(null);
  const [closed,setClosed] = useState<{ questionId: string; title: string }[]>([]);
  const [addingMore,setAddingMore] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const mainHeading = useRef<HTMLHeadingElement>(null);
  const locked = saved?.status === "final";
  const unavailable = availability?.analysisAvailable === false;
  const instrument = getInstrument(request.track);
  const allReviewed = Object.values(review).every(Boolean);
  const prompts = useMemo(()=>new Map(getQuestions(request.track).map(question=>[question.id,question.prompt])),[request.track]);
  const userMaterial = useMemo(()=>request.sources.filter(source=>source.origin!=="application-context").map(source=>`${source.title}\n${source.text}`).join("\n\n"),[request.sources]);
  const suggestion = useMemo(()=>userMaterial.trim()?suggestSetup({title:request.title,text:`${userMaterial}\n${request.context}`},{today:new Date()}):null,[request.title,request.context,userMaterial]);
  const needsBefore = useMemo(()=>beforeRun(request),[request]);
  const needsAfter = useMemo(()=>result?afterRun(request,result):[],[request,result]);

  useEffect(()=>{
    const controller = new AbortController();
    void Promise.all([
      fetch("/api/consultant/toolkit",{ signal:controller.signal,cache:"no-store" }).then(async response=>{ const body=await response.json(); if(!response.ok) throw new Error(body.error||"The workspace could not connect."); setAvailability(body); }),
      fetch("/api/consultant/toolkit/cases",{ signal:controller.signal,cache:"no-store" }).then(async response=>{ const body=await response.json(); if(response.ok && Array.isArray(body.cases)){setCases(body.cases);setNextOffset(body.nextOffset??null);} }),
    ]).catch(cause=>{ if(!controller.signal.aborted)setError(plainError(cause,"The workspace could not connect. You can still prepare your material.")); });
    return ()=>controller.abort();
  },[]);
  // A course opened from its own page (?source=course:<id>) arrives as one pasted source. Nothing is run or saved.
  useEffect(()=>{
    const requested=new URLSearchParams(window.location.search).get("source");
    if(requested===null)return;
    const controller=new AbortController();
    Promise.resolve(parseLinkedSource(requested)).then(async linked=>{
      if(!linked)throw new Error(LINKED_SOURCE_ERROR);
      setBusy("Loading the course…");
      const response=await fetch(linkedSourceTextHref(linked),{signal:controller.signal,cache:"no-store",credentials:"same-origin"});
      if(!response.ok)throw new Error(LINKED_SOURCE_ERROR);
      const text=(await response.text()).trim();
      if(!text)throw new Error(LINKED_SOURCE_ERROR);
      const id=linkedSourceId(linked),title=linkedSourceTitle(text,linked);
      setRequest(previous=>previous.sources.some(source=>source.id===id)||previous.sources.length>=TOOLKIT_LIMITS.sources?previous:{...previous,sources:[...previous.sources,{id,title,text:text.slice(0,TOOLKIT_LIMITS.sourceCharacters),origin:"user"}]});
      setDirty(true);
      setMessage(`${title} is loaded as a source. Check it below, then continue to the setup. Nothing has been run or saved.`);
    }).catch(()=>{ if(!controller.signal.aborted)setError(LINKED_SOURCE_ERROR); }).finally(()=>{ if(!controller.signal.aborted)setBusy(""); });
    return ()=>controller.abort();
  },[]);
  useEffect(()=>{
    if(!dirty)return;
    const warn=(event:BeforeUnloadEvent)=>{ event.preventDefault(); event.returnValue=""; };
    window.addEventListener("beforeunload",warn); return ()=>window.removeEventListener("beforeunload",warn);
  },[dirty]);

  function changed() { setDirty(true); setReview(readReview); setError(""); setMessage(""); }
  function staleResult() { if(result){ setResult(null); setContextNote(""); setMessage("The material or setup changed. Run the analysis again so it matches. Your typed notes are kept."); } }
  function update<K extends keyof ToolkitRequest>(key:K,value:ToolkitRequest[K]) {
    if(locked)return;
    changed(); setRequest(previous=>({...previous,[key]:value,...(key==="track"?{answers:answersFor(previous.answers,value as ToolkitRequest["track"])}:{})}));
    staleResult();
  }
  function applySetup(fields:SetupFields,label:string) {
    if(locked)return;
    changed();
    setRequest(previous=>({...previous,...fields,...(fields.track?{answers:answersFor(previous.answers,fields.track)}:{})}));
    if(fields.programs)setProgramText(fields.programs.join(", "));
    staleResult();
    setMessage(label==="setup"?"The suggested setup is now in use. You can still change any field below.":`The suggested ${label} is now in use. You can still change it below.`);
  }
  function editResult(next:ToolkitResponse) { if(locked)return; changed(); setResult(next); }
  function editAnswer(id:string,text:string) {
    if(!result)return;
    editResult({...result,answers:result.answers.map(answer=>answer.questionId===id?{...answer,text,kind:answer.kind === "gap" ? "gap" : "inference"}:answer)});
  }
  async function jsonRequest(path:string,method:string,body?:unknown) {
    const response = await fetch(path,{method,cache:"no-store",headers:body?{"Content-Type":"application/json"}:undefined,body:body?JSON.stringify(body):undefined});
    const value = await response.json();
    if(!response.ok)throw new Error(typeof value.error==="string"?value.error:"That request could not be completed. Your work is still here.");
    return value;
  }
  function applyCase(value:ToolkitCase) {
    setSaved(value);setRequest(value.request);setProgramText(value.request.programs.join(", "));setResult(value.result);setDirty(false);setReview(readReview);setContextNote("");setPendingOpen(null);setError("");setRemoveConfirm(false);
    setCases(previous=>[value,...previous.filter(item=>item.id!==value.id)]);
  }
  async function save(status:ToolkitCase["status"]="draft",approveFinal=false) {
    setError("");setMessage("");
    const parsed=casePayloadSchema.safeParse({request,result});
    if(!parsed.success){ setError(parsed.error.issues[0]?.message||"Check the title, question, and source material before saving.");return null; }
    if(status==="final" && (!allReviewed || dirty || saved?.status!=="review")){setError("Save the review, then check the three review statements before marking it final.");return null;}
    setBusy("Saving your analysis…");
    try {
      let body;
      let current=saved;
      if(status==="review"&&(!current||dirty)){
        const draftBody=current?await jsonRequest(`/api/consultant/toolkit/cases/${encodeURIComponent(current.id)}`,"PUT",{expectedVersion:current.version,payload:parsed.data,status:"draft"}):await jsonRequest("/api/consultant/toolkit/cases","POST",{payload:parsed.data});
        current=toolkitCaseSchema.parse(draftBody.case);applyCase(current);
      }
      if(current) body=await jsonRequest(`/api/consultant/toolkit/cases/${encodeURIComponent(current.id)}`,"PUT",{expectedVersion:current.version,payload:parsed.data,status,approveFinal});
      else body=await jsonRequest("/api/consultant/toolkit/cases","POST",{payload:parsed.data});
      const value=toolkitCaseSchema.parse(body.case);applyCase(value);
      setMessage(value.status==="final"?"Final copy saved. You can download it below.":value.status==="review"?"Saved for your final review.":"Draft saved in your private case library.");
      return value;
    } catch(cause){setError(plainError(cause,"This analysis could not be saved. Your work is still here."));return null;}
    finally{setBusy("");}
  }
  async function openCase(id:string) {
    if(dirty){setPendingOpen(id);return;}
    await loadCase(id);
  }
  async function moreCases(){
    if(nextOffset===null)return;setBusy("Loading more saved analyses…");setError("");
    try{const body=await jsonRequest(`/api/consultant/toolkit/cases?offset=${nextOffset}`,"GET");setCases(previous=>[...previous,...body.cases.filter((item:CaseSummary)=>!previous.some(entry=>entry.id===item.id))]);setNextOffset(body.nextOffset??null);}
    catch(cause){setError(plainError(cause,"More saved analyses could not be loaded."));}finally{setBusy("");}
  }
  async function loadCase(id:string) {
    setBusy("Opening your saved analysis…");setError("");
    try{ const body=await jsonRequest(`/api/consultant/toolkit/cases/${encodeURIComponent(id)}`,"GET");const value=toolkitCaseSchema.parse(body.case);applyCase(value);setLastRunGaps(value.result?gapQuestionIds(value.result):null);setClosed([]);setAddingMore(false);setStep(value.result?"run":"attach");setLibrary(false);setMessage("Saved analysis opened."); }
    catch(cause){setError(plainError(cause,"That analysis could not be opened."));}
    finally{setBusy("");}
  }
  function newCase(force=false) {
    if(dirty&&!force){setPendingOpen("new");return;}
    setRequest(emptyRequest());setProgramText("");setResult(null);setSaved(null);setDirty(false);setReview(readReview);setMessage("");setError("");setContextNote("");setStep("attach");setPendingOpen(null);setRemoveConfirm(false);setLastRunGaps(null);setClosed([]);setAddingMore(false);
  }
  async function reopen() {
    if(!saved)return;setBusy("Reopening the analysis…");setError("");
    try{const body=await jsonRequest(`/api/consultant/toolkit/cases/${encodeURIComponent(saved.id)}`,"PUT",{expectedVersion:saved.version,payload:{request,result},status:"draft"});applyCase(toolkitCaseSchema.parse(body.case));setMessage("Reopened as a draft. It will need your review again before it can be marked final.");}
    catch(cause){setError(plainError(cause,"This analysis could not be reopened."));}finally{setBusy("");}
  }
  async function deleteCase() {
    if(!saved)return;setBusy("Removing the saved case…");setError("");
    try{await jsonRequest(`/api/consultant/toolkit/cases/${encodeURIComponent(saved.id)}`,"DELETE",{expectedVersion:saved.version});setCases(previous=>previous.filter(item=>item.id!==saved.id));newCase(true);setMessage("The saved case has been removed.");}
    catch(cause){setError(plainError(cause,"The case could not be removed."));}finally{setBusy("");}
  }
  async function upload(files:FileList|null) {
    if(!files?.length || locked)return;
    setError("");setMessage("");
    const added:Source[]=[];
    let uploadError="";
    setBusy("Reading your documents…");
    try{
      for(const file of Array.from(files)){
        if(!/\.(pdf|docx|pptx|txt|csv|tsv|xlsx)$/i.test(file.name)||file.size>20*1024*1024)throw new Error("Choose a PDF, Word, PowerPoint, Excel, comma-separated, tab-separated or plain text file no larger than 20 megabytes.");
        if(request.sources.length+added.length>=TOOLKIT_LIMITS.sources)throw new Error(`Use up to ${TOOLKIT_LIMITS.sources} documents or pasted sources at a time.`);
        const form=new FormData();form.append("file",file);
        const response=await fetch("/api/consultant/toolkit/upload",{method:"POST",body:form});
        const body=await response.json();if(!response.ok)throw new Error(body.error||`${file.name} could not be read.`);
        const source=body.source as Source;
        if(!source||typeof source.text!=="string"||typeof source.title!=="string")throw new Error("The document text could not be read.");
        added.push({...source,id:`upload-${crypto.randomUUID()}`,origin:"user"});
      }
    }catch(cause){uploadError=plainError(cause,"A document could not be read.");}
    finally{
      if(added.length){update("sources",[...request.sources,...added]);setMessage(`${added.length} ${added.length===1?"document added":"documents added"}. Review the extracted text; images, charts, and scanned pages may need a separate written description. A suggested setup is ready in step 2.`);}
      if(uploadError)setError(uploadError);
      setBusy("");if(fileInput.current)fileInput.current.value="";
    }
  }
  async function analyze() {
    setError("");setMessage("");
    const parsed=toolkitRequestSchema.safeParse(request);
    if(!parsed.success){setError(parsed.error.issues[0]?.message||"Complete the title, question and evidence before running the analysis.");return;}
    setBusy("Running the analysis…");
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),240000);
    try{
      const response=await fetch("/api/consultant/toolkit/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({request:parsed.data}),signal:controller.signal});
      const body=await response.json();if(!response.ok)throw new Error(body.error||"The analysis could not be prepared.");
      const analysis=toolkitResponseSchema.parse(body.analysis);
      // Typed notes (answers) travel with the request and are kept as they were.
      const nextRequest=toolkitRequestSchema.parse({...parsed.data,sources:body.sources??parsed.data.sources});
      const closedNow=lastRunGaps?closedSinceLastRun(lastRunGaps,analysis):[];
      setResult(analysis);setRequest(nextRequest);setDirty(true);setReview(readReview);setContextNote(typeof body.contextNote==="string"?body.contextNote:"");setClosed(closedNow);setLastRunGaps(gapQuestionIds(analysis));setAddingMore(false);
      setStep("run");
      setMessage(`Analysis ready. Review each answer and its evidence, then save.${closedNow.length?` ${closedNow.length} ${closedNow.length===1?"need was":"needs were"} closed since the last run.`:""}`);
      setTimeout(()=>mainHeading.current?.focus(),0);
    }catch(cause){setError(controller.signal.aborted?"The analysis took longer than expected. Your material is still here; no automatic retry was made.":plainError(cause,"The analysis could not be prepared. Your material is still here."));}
    finally{clearTimeout(timeout);setBusy("");}
  }
  async function download(kind:DownloadKind,format:DownloadFormat) {
    if(!saved||dirty){setError("Save your current changes before downloading so the file matches this analysis.");return;}
    setBusy("Preparing your download…");setError("");
    try{
      const response=await fetch("/api/consultant/toolkit/export",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({caseId:saved.id,format,kind,expectedVersion:saved.version})});
      if(!response.ok){const body=await response.json();throw new Error(body.error||"The download could not be prepared.");}
      const blob=await response.blob();const url=URL.createObjectURL(blob);const anchor=document.createElement("a");anchor.href=url;anchor.download=fileName(response.headers.get("content-disposition"),`equity-${kind}.${format==="word"?"docx":format}`);document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);setMessage("Your download is ready. It contains the saved analysis and its review status.");
    }catch(cause){setError(plainError(cause,"The download could not be prepared."));}finally{setBusy("");}
  }
  async function policyChanges() {
    if(!result)return;
    setBusy("Opening the Equity Policy Analyzer…");setError("");
    try{
      const response=await fetch("/api/equity-workspace/policy-analysis/cases",{method:"POST",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify(policyCaseBody(saved?.title||request.title,request,result))});
      const body=await response.json().catch(()=>({}));
      const id=body?.case?.id;
      if(response.status!==201||typeof id!=="string")throw new Error(typeof body?.error==="string"?body.error:POLICY_ERROR);
      navigation.assign(`/equity-workspace/policy-analyzer?case=${encodeURIComponent(id)}`);
    }catch(cause){setError(plainError(cause,POLICY_ERROR));setBusy("");}
  }
  function sourceChange(index:number,key:"title"|"text"|"url",value:string) {update("sources",request.sources.map((source,i)=>{if(i!==index)return source;const next={...source,[key]:value,origin:"user" as const};if(key==="url"&&!value)delete next.url;return next;}));}
  function showStep(next:Step){setStep(next);setTimeout(()=>mainHeading.current?.focus(),0);}
  function attachMore(){setAddingMore(true);showStep("attach");}
  const routeRecommendation=recommendTrack(request.routing);
  const stepIndex=STEPS.findIndex(([id])=>id===step);
  const continueTo=(next:Step,label:string)=><div className={styles.actions}><button type="button" className={styles.primary} onClick={()=>showStep(next)}>{label}</button></div>;

  return <div className={styles.workspace} aria-busy={Boolean(busy)}>
    <div className={styles.toolbar}>
      <div><span className={styles.badge}>{locked?"Final":saved?.status==="review"&&!dirty?"Ready for review":"Draft"}</span><p className={styles.muted}>{saved?`${dirty?"Unsaved changes · ":""}Saved ${shownDate(saved.updatedAt)}`:"Your case stays private to this workspace."}</p></div>
      <div className={styles.actions}><button type="button" className={styles.secondary} disabled={Boolean(busy)} onClick={()=>setLibrary(!library)} aria-expanded={library}>Saved analyses</button><button type="button" className={styles.secondary} disabled={Boolean(busy)} onClick={()=>newCase()}>New analysis</button>{!locked&&<button type="button" className={styles.primary} disabled={Boolean(busy)||availability?.caseSavingAvailable===false} onClick={()=>void save()}>Save draft</button>}</div>
    </div>
    {library&&<section className={styles.panel} aria-label="Saved analyses"><h2>Your saved analyses</h2>{cases.length?<ul className={styles.library}>{cases.map(item=><li key={item.id}><div><strong>{item.title}</strong><span className={styles.muted}>{item.status==="final"?"Final":item.status==="review"?"For review":"Draft"} · {shownDate(item.updatedAt)}</span></div><button type="button" className={styles.secondary} aria-label={`Open ${item.title}`} disabled={Boolean(busy)} onClick={()=>void openCase(item.id)}>Open</button></li>)}</ul>:<p>No saved analyses yet. Give your work a title and save a draft to return to it later.</p>}{nextOffset!==null&&<button type="button" className={styles.textButton} disabled={Boolean(busy)} onClick={()=>void moreCases()}>Show more saved analyses</button>}</section>}
    {pendingOpen&&<div className={styles.notice}><p>You have unsaved changes. Save them before opening another analysis, or discard them.</p><div className={styles.actions}><button type="button" className={styles.primary} disabled={Boolean(busy)} onClick={async()=>{const next=pendingOpen;if(await save()){if(next==="new")newCase(true);else await loadCase(next);}}}>Save and continue</button><button type="button" className={styles.secondary} disabled={Boolean(busy)} onClick={()=>pendingOpen==="new"?newCase(true):void loadCase(pendingOpen)}>Discard changes and continue</button><button type="button" className={styles.textButton} onClick={()=>setPendingOpen(null)}>Keep working</button></div></div>}
    {error&&<p className={styles.error} role="alert">{error}</p>}
    <div aria-live="polite" aria-atomic="true">{busy?<p className={styles.message}>{busy}</p>:message?<p className={styles.message}>{message}</p>:null}</div>
    {availability?.caseSavingAvailable===false&&<p className={styles.notice}>{availability.caseSavingUnavailableReason||"Private case saving is not available yet. Keep this page open while you prepare your work."}</p>}
    {locked&&<div className={styles.notice}><p>This is the final saved copy. Reopen it as a draft to make changes and review it again.</p><button type="button" className={styles.secondary} disabled={Boolean(busy)} onClick={()=>void reopen()}>Reopen as draft</button></div>}
    <nav aria-label="Analysis steps"><ol className={styles.steps}>{STEPS.map(([id,label],index)=><li key={id}><button type="button" aria-current={step===id?"step":undefined} onClick={()=>showStep(id)}>{index+1}. {label}</button></li>)}</ol></nav>
    <h2 ref={mainHeading} tabIndex={-1}>Step {stepIndex+1} of {STEPS.length}: {STEPS[stepIndex][1]}</h2>

    {step==="attach"&&<>
      {addingMore&&<div className={styles.notice}><p>Add the new material below. The same case and your typed notes are kept. Then run the analysis again.</p><button type="button" className={styles.secondary} disabled={Boolean(busy)} onClick={()=>showStep("run")}>Go to step 4 and run again</button></div>}
      <section className={styles.panel}><div className={styles.sourceHeader}><h3>The document to analyze</h3><span className={styles.muted}>{request.sources.length} / {TOOLKIT_LIMITS.sources} sources</span></div>
        <fieldset disabled={locked||Boolean(busy)} className={styles.fields}><label className={styles.field}><span>Analysis title</span><input value={request.title} maxLength={200} onChange={event=>update("title",event.target.value)} placeholder="For example, improving access to a service notice" /></label></fieldset>
        <p>Attach the document, or paste its text, along with any data, engagement notes or earlier analyses you have. You can check and correct the extracted text before running the analysis.</p>
        <div className={styles.actions}><input ref={fileInput} type="file" multiple accept=".pdf,.docx,.pptx,.txt,.csv,.tsv,.xlsx" className={styles.hidden} tabIndex={-1} aria-hidden="true" onChange={event=>void upload(event.target.files)} /><button type="button" className={`${styles.secondary} ${styles.attach}`} disabled={locked||Boolean(busy)||request.sources.length>=TOOLKIT_LIMITS.sources} onClick={()=>fileInput.current?.click()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m8 12 7-7a4 4 0 0 1 6 6L10 22a6 6 0 0 1-8-8L13 3a2 2 0 0 1 3 3L5 17" /></svg>Attach documents</button><button type="button" className={styles.textButton} disabled={locked||Boolean(busy)||request.sources.length>=TOOLKIT_LIMITS.sources} onClick={()=>update("sources",[...request.sources,{id:`paste-${crypto.randomUUID()}`,title:"",text:"",origin:"user"}])}>Paste a document</button></div>
        <p className={styles.muted}>PDF with selectable text, Word, PowerPoint, Excel, comma-separated, tab-separated or plain text, up to 20 megabytes each. Scanned pages and image-only content need text added separately. Original files are read into text; the case stores the extracted text.</p>
        <details className={styles.disclosure}><summary>Use long-term services and supports data to inform the analysis</summary><p>Explore the official dashboards, then attach the relevant spreadsheet or paste selected figures. Include the reporting period, program, population, geography, and denominator. Opening a dashboard does not load its data into this analysis.</p>{LTSS_RESOURCES.map(resource=><p key={resource.id}><SourceLink href={resource.url} target="_blank" rel="noopener noreferrer">{spelledOut(resource.title)}</SourceLink><br/><span className={styles.muted}>{resource.description}</span></p>)}<p className={styles.muted}>Keep suppressed or missing values as reported. Combine the figures with the experiences and perspectives of affected people.</p></details>
        {request.sources.map((source,index)=><div className={styles.source} key={source.id}><div className={styles.sourceHeader}><h3>{source.title||`Source ${index+1}`}</h3>{!locked&&<button type="button" className={styles.textButton} disabled={Boolean(busy)} onClick={()=>update("sources",request.sources.filter((_,i)=>i!==index))}>Remove<span className={styles.hidden}> source {index+1}</span></button>}</div>{sourceNotes(source).map(note=><p className={styles.muted} key={note}>{note}</p>)}<fieldset disabled={locked||Boolean(busy)} className={styles.fields}><label className={styles.field}><span>Source title</span><input value={source.title} maxLength={500} onChange={event=>sourceChange(index,"title",event.target.value)} /></label><Field label="Source text" value={source.text} maxLength={TOOLKIT_LIMITS.sourceCharacters} rows={6} onChange={value=>sourceChange(index,"text",value)} /><label className={styles.field}><span>Source web address, if available</span><input type="url" value={source.url||""} onChange={event=>sourceChange(index,"url",event.target.value)} placeholder="https://" /></label></fieldset></div>)}
      </section>
      {continueTo("setup","Continue to check the setup")}
    </>}

    {step==="setup"&&<>
      {suggestion?<SuggestedSetupPanel suggestion={suggestion} request={request} disabled={locked||Boolean(busy)} onUse={applySetup} />:<p className={styles.notice}>Attach or paste a document in step 1 to get a suggested setup. You can also fill in the setup yourself.</p>}
      <section className={styles.panel}><h3>Your setup</h3><fieldset disabled={locked||Boolean(busy)} className={styles.fields}>
        <Field label="Decision or question" value={request.question} onChange={value=>update("question",value)} maxLength={2000} hint="Describe the proposed change, who it could affect, and the decision this analysis should inform." />
        <div className={styles.twoColumns}><label className={styles.field}><span>Scope of the work</span><select value={request.scope} onChange={event=>update("scope",event.target.value as ToolkitRequest["scope"])}>{(Object.keys(SCOPE_LABELS) as (keyof typeof SCOPE_LABELS)[]).map(scope=><option key={scope} value={scope}>{SCOPE_LABELS[scope]}</option>)}</select></label><label className={styles.field}><span>Programs and service lines</span><input value={programText} maxLength={2000} onChange={event=>{setProgramText(event.target.value);changed();}} onBlur={()=>{const programs=programText.split(",").map(value=>value.trim()).filter(Boolean);if(JSON.stringify(programs)!==JSON.stringify(request.programs))update("programs",programs);}} placeholder="For example, Community First Services and Supports, MnCHOICES, housing" /><small>Separate names with commas. Relevant published resources from this application will be considered.</small></label></div>
        <Field label="Background and constraints" value={request.context} onChange={value=>update("context",value)} maxLength={12000} hint="Include timing, resources, earlier decisions, and what you still need to learn." />
      </fieldset>
      <details className={styles.disclosure}><summary>Connect Aging and Disability Services Administration implementation goals</summary><p className={styles.muted}>Select goals that apply to this work. Leave these unselected for work outside the Aging and Disability Services Administration.</p><fieldset disabled={locked||Boolean(busy)} className={styles.fields}>{ADSA_GOALS.map(goal=><label className={styles.choice} key={goal.id}><input type="checkbox" checked={request.goals.includes(goal.id)} onChange={event=>update("goals",event.target.checked?[...request.goals,goal.id]:request.goals.filter(id=>id!==goal.id))} /><span>{goal.title}</span></label>)}</fieldset></details>
      </section>
      <section className={styles.panel}><h3>Depth of the analysis</h3><p className={styles.muted}>Use a scan to identify concerns and next steps. Use the full analysis to work through evidence, participation, alternatives, and implementation in depth.</p><fieldset disabled={locked||Boolean(busy)} className={styles.fields}><legend className={styles.hidden}>Depth of the analysis</legend><div className={styles.twoColumns}><label className={`${styles.choice} ${styles.track}`}><input type="radio" name="toolkit-track" value="scan" checked={request.track==="scan"} onChange={()=>update("track","scan")} /><span><strong>{TRACK_LABELS.scan}</strong>A concise, adapted six-question review.</span></label><label className={`${styles.choice} ${styles.track}`}><input type="radio" name="toolkit-track" value="full" checked={request.track==="full"} onChange={()=>update("track","full")} /><span><strong>{TRACK_LABELS.full}</strong>Work through all six Department of Human Services toolkit stages.</span></label></div>
        <details className={styles.disclosure}><summary>The four routing answers</summary><div className={styles.fields}>{ROUTING_LABELS.map(([key,label])=><label className={styles.choice} key={key}><input type="checkbox" checked={request.routing[key]} onChange={event=>update("routing",{...request.routing,[key]:event.target.checked})} /><span>{label}</span></label>)}</div><div className={styles.notice}><strong>Suggested depth: {routeRecommendation.track==="full"?"full analysis":"equity scan"}</strong>{routeRecommendation.reasons.map(reason=><p key={reason}>{fullNames(reason)}</p>)}<p className={styles.muted}>This is a suggestion for your judgment, not an agency routing decision.</p></div></details>
      </fieldset><details className={styles.disclosure}><summary>About this toolkit</summary><p>{fullNames(instrument.authorityNote)}</p><p className={styles.muted}>Your review marks an analysis final; it does not confer agency approval.</p></details></section>
      {continueTo("needs","Continue to see what is still needed")}
    </>}

    {step==="needs"&&<>
      <InformationNeededPanel items={needsBefore} mode="before" prompts={prompts}><div className={styles.actions}><button type="button" className={styles.secondary} onClick={attachMore}>Attach more material</button></div></InformationNeededPanel>
      <details className={styles.panel}><summary>Notes you already have for the toolkit questions</summary><p className={styles.muted}>Optional. Existing findings, engagement notes, and open questions help the analysis reflect work already done. They are kept when you run the analysis again.</p><fieldset disabled={locked||Boolean(busy)} className={styles.fields}>{getQuestions(request.track).map(question=><Field key={question.id} label={question.prompt} hint={question.help} value={request.answers[question.id]||""} onChange={value=>update("answers",{...request.answers,[question.id]:value})} />)}</fieldset></details>
      {continueTo("run","Continue to run the analysis")}
    </>}

    {step==="run"&&<>
      <section className={styles.panel}><h3>{result?"The analysis":"Run the analysis"}</h3><p>{availability?.privateProcessingNote||"Your selected material is sent to the configured analysis service only when you run the analysis. It is not published to staff or leadership."}</p>{unavailable&&<p className={styles.notice}>{availability.analysisUnavailableReason||"The analysis service is not available yet. You can prepare and save your material."}</p>}<div className={styles.actions}><button type="button" className={styles.primary} disabled={locked||Boolean(busy)||!availability?.analysisAvailable} onClick={()=>void analyze()}>{result||lastRunGaps?"Run the analysis again":`Run the ${request.track==="scan"?"scan":"full analysis"}`}</button></div></section>
      <ClosedSinceLastRun closed={closed} />
      {result?<><AnalysisView request={request} result={result} locked={locked} busy={Boolean(busy)} contextNote={contextNote} editResult={editResult} editAnswer={editAnswer} />{continueTo("gaps","Continue to close the gaps")}</>:<p className={styles.muted}>The analysis will appear here, with supporting quotations and what remains unknown.</p>}
    </>}

    {step==="gaps"&&<>
      <ClosedSinceLastRun closed={closed} />
      {result?<InformationNeededPanel items={needsAfter} mode="after" prompts={prompts}><div className={styles.actions}><button type="button" className={styles.primary} disabled={locked||Boolean(busy)} onClick={attachMore}>Attach more material and run again</button><button type="button" className={styles.secondary} onClick={()=>showStep("outputs")}>Download a request for this information</button></div></InformationNeededPanel>
        :<section className={styles.panel}><p>{lastRunGaps?"The material changed since the last run. Run the analysis again to see what is still needed.":"Run the analysis first. Its gaps, limits and open questions will be listed here."}</p><div className={styles.actions}><button type="button" className={styles.primary} onClick={()=>showStep("run")}>Go to step 4</button></div></section>}
      {continueTo("outputs","Continue to download the outputs")}
    </>}

    {step==="outputs"&&<>
      <section className={styles.panel}><h3>{locked?"Your final copy is saved":"Review before marking final"}</h3>{!result?<p>Run the analysis before completing your review.</p>:locked?<p>The downloads below reflect this final version. Reopen it as a draft if a source, finding, or recommendation changes.</p>:<><p>Check the evidence and the proposed actions. Missing engagement or data should stay visible as a gap, with a plan to address it.</p><fieldset disabled={Boolean(busy)||dirty||saved?.status!=="review"} className={styles.reviewList}><legend className={styles.hidden}>Review statements</legend><label className={styles.choice}><input type="checkbox" checked={review.evidence} onChange={event=>setReview({...review,evidence:event.target.checked})} /><span>I reviewed the source quotations, conclusions, and limitations.</span></label><label className={styles.choice}><input type="checkbox" checked={review.perspectives} onChange={event=>setReview({...review,perspectives:event.target.checked})} /><span>I checked whose perspectives are represented and recorded where input is still needed.</span></label><label className={styles.choice}><input type="checkbox" checked={review.actions} onChange={event=>setReview({...review,actions:event.target.checked})} /><span>I reviewed the alternatives, responsibilities, measures, and follow-up.</span></label></fieldset><div className={styles.actions}>{(dirty||saved?.status!=="review")&&<button type="button" className={styles.primary} disabled={Boolean(busy)||availability?.caseSavingAvailable===false} onClick={()=>void save("review")}>Save for review</button>}<button type="button" className={styles.primary} disabled={Boolean(busy)||dirty||saved?.status!=="review"||!allReviewed} onClick={()=>void save("final",true)}>Approve final copy</button></div><p className={styles.muted}>This records your review. It does not replace an agency decision or required approval.</p></>}</section>
      <OutputsPanel trackLabel={TRACK_LABELS[request.track]} canDownload={Boolean(saved)} dirty={dirty} busy={Boolean(busy)} hasResult={Boolean(result)} onDownload={(kind,format)=>void download(kind,format)} onPolicyChanges={()=>void policyChanges()} />
      {saved&&<details className={styles.disclosure}><summary>Manage this saved case</summary>{!removeConfirm?<button type="button" className={styles.textButton} disabled={Boolean(busy)} onClick={()=>setRemoveConfirm(true)}>Remove saved case</button>:<div className={styles.notice}><p>Remove “{saved.title}” from the private case library? Downloaded copies will remain wherever you saved them.</p><div className={styles.actions}><button type="button" className={styles.secondary} disabled={Boolean(busy)} onClick={()=>void deleteCase()}>Remove this case</button><button type="button" className={styles.textButton} onClick={()=>setRemoveConfirm(false)}>Keep it</button></div></div>}</details>}
    </>}
  </div>;
}
