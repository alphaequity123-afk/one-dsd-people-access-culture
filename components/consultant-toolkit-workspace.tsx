"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ADSA_GOALS } from "@/lib/consultant-analysis/schema";
import { getInstrument, getQuestions, recommendTrack } from "@/lib/consultant-toolkit/instrument";
import { casePayloadSchema, toolkitCaseSchema, toolkitRequestSchema, toolkitResponseSchema, TOOLKIT_LIMITS, type ToolkitCase, type ToolkitRequest, type ToolkitResponse } from "@/lib/consultant-toolkit/schema";
import { LTSS_RESOURCES } from "@/lib/consultant-toolkit/ltss";
import styles from "./consultant-toolkit-workspace.module.css";

type Availability = { analysisAvailable: boolean; analysisUnavailableReason: string | null; caseSavingAvailable: boolean; caseSavingUnavailableReason: string | null; privateProcessingNote: string };
type CaseSummary = Pick<ToolkitCase,"id"|"version"|"status"|"title"|"createdAt"|"updatedAt">;
type Source = ToolkitRequest["sources"][number];
type Step = "prepare"|"analysis"|"finish";
const emptyRequest = (): ToolkitRequest => ({ title: "", question: "", context: "", track: "full", scope: "division", programs: [], goals: [], sources: [], routing: { priorAnalysisIntegrated: false, materialChange: false, knownDisparities: false, timeLimited: false }, answers: {} });
const readReview = { evidence: false, perspectives: false, actions: false };
const safeHref = (value?: string) => { try { const url = new URL(value || ""); return ["http:","https:"].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; } };
const shownDate = (value: string) => new Date(value).toLocaleDateString(undefined,{ year:"numeric",month:"short",day:"numeric" });
const plainError = (cause: unknown, fallback: string) => cause instanceof Error ? cause.message : fallback;
const sourceNotes = (source:Source) => source.origin==="application-context" ? ["Related application reference",...source.text.split("\n").filter(line=>/^(Authority:|Resource location:|Source review date:|Official source entry point|No dashboard dataset)/.test(line))] : ["Supplied document or pasted evidence"];

function Field({ label, value, onChange, hint, rows=3, maxLength=6000, disabled=false }: { label:string; value:string; onChange:(value:string)=>void; hint?:string; rows?:number; maxLength?:number; disabled?:boolean }) {
  const id=useId();
  return <div className={styles.field}><label htmlFor={id}>{label}</label>{hint && <small id={`${id}-help`}>{hint}</small>}<textarea id={id} aria-describedby={hint?`${id}-help`:undefined} value={value} onChange={event=>onChange(event.target.value)} rows={rows} maxLength={maxLength} disabled={disabled} /></div>;
}

export function ConsultantToolkitWorkspace() {
  const [request,setRequest] = useState<ToolkitRequest>(emptyRequest);
  const [programText,setProgramText] = useState("");
  const [result,setResult] = useState<ToolkitResponse|null>(null);
  const [saved,setSaved] = useState<ToolkitCase|null>(null);
  const [cases,setCases] = useState<CaseSummary[]>([]);
  const [nextOffset,setNextOffset] = useState<number|null>(null);
  const [availability,setAvailability] = useState<Availability|null>(null);
  const [step,setStep] = useState<Step>("prepare");
  const [dirty,setDirty] = useState(false);
  const [busy,setBusy] = useState("");
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");
  const [contextNote,setContextNote] = useState("");
  const [review,setReview] = useState(readReview);
  const [library,setLibrary] = useState(false);
  const [pendingOpen,setPendingOpen] = useState<string|null>(null);
  const [removeConfirm,setRemoveConfirm] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const mainHeading = useRef<HTMLHeadingElement>(null);
  const locked = saved?.status === "final";
  const unavailable = availability?.analysisAvailable === false;
  const instrument = getInstrument(request.track);
  const allReviewed = Object.values(review).every(Boolean);

  useEffect(()=>{
    const controller = new AbortController();
    void Promise.all([
      fetch("/api/consultant/toolkit",{ signal:controller.signal,cache:"no-store" }).then(async response=>{ const body=await response.json(); if(!response.ok) throw new Error(body.error||"The workspace could not connect."); setAvailability(body); }),
      fetch("/api/consultant/toolkit/cases",{ signal:controller.signal,cache:"no-store" }).then(async response=>{ const body=await response.json(); if(response.ok && Array.isArray(body.cases)){setCases(body.cases);setNextOffset(body.nextOffset??null);} }),
    ]).catch(cause=>{ if(!controller.signal.aborted)setError(plainError(cause,"The workspace could not connect. You can still prepare your material.")); });
    return ()=>controller.abort();
  },[]);
  useEffect(()=>{
    if(!dirty)return;
    const warn=(event:BeforeUnloadEvent)=>{ event.preventDefault(); event.returnValue=""; };
    window.addEventListener("beforeunload",warn); return ()=>window.removeEventListener("beforeunload",warn);
  },[dirty]);

  function changed() { setDirty(true); setReview(readReview); setError(""); setMessage(""); }
  function update<K extends keyof ToolkitRequest>(key:K,value:ToolkitRequest[K]) {
    if(locked)return;
    changed(); setRequest(previous=>({...previous,[key]:value,...(key==="track"?{answers:{}}:{})}));
    if(result){ setResult(null); setContextNote(""); setMessage("Preparation changed. Prepare a new draft so the analysis matches this material."); }
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
    try{ const body=await jsonRequest(`/api/consultant/toolkit/cases/${encodeURIComponent(id)}`,"GET");const value=toolkitCaseSchema.parse(body.case);applyCase(value);setStep(value.result?"analysis":"prepare");setLibrary(false);setMessage("Saved analysis opened."); }
    catch(cause){setError(plainError(cause,"That analysis could not be opened."));}
    finally{setBusy("");}
  }
  function newCase(force=false) {
    if(dirty&&!force){setPendingOpen("new");return;}
    setRequest(emptyRequest());setProgramText("");setResult(null);setSaved(null);setDirty(false);setReview(readReview);setMessage("");setError("");setContextNote("");setStep("prepare");setPendingOpen(null);setRemoveConfirm(false);
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
        if(!/\.(pdf|docx|pptx|txt|csv|tsv|xlsx)$/i.test(file.name)||file.size>20*1024*1024)throw new Error("Choose a PDF, Word, PowerPoint, Excel, CSV, TSV, or text file no larger than 20 MB.");
        if(request.sources.length+added.length>=TOOLKIT_LIMITS.sources)throw new Error(`Use up to ${TOOLKIT_LIMITS.sources} documents or pasted sources at a time.`);
        const form=new FormData();form.append("file",file);
        const response=await fetch("/api/consultant/toolkit/upload",{method:"POST",body:form});
        const body=await response.json();if(!response.ok)throw new Error(body.error||`${file.name} could not be read.`);
        const source=body.source as Source;
        if(!source||typeof source.text!=="string"||typeof source.title!=="string")throw new Error("The document text could not be read.");
        added.push({...source,id:`upload-${crypto.randomUUID()}`});
        if(body.note)setMessage(body.note);
      }
    }catch(cause){uploadError=plainError(cause,"A document could not be read.");}
    finally{
      if(added.length){update("sources",[...request.sources,...added]);setMessage(`${added.length} ${added.length===1?"document added":"documents added"}. Review the extracted text; images, charts, and scanned pages may need a separate written description.`);}
      if(uploadError)setError(uploadError);
      setBusy("");if(fileInput.current)fileInput.current.value="";
    }
  }
  async function analyze() {
    setError("");setMessage("");
    const parsed=toolkitRequestSchema.safeParse(request);
    if(!parsed.success){setError(parsed.error.issues[0]?.message||"Complete the decision and evidence fields before preparing a draft.");return;}
    setBusy("Preparing your evidence-based draft…");
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),240000);
    try{
      const response=await fetch("/api/consultant/toolkit/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({request:parsed.data}),signal:controller.signal});
      const body=await response.json();if(!response.ok)throw new Error(body.error||"The analysis could not be prepared.");
      const analysis=toolkitResponseSchema.parse(body.analysis);
      const nextRequest=toolkitRequestSchema.parse({...parsed.data,sources:body.sources??parsed.data.sources});
      setResult(analysis);setRequest(nextRequest);setDirty(true);setReview(readReview);setContextNote(typeof body.contextNote==="string"?body.contextNote:"");setStep("analysis");setMessage("Draft ready. Review each answer and its evidence before finalizing.");
      setTimeout(()=>mainHeading.current?.focus(),0);
    }catch(cause){setError(controller.signal.aborted?"The analysis took longer than expected. Your material is still here; no automatic retry was made.":plainError(cause,"The analysis could not be prepared. Your material is still here."));}
    finally{clearTimeout(timeout);setBusy("");}
  }
  async function download(kind:"report"|"worksheet"|"action-plan",format:"word"|"pdf"|"json") {
    if(!saved||dirty){setError("Save your current changes before downloading so the file matches this analysis.");return;}
    setBusy("Preparing your download…");setError("");
    try{
      const response=await fetch("/api/consultant/toolkit/export",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({caseId:saved.id,format,kind,expectedVersion:saved.version})});
      if(!response.ok){const body=await response.json();throw new Error(body.error||"The download could not be prepared.");}
      const blob=await response.blob();const url=URL.createObjectURL(blob);const anchor=document.createElement("a");anchor.href=url;anchor.download=`equity-${kind}.${format==="word"?"docx":format}`;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);setMessage("Your download is ready. It contains the saved analysis and its review status.");
    }catch(cause){setError(plainError(cause,"The download could not be prepared."));}finally{setBusy("");}
  }
  function sourceChange(index:number,key:"title"|"text"|"url",value:string) {update("sources",request.sources.map((source,i)=>{if(i!==index)return source;const next={...source,[key]:value,origin:"user" as const};if(key==="url"&&!value)delete next.url;return next;}));}
  function showStep(next:Step){setStep(next);setTimeout(()=>mainHeading.current?.focus(),0);}
  const routeRecommendation=recommendTrack(request.routing);

  return <div className={styles.workspace} aria-busy={Boolean(busy)}>
    <div className={styles.toolbar}>
      <div><span className={styles.badge}>{locked?"Final":saved?.status==="review"&&!dirty?"Ready for review":"Draft"}</span><p className={styles.muted}>{saved?`${dirty?"Unsaved changes · ":""}Saved ${shownDate(saved.updatedAt)}`:"Your case stays private to the consultant workspace."}</p></div>
      <div className={styles.actions}><button className={styles.secondary} disabled={Boolean(busy)} onClick={()=>setLibrary(!library)} aria-expanded={library}>Saved analyses</button><button className={styles.secondary} disabled={Boolean(busy)} onClick={()=>newCase()}>New analysis</button>{!locked&&<button className={styles.primary} disabled={Boolean(busy)||availability?.caseSavingAvailable===false} onClick={()=>void save()}>Save draft</button>}</div>
    </div>
    {library&&<section className={styles.panel} aria-label="Saved analyses"><h2>Your saved analyses</h2>{cases.length?<ul className={styles.library}>{cases.map(item=><li key={item.id}><div><strong>{item.title}</strong><span className={styles.muted}>{item.status==="final"?"Final":item.status==="review"?"For review":"Draft"} · {shownDate(item.updatedAt)}</span></div><button className={styles.secondary} aria-label={`Open ${item.title}`} disabled={Boolean(busy)} onClick={()=>void openCase(item.id)}>Open</button></li>)}</ul>:<p>No saved analyses yet. Give your work a title and save a draft to return to it later.</p>}{nextOffset!==null&&<button className={styles.textButton} disabled={Boolean(busy)} onClick={()=>void moreCases()}>Show more saved analyses</button>}</section>}
    {pendingOpen&&<div className={styles.notice}><p>You have unsaved changes. Save them before opening another analysis, or discard them.</p><div className={styles.actions}><button className={styles.primary} disabled={Boolean(busy)} onClick={async()=>{const next=pendingOpen;if(await save()){if(next==="new")newCase(true);else await loadCase(next);}}}>Save and continue</button><button className={styles.secondary} disabled={Boolean(busy)} onClick={()=>pendingOpen==="new"?newCase(true):void loadCase(pendingOpen)}>Discard changes and continue</button><button className={styles.textButton} onClick={()=>setPendingOpen(null)}>Keep working</button></div></div>}
    {error&&<p className={styles.error} role="alert">{error}</p>}
    <div aria-live="polite" aria-atomic="true">{busy?<p className={styles.message}>{busy}</p>:message?<p className={styles.message}>{message}</p>:null}</div>
    {availability?.caseSavingAvailable===false&&<p className={styles.notice}>{availability.caseSavingUnavailableReason||"Private case saving is not available yet. Keep this page open while you prepare your work."}</p>}
    {locked&&<div className={styles.notice}><p>This is the final saved copy. Reopen it as a draft to make changes and review it again.</p><button className={styles.secondary} disabled={Boolean(busy)} onClick={()=>void reopen()}>Reopen as draft</button></div>}
    <nav className={styles.steps} aria-label="Analysis steps"><button aria-current={step==="prepare"?"step":undefined} onClick={()=>showStep("prepare")}>1. Prepare</button><button aria-current={step==="analysis"?"step":undefined} onClick={()=>showStep("analysis")}>2. Examine</button><button aria-current={step==="finish"?"step":undefined} onClick={()=>showStep("finish")}>3. Review and download</button></nav>
    <h2 ref={mainHeading} tabIndex={-1}>{step==="prepare"?"Start with the decision":step==="analysis"?"Examine the analysis":"Complete your review"}</h2>
    {step==="prepare"&&<>
      <section className={styles.panel}><h3>What needs to be decided?</h3><fieldset disabled={locked||Boolean(busy)} className={styles.fields}>
        <label className={styles.field}><span>Analysis title</span><input value={request.title} maxLength={200} onChange={event=>update("title",event.target.value)} placeholder="For example, improving access to a service notice" /></label>
        <Field label="Decision or question" value={request.question} onChange={value=>update("question",value)} maxLength={2000} hint="Describe the proposed change, who it could affect, and the decision this analysis should inform." />
        <div className={styles.twoColumns}><label className={styles.field}><span>Scope of the work</span><select value={request.scope} onChange={event=>update("scope",event.target.value as ToolkitRequest["scope"])}><option value="agency">DHS agency</option><option value="administration">Administration</option><option value="division">Division</option><option value="team">Team</option><option value="individual">Individual work</option></select></label><label className={styles.field}><span>Programs and service lines</span><input value={programText} maxLength={2000} onChange={event=>{setProgramText(event.target.value);changed();}} onBlur={()=>{const programs=programText.split(",").map(value=>value.trim()).filter(Boolean);if(JSON.stringify(programs)!==JSON.stringify(request.programs))update("programs",programs);}} placeholder="For example, CFSS, MnCHOICES, housing" /><small>Separate names with commas. Relevant published resources from this application will be considered.</small></label></div>
        <Field label="Background and constraints" value={request.context} onChange={value=>update("context",value)} maxLength={12000} hint="Include timing, resources, earlier decisions, and what you still need to learn." />
      </fieldset>
      <details className={styles.disclosure}><summary>Connect ADSA implementation goals</summary><p className={styles.muted}>Select goals that apply to this work. Leave these unselected for work outside ADSA.</p><fieldset disabled={locked||Boolean(busy)} className={styles.fields}>{ADSA_GOALS.map(goal=><label className={styles.choice} key={goal.id}><input type="checkbox" checked={request.goals.includes(goal.id)} onChange={event=>update("goals",event.target.checked?[...request.goals,goal.id]:request.goals.filter(id=>id!==goal.id))} /><span>{goal.title}</span></label>)}</fieldset></details>
      </section>
      <section className={styles.panel}><h3>Choose the depth of the analysis</h3><p className={styles.muted}>Use a scan to identify concerns and next steps. Use the full analysis to work through evidence, participation, alternatives, and implementation in depth.</p><fieldset disabled={locked||Boolean(busy)} className={styles.fields}><div className={styles.twoColumns}><label className={`${styles.choice} ${styles.track}`}><input type="radio" name="toolkit-track" value="scan" checked={request.track==="scan"} onChange={()=>update("track","scan")} /><span><strong>Equity scan</strong>A concise, adapted six-question review.</span></label><label className={`${styles.choice} ${styles.track}`}><input type="radio" name="toolkit-track" value="full" checked={request.track==="full"} onChange={()=>update("track","full")} /><span><strong>Full equity analysis</strong>Work through all six DHS toolkit stages.</span></label></div>
        <details className={styles.disclosure}><summary>Help choosing a scan or full analysis</summary><div className={styles.fields}>{([
          ["priorAnalysisIntegrated","A relevant full analysis already informs this proposal."],
          ["materialChange","The proposal makes a substantial new change."],
          ["knownDisparities","There are known disparities or unresolved equity concerns."],
          ["timeLimited","There is limited time before the decision."],
        ] as const).map(([key,label])=><label className={styles.choice} key={key}><input type="checkbox" checked={request.routing[key]} onChange={event=>update("routing",{...request.routing,[key]:event.target.checked})} /><span>{label}</span></label>)}</div><div className={styles.notice}><strong>Suggested approach: {routeRecommendation.track==="full"?"full analysis":"equity scan"}</strong>{routeRecommendation.reasons.map(reason=><p key={reason}>{reason}</p>)}<p className={styles.muted}>This is a recommendation for your judgment, not an agency routing decision.</p></div></details>
      </fieldset><details className={styles.disclosure}><summary>About this toolkit</summary><p>{instrument.authorityNote}</p><p className={styles.muted}>Consultant review marks your analysis final; it does not confer agency approval.</p></details></section>
      <section className={styles.panel}><div className={styles.sourceHeader}><h3>Bring in the evidence</h3><span className={styles.muted}>{request.sources.length} / {TOOLKIT_LIMITS.sources} sources</span></div><p>Add documents or paste the relevant material. You can inspect and correct the extracted text before preparing a draft.</p><div className={styles.actions}><input ref={fileInput} type="file" multiple accept=".pdf,.docx,.pptx,.txt,.csv,.tsv,.xlsx" className={styles.hidden} tabIndex={-1} onChange={event=>void upload(event.target.files)} /><button className={`${styles.secondary} ${styles.attach}`} disabled={locked||Boolean(busy)||request.sources.length>=TOOLKIT_LIMITS.sources} onClick={()=>fileInput.current?.click()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m8 12 7-7a4 4 0 0 1 6 6L10 22a6 6 0 0 1-8-8L13 3a2 2 0 0 1 3 3L5 17" /></svg>Attach documents</button><button className={styles.textButton} disabled={locked||Boolean(busy)||request.sources.length>=TOOLKIT_LIMITS.sources} onClick={()=>update("sources",[...request.sources,{id:`paste-${crypto.randomUUID()}`,title:"",text:""}])}>Paste a document</button></div><p className={styles.muted}>PDF with selectable text, Word, PowerPoint, Excel, CSV, TSV, or text · up to 20 MB each. Scanned pages and image-only content need text added separately. Original files are read into text; the case stores the extracted text.</p>
        <details className={styles.disclosure}><summary>Use LTSS data to inform the analysis</summary><p>Explore the official dashboards, then attach the relevant spreadsheet or paste selected figures. Include the reporting period, program, population, geography, and denominator. Opening a dashboard does not load its data into this analysis.</p>{LTSS_RESOURCES.map(resource=><p key={resource.id}><a href={resource.url} target="_blank" rel="noopener noreferrer">{resource.title}</a><br/><span className={styles.muted}>{resource.description}</span></p>)}<p className={styles.muted}>Keep suppressed or missing values as reported. Combine the figures with the experiences and perspectives of affected people.</p></details>
        {request.sources.map((source,index)=><div className={styles.source} key={source.id}><div className={styles.sourceHeader}><h3>{source.title||`Source ${index+1}`}</h3>{!locked&&<button className={styles.textButton} disabled={Boolean(busy)} onClick={()=>update("sources",request.sources.filter((_,i)=>i!==index))}>Remove<span className={styles.hidden}> source {index+1}</span></button>}</div>{sourceNotes(source).map(note=><p className={styles.muted} key={note}>{note}</p>)}<fieldset disabled={locked||Boolean(busy)} className={styles.fields}><label className={styles.field}><span>Source title</span><input value={source.title} maxLength={500} onChange={event=>sourceChange(index,"title",event.target.value)} /></label><Field label="Source text" value={source.text} maxLength={TOOLKIT_LIMITS.sourceCharacters} rows={6} onChange={value=>sourceChange(index,"text",value)} /><label className={styles.field}><span>Source web address, if available</span><input type="url" value={source.url||""} onChange={event=>sourceChange(index,"url",event.target.value)} placeholder="https://" /></label></fieldset></div>)}
      </section>
      <details className={styles.panel}><summary>Notes you already have for the toolkit questions</summary><p className={styles.muted}>Optional. Existing findings, engagement notes, and open questions help the draft reflect work already completed.</p><fieldset disabled={locked||Boolean(busy)} className={styles.fields}>{getQuestions(request.track).map(question=><Field key={question.id} label={question.prompt} hint={question.help} value={request.answers[question.id]||""} onChange={value=>update("answers",{...request.answers,[question.id]:value})} />)}</fieldset></details>
      <div className={styles.panel}><h3>Prepare your draft</h3><p>{availability?.privateProcessingNote||"Your selected material is sent to the configured analysis service only when you choose Prepare draft. It is not published to staff or leadership."}</p>{unavailable&&<p className={styles.notice}>{availability.analysisUnavailableReason||"The analysis service is not available yet. You can prepare and save your material."}</p>}<button className={styles.primary} disabled={locked||Boolean(busy)||!availability?.analysisAvailable} onClick={()=>void analyze()}>Prepare {request.track==="scan"?"scan":"full analysis"} draft</button></div>
    </>}
    {step==="analysis"&&(!result?<section className={styles.panel}><h3>Your analysis will appear here</h3><p>Begin with your question and evidence, then prepare a draft. The analysis will show supporting quotations and identify what remains unknown.</p><button className={styles.primary} onClick={()=>showStep("prepare")}>Prepare the analysis</button></section>:<>
      <section className={`${styles.panel} ${styles.brief}`} aria-labelledby="decision-brief-heading">
        <h2 id="decision-brief-heading">Decision brief</h2>
        <p className={styles.caseTitle}>{request.title}</p>
        <h3>The decision being considered</h3><p className={styles.plain}>{request.question}</p>
        <details className={styles.disclosure}><summary>See what supports this draft</summary><p>These labels describe how the draft uses its sources. They are not a confidence score or a substitute for reviewing the quotations.</p><dl className={styles.briefColumns}>{([['evidence','Responses citing evidence'],['inference','Responses needing interpretation review'],['gap','Responses needing evidence']] as const).map(([kind,label])=><div key={kind}><dt>{label}</dt><dd>{result.answers.filter(answer=>answer.kind===kind).length}</dd></div>)}</dl><p>Start with the evidence gaps and limitations below. Then examine the source quotations and the alternatives before finalizing.</p></details>
        <h3>What the analysis says</h3><p className={styles.plain}>{result.summary}</p>
        <p className={styles.muted}>Read these findings alongside the evidence gaps below. The complete responses, source quotations, alternatives, and actions remain available for your review.</p>
        {!locked&&<details className={styles.disclosure}><summary>Edit the summary</summary><Field label="Summary" value={result.summary} onChange={value=>editResult({...result,summary:value})} rows={5} disabled={Boolean(busy)} /></details>}
        {contextNote&&<p className={styles.muted}>{contextNote}</p>}
      </section>
      <section className={styles.panel} aria-labelledby="analysis-attention-heading"><h2 id="analysis-attention-heading">What needs attention before a decision</h2>
        <div className={styles.briefColumns}>
          <div><h3>Limits of the evidence</h3>{result.limitations.length?<ul className={styles.briefList}>{result.limitations.map((value,index)=><li className={styles.plain} key={index}>{value}</li>)}</ul>:<p>No limitations have been recorded. Check the evidence before relying on this analysis.</p>}</div>
          <div><h3>Questions for your review</h3>{result.questionsForReview.length?<ul className={styles.briefList}>{result.questionsForReview.map((value,index)=><li className={styles.plain} key={index}>{value}</li>)}</ul>:<p>No review questions have been recorded. Consider whose perspectives or evidence may still be missing.</p>}</div>
        </div>
        {!locked&&<details className={styles.disclosure}><summary>Edit limitations and review questions</summary><fieldset disabled={locked||Boolean(busy)} className={styles.fields}>{result.limitations.map((value,index)=><Field key={`lim-${index}`} label={`Limitation ${index+1}`} value={value} rows={2} onChange={next=>editResult({...result,limitations:result.limitations.map((item,i)=>i===index?next:item)})} />)}{result.questionsForReview.map((value,index)=><Field key={`review-${index}`} label={`Review question ${index+1}`} value={value} rows={2} onChange={next=>editResult({...result,questionsForReview:result.questionsForReview.map((item,i)=>i===index?next:item)})} />)}</fieldset></details>}
      </section>
      <details className={`${styles.panel} ${styles.analysisDisclosure}`}><summary>Read the complete analysis — {getQuestions(request.track).length} responses and evidence</summary>
        <p className={styles.muted}>Every response is retained in full. Source quotations support examination of the findings; they do not replace your judgment about their accuracy or relevance.</p>
        <nav className={styles.stageNav} aria-label="Toolkit stages"><a href="#toolkit-preparation">Preparation</a>{instrument.stages.map((stage,index)=><a key={stage.id} href={`#toolkit-${stage.id}`}>{index+1}. {stage.title}</a>)}</nav><details className={styles.disclosure}><summary>Sources considered</summary><p className={styles.muted}>Application references provide context. Their source status and review date still need to fit this decision.</p>{request.sources.map(source=><div className={styles.source} key={source.id}><strong>{source.title}</strong>{sourceNotes(source).map(note=><p className={styles.muted} key={note}>{note}</p>)}{safeHref(source.url)&&<a href={safeHref(source.url)!} target="_blank" rel="noopener noreferrer">Open source</a>}</div>)}</details>
      <section id="toolkit-preparation" className={`${styles.panel} ${styles.stage}`}><h2>Prepare the analysis</h2><p>{instrument.preparationIntro}</p>{instrument.preparation.map(question=>{const answer=result.answers.find(item=>item.questionId===question.id);return <div className={styles.question} key={question.id}><Field label={question.prompt} hint={question.help} value={answer?.text||"No answer recorded."} onChange={value=>editAnswer(question.id,value)} disabled={locked||Boolean(busy)||!answer} rows={4}/><p className={styles.muted}>{answer?.kind==="evidence"?"Supported by the cited material":answer?.kind==="inference"?"Interpretation — review against the evidence":"Evidence still needed"}</p>{answer?.citations.map((citation,i)=>{const source=request.sources.find(item=>item.id===citation.sourceId);const href=safeHref(source?.url);return <div className={styles.evidence} key={`${citation.sourceId}-${i}`}><strong>{source?.title||"Source"}</strong><blockquote>{citation.excerpt}</blockquote>{href&&<a href={href} target="_blank" rel="noopener noreferrer">Open source</a>}</div>;})}</div>;})}</section>
      {instrument.stages.map((stage,index)=><section className={`${styles.panel} ${styles.stage}`} id={`toolkit-${stage.id}`} key={stage.id}><h2>{index+1}. {stage.title}</h2><p>{stage.description}</p>{stage.questions.map(question=>{const answer=result.answers.find(item=>item.questionId===question.id);return <div className={styles.question} key={question.id}><Field label={question.prompt} hint={question.help} value={answer?.text||"No answer recorded."} onChange={value=>editAnswer(question.id,value)} disabled={locked||Boolean(busy)||!answer} rows={5} /><p className={styles.muted}>{answer?.kind==="evidence"?"Supported by the cited material":answer?.kind==="inference"?"Interpretation — review against the evidence":"Evidence still needed"}</p>{answer?.citations.map((citation,i)=>{const source=request.sources.find(item=>item.id===citation.sourceId);const href=safeHref(source?.url);return <div className={styles.evidence} key={`${citation.sourceId}-${i}`}><strong>{source?.title||"Source"}</strong><blockquote>{citation.excerpt}</blockquote>{href&&<a href={href} target="_blank" rel="noopener noreferrer">Open source</a>}</div>;})}</div>;})}</section>)}
      </details>
      <details className={`${styles.panel} ${styles.analysisDisclosure}`}><summary>Compare the options</summary><div className={styles.compare}>{result.alternatives.map((option,index)=><fieldset className={styles.option} disabled={locked||Boolean(busy)} key={index}><Field label={`Option ${index+1}`} value={option.title} rows={2} onChange={value=>editResult({...result,alternatives:result.alternatives.map((item,i)=>i===index?{...item,title:value}:item)})} />{([['benefits','Potential benefits'],['burdens','Burdens and unintended effects'],['evidenceNeeded','Evidence still needed']] as const).map(([key,label])=><div className={styles.fields} key={key}><Field label={label} value={option[key]} onChange={value=>editResult({...result,alternatives:result.alternatives.map((item,i)=>i===index?{...item,[key]:value}:item)})} /></div>)}</fieldset>)}</div></details>
      <details className={`${styles.panel} ${styles.analysisDisclosure}`}><summary>Turn findings into action</summary>{result.actions.map((action,index)=><fieldset className={styles.question} key={index} disabled={locked||Boolean(busy)}><Field label={`Action ${index+1}`} value={action.action} onChange={value=>editResult({...result,actions:result.actions.map((item,i)=>i===index?{...item,action:value}:item)})} /><div className={`${styles.twoColumns} ${styles.fields}`}>{([['responsibleRole','Responsible role'],['dueDate','Timing'],['resources','Resources and support'],['measure','How to check progress'],['followUp','Follow-up and reporting back']] as const).map(([key,label])=><Field label={label} key={key} value={action[key]} rows={2} onChange={value=>editResult({...result,actions:result.actions.map((item,i)=>i===index?{...item,[key]:value}:item)})} />)}</div></fieldset>)}</details>

      <button className={styles.primary} onClick={()=>showStep("finish")}>Continue to review</button>
    </>)}
    {step==="finish"&&<>
      <section className={styles.panel}><h3>{locked?"Your final copy is saved":"Review before marking final"}</h3>{!result?<p>Prepare an analysis before completing your review.</p>:locked?<p>The report, worksheet, and action plan below reflect this final version. Reopen it as a draft if a source, finding, or recommendation changes.</p>:<><p>Check the evidence and your proposed actions. Missing engagement or data should stay visible as a gap, with a plan to address it.</p><fieldset disabled={Boolean(busy)||dirty||saved?.status!=="review"} className={styles.reviewList}><label className={styles.choice}><input type="checkbox" checked={review.evidence} onChange={event=>setReview({...review,evidence:event.target.checked})} /><span>I reviewed the source quotations, conclusions, and limitations.</span></label><label className={styles.choice}><input type="checkbox" checked={review.perspectives} onChange={event=>setReview({...review,perspectives:event.target.checked})} /><span>I checked whose perspectives are represented and recorded where input is still needed.</span></label><label className={styles.choice}><input type="checkbox" checked={review.actions} onChange={event=>setReview({...review,actions:event.target.checked})} /><span>I reviewed the alternatives, responsibilities, measures, and follow-up.</span></label></fieldset><div className={styles.actions}>{(dirty||saved?.status!=="review")&&<button className={styles.primary} disabled={Boolean(busy)||availability?.caseSavingAvailable===false} onClick={()=>void save("review")}>Save for review</button>}<button className={styles.primary} disabled={Boolean(busy)||dirty||saved?.status!=="review"||!allReviewed} onClick={()=>void save("final",true)}>Approve final copy</button></div><p className={styles.muted}>This records your consultant review. It does not replace an agency decision or required approval.</p></>}</section>
      <section className={styles.panel}><h2>Download your work</h2><p>Download the complete report, a worksheet organized by toolkit question, or the action plan on its own. Each includes its saved status and source information.</p>{dirty&&<p className={styles.notice}>Save your changes first so the download matches your current work.</p>}<div className={styles.downloads}>{([['report','Analysis report','The complete findings, alternatives, actions, and evidence.'],['worksheet',request.track==="scan"?'Equity scan worksheet':'Full analysis worksheet','Responses organized around the toolkit questions.'],['action-plan','Action plan','Responsibilities, resources, measures, and follow-up.']] as const).map(([kind,title,description])=><div className={styles.downloadCard} key={kind}><h3>{title}</h3><p>{description}</p><div className={styles.actions}><button className={styles.secondary} disabled={Boolean(busy)||!saved||dirty} onClick={()=>void download(kind,"word")}>Word<span className={styles.hidden}> {title}</span></button><button className={styles.secondary} disabled={Boolean(busy)||!saved||dirty} onClick={()=>void download(kind,"pdf")}>PDF<span className={styles.hidden}> {title}</span></button></div></div>)}</div><details className={styles.disclosure}><summary>Keep a complete data copy</summary><p>The data copy includes the analysis and source text. Store it with the same care as your source documents.</p><button className={styles.textButton} disabled={Boolean(busy)||!saved||dirty} onClick={()=>void download("report","json")}>Download data copy</button></details></section>
      {saved&&<details className={styles.disclosure}><summary>Manage this saved case</summary>{!removeConfirm?<button className={styles.textButton} disabled={Boolean(busy)} onClick={()=>setRemoveConfirm(true)}>Remove saved case</button>:<div className={styles.notice}><p>Remove “{saved.title}” from the private case library? Downloaded copies will remain wherever you saved them.</p><div className={styles.actions}><button className={styles.secondary} disabled={Boolean(busy)} onClick={()=>void deleteCase()}>Remove this case</button><button className={styles.textButton} onClick={()=>setRemoveConfirm(false)}>Keep it</button></div></div>}</details>}
    </>}
  </div>;
}
