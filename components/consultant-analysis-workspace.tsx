"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { ADSA_GOALS, analysisRequestSchema, sourceSchema, calculateGap, calculateScenario, PRACTICE_SCENARIOS, REVIEW_CRITERIA, validateAnalysisResponse, type AnalysisRequest, type AnalysisResponse, type AggregateMeasure } from "@/lib/consultant-analysis";
import { analysisExportSchema } from "@/lib/consultant-analysis/export-schema";
import { analysisReportHtml, type AnalysisReportInput } from "@/lib/consultant-analysis/report";

const KEY = "one-dsd-consultant-analysis-private";
const draftSchema = analysisExportSchema.omit({gapResult:true}).superRefine((draft,context)=>{
  if(!draft.analysis)return;
  const sources=new Map(draft.analysisSources.map(source=>[source.id,source]));
  for(const entry of [...draft.analysis.findings,...draft.analysis.recommendations]){
    if(new Set(entry.goals).size!==entry.goals.length || entry.goals.some(goal=>!draft.request.goals.includes(goal)))context.addIssue({code:"custom",message:"Draft goals must match the selected goals."});
    for(const citation of entry.citations){const source=sources.get(citation.sourceId);if(!source || !citation.excerpt || !source.text.includes(citation.excerpt))context.addIssue({code:"custom",message:"Draft quotations must match their source."});}
  }
});
const initial: AnalysisRequest = { title: "", question: "", scope: "division", kind: "policy", mode: "actual", publicMaterialConfirmed: true, publicResearch: false, goals: [], context: "", sources: [{ id: "source-1", title: "", text: "" }] };
const initialGap = { label: "", value: "", target: "", unit: "count" as "count" | "percent" | "days" | "dollars", numerator:"",denominator:"", direction: "increase" as "increase" | "decrease", start: "", end: "", change: "0", uncertainty: "" };
const surface = "rounded-xl border border-slate-300 bg-slate-50 p-5 md:p-6";
const input = "w-full rounded-md border border-slate-400 bg-white px-3 py-2 text-slate-900";
const navyAction = {backgroundColor:"#17395d",color:"#ffffff",borderColor:"#17395d"};
function goalNames(ids: AnalysisRequest["goals"]) { return ids.length ? ids.map(id => ADSA_GOALS.find(goal => goal.id === id)?.title ?? id).join(" · ") : "No ADSA goals selected for this work."; }
function reportingDate(value:string) {
  const date=value.trim();
  const match=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(date);
  return match ? `${match[3]}-${match[1].padStart(2,"0")}-${match[2].padStart(2,"0")}` : date;
}
function safeSourceHref(value:string|undefined) {
  if(!value) return null;
  try {const url=new URL(value);return ["http:","https:"].includes(url.protocol)&&!url.username&&!url.password ? url.href : null;} catch{return null;}
}

function EditText({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return <label className="block space-y-1"><span className="font-semibold">{label}</span><textarea className={input} rows={rows} maxLength={6000} value={value} onChange={event => onChange(event.target.value)} /></label>;
}

export function ConsultantAnalysisWorkspace() {
  const [request, setRequest] = useState<AnalysisRequest>(initial);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [analysisSources, setAnalysisSources] = useState<AnalysisRequest["sources"]>([]);
  const [researchNote, setResearchNote] = useState("");
  const [availability,setAvailability] = useState<{analysisAvailable:boolean;researchAvailable:boolean;analysisUnavailableReason?:string}|null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAvailable, setSavedAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading,setUploading]=useState(false);
  const [exporting,setExporting]=useState(false);
  const [preparedDownload,setPreparedDownload]=useState<{format:"html"|"word"|"json";payload:string;name:string}|null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"prepare" | "analysis" | "gaps" | "practice">("prepare");
  const [gap, setGap] = useState(initialGap);
  const [gapError, setGapError] = useState("");
  const [gapResult, setGapResult] = useState<{ gap: number | null; targetMet: boolean | null; scenario: number | null; current:number|null;target:number|null } | null>(null);
  const [gapSnapshot,setGapSnapshot]=useState("");
  const [review, setReview] = useState<Record<string, { status: string; note: string }>>({});
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(()=>()=>{document.getElementById("one-dsd-report-download")?.remove();},[]);

  useEffect(() => { const timeout = setTimeout(() => { try { setSavedAvailable(Boolean(localStorage.getItem(KEY))); } catch { /* Storage is optional. */ } },0); return () => clearTimeout(timeout); }, []);
  useEffect(() => {
    const controller=new AbortController();
    void fetch("/api/consultant/analysis",{signal:controller.signal}).then(async response=>{
      if(!response.ok) throw new Error("Connection check failed");
      const body=await response.json();
      setAvailability({analysisAvailable:body.analysisAvailable===true,researchAvailable:body.researchAvailable===true,analysisUnavailableReason:typeof body.analysisUnavailableReason==="string" ? body.analysisUnavailableReason.slice(0,1000) : undefined});
    }).catch(()=>{if(!controller.signal.aborted)setAvailability({analysisAvailable:false,researchAvailable:false});});
    return()=>controller.abort();
  },[]);
  useEffect(() => {
    if (!saving) return;
    timer.current = setTimeout(() => {
      const checked = draftSchema.safeParse({ request, analysis, analysisSources,researchNote, gap, review });
      if (!checked.success) { setMessage("Complete the required preparation fields before a draft can be saved."); return; }
      try { localStorage.setItem(KEY, JSON.stringify(checked.data)); setSavedAvailable(true); setMessage("Saved in this browser. Not shared or saved to the server."); }
      catch { setMessage("Browser saving is unavailable. Download a copy to keep your work."); }
    }, 600);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [request, analysis, analysisSources,researchNote, gap, review, saving]);
  function invalidateAnalysis() { if (analysis) { setAnalysis(null); setAnalysisSources([]);setResearchNote(""); setMessage("Preparation changed. Run a new analysis so findings match the current material."); } }
  function update<K extends keyof AnalysisRequest>(key: K, value: AnalysisRequest[K]) { invalidateAnalysis(); setRequest(previous => ({ ...previous, [key]: value })); }
  function sourceUpdate(index: number, key: "title" | "text", value: string) { invalidateAnalysis(); setRequest(previous => ({ ...previous, sources: previous.sources.map((source, i) => i === index ? { ...source, [key]: value } : source) })); }
  function recover() {
    try {
      const value = localStorage.getItem(KEY);
      if (!value || value.length > 2000000) throw new Error("No supported saved draft was found.");
      const parsed = draftSchema.parse(JSON.parse(value));
      applyDraft(parsed); setMessage("Recovered your browser draft. Confirm the material before running another analysis.");
    } catch { setError("The saved draft could not be recovered. Your current work has not been replaced."); }
  }
  function download() {
    const checked = draftSchema.safeParse({ request, analysis, analysisSources,researchNote, gap, review });
    if (!checked.success) { setError("Add a title, question, source title and source text before downloading."); return; }
    prepareDownload("json",JSON.stringify(checked.data),"one-dsd-equity-analysis.json");
    setMessage("Working copy ready. If the download did not start, choose Save the prepared file. This copy is not password protected.");
  }
  function applyDraft(parsed:z.infer<typeof draftSchema>) {
    setRequest(parsed.request);setAnalysis(parsed.analysis);setAnalysisSources(parsed.analysisSources);setResearchNote(parsed.researchNote);setGap(parsed.gap);setReview(parsed.review);setGapResult(null);setConfirmed(false);setError("");
  }
  async function importDraft(file:File|undefined) {
    if(!file) return;
    if(file.size>2000000) {setError("Choose a downloaded analysis copy under 2 MB.");return;}
    try {const parsed=draftSchema.parse(JSON.parse(await file.text()));applyDraft(parsed);setMessage("Opened your downloaded working copy. Confirm its material before running another analysis.");}
    catch {setError("This file is not a supported working copy. Your current work has not been replaced.");}
  }
  async function upload(file: File | undefined, index: number) {
    if (!file) return;
    if(!confirmed){setError("Confirm that the material is public or deidentified before uploading.");return;}
    if (!/\.(txt|pdf|docx|pptx|png|jpe?g|webp|mp3|wav|m4a|mp4|webm)$/i.test(file.name) || file.size > 20*1024*1024) { setError("Choose a supported document, image, audio or video file no larger than 20 MB."); return; }
    const form=new FormData();form.append("file",file);form.append("publicMaterialConfirmed","true");
    const selectedSourceId=request.sources[index]?.id;if(!selectedSourceId)return;
    setUploading(true);setError("");setMessage("Reading the uploaded material…");
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),300000);
    try{
      const response=await fetch("/api/consultant/analysis/upload",{method:"POST",body:form,signal:controller.signal});
      const body=await response.json();
      if(!response.ok)throw new Error(typeof body.error==="string"?body.error:"This material could not be read. Your current work is unchanged.");
      const source=sourceSchema.parse(body.source);
      const combined=request.sources.reduce((sum,s)=>sum+(s.id===selectedSourceId?source.text.length:s.text.length),0);
      if(combined>200000)throw new Error("Use shorter excerpts or fewer sources so the total remains under 200,000 characters. Your current material is unchanged.");
      invalidateAnalysis();setRequest(previous=>({...previous,sources:previous.sources.map(s=>s.id===selectedSourceId?{...source,id:selectedSourceId}:s)}));
      setMessage(typeof body.note==="string"?body.note.slice(0,6000):"Material loaded. Review the extracted text before analyzing; formatting and non-text details may not be included.");
    }catch(cause){setError(controller.signal.aborted?"Reading this file took too long. Your current work is unchanged.":cause instanceof z.ZodError?"The extracted material could not be checked. Your current work is unchanged; use a shorter text excerpt instead.":cause instanceof Error?cause.message:"This material could not be read. Your current work is unchanged.");setMessage("");}
    finally{clearTimeout(timeout);setUploading(false);}
  }
  function reportInput():AnalysisReportInput{return {request,analysis,sources:analysis?analysisSources:request.sources,researchNote,gap,gapResult:gapSnapshot===JSON.stringify(gap)?gapResult:null,review};}
  function exportPayload(){return JSON.stringify({request,analysis,analysisSources,researchNote,gap,review,gapResult:gapSnapshot===JSON.stringify(gap)?gapResult:null});}
  function submitDownload(format:"html"|"word"|"json",payload:string){
    let frame=document.getElementById("one-dsd-report-download") as HTMLIFrameElement|null;
    if(!frame){frame=document.createElement("iframe");frame.id="one-dsd-report-download";frame.name="one-dsd-report-download";frame.title="Report download response";frame.hidden=true;frame.onload=()=>{try{const text=frame?.contentDocument?.body?.textContent;if(text){const result=JSON.parse(text);if(typeof result.error==="string"){setError(result.error.slice(0,1000));setMessage("");}}}catch{/* Attachment responses do not expose a document. */}};document.body.appendChild(frame);}
    const form=document.createElement("form");form.method="POST";form.action="/api/consultant/analysis/export";form.target=frame.name;form.hidden=true;
    for(const [name,value] of Object.entries({format,payload})){const field=document.createElement("input");field.type="hidden";field.name=name;field.value=value;form.appendChild(field);}
    document.body.appendChild(form);try{form.submit();}finally{form.remove();}
  }
  function prepareDownload(format:"html"|"word"|"json",payload:string,name:string){setPreparedDownload({format,payload,name});submitDownload(format,payload);}
  async function exportReport(format:"html"|"word"){
    setExporting(true);setError("");
    try{prepareDownload(format,exportPayload(),`one-dsd-analysis-report.${format==="html"?"html":"docx"}`);setMessage("Report download requested. If the browser did not save it, choose Save the prepared file. Keep the report somewhere appropriate; it is not password protected.");}
    catch{setError("The report download could not be requested. Your work is unchanged; download a working copy to keep it.");}finally{setExporting(false);}
  }
  async function shareReport(){
    const file=new File([analysisReportHtml(reportInput())],"one-dsd-analysis-report.html",{type:"text/html"});
    if(navigator.share&&navigator.canShare?.({files:[file]})){
      try{await navigator.share({files:[file],title:request.title||"One DSD equity analysis"});setMessage("The report was passed to your device’s sharing service. No public page or link was created.");}
      catch(cause){if(cause instanceof DOMException&&cause.name==="AbortError")setMessage("Sharing canceled. Your work is unchanged.");else{prepareDownload("html",exportPayload(),file.name);setMessage("Device sharing was unavailable. Choose Save the prepared file, then attach it using your usual sharing service.");}}
    }else{prepareDownload("html",exportPayload(),file.name);setMessage("This browser does not support sharing a report file. Choose Save the prepared file, then attach it using your usual sharing service.");}
  }
  async function analyze() {
    setError(""); setMessage("");
    if (!confirmed) { setError("Confirm that the material is public or deidentified before continuing."); return; }
    const checked = analysisRequestSchema.safeParse(request);
    if (!checked.success) {
      const field=checked.error.issues[0]?.path[0];
      setError(field==="title" ? "Give this work a title." : field==="question" ? "Enter the question you want to examine." : field==="goals" ? "Check the ADSA goals you selected. You may leave them blank when they do not apply." : field==="sources" ? "Give each source a title and a text excerpt. Use up to 12 sources and 200,000 characters in total." : "Check the preparation fields before continuing.");
      return;
    }
    setBusy(true);
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),180000);
    try {
      const response = await fetch("/api/consultant/analysis", { method: "POST", signal:controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(checked.data) });
      const body = await response.json();
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Analysis is unavailable. Your work is still here.");
      const sources=z.array(sourceSchema).min(1).max(12).parse(body.sources ?? checked.data.sources);
      const validated = validateAnalysisResponse(body.analysis, {...checked.data,sources});
      setAnalysisSources(sources);setResearchNote(typeof body.researchNote === "string" ? body.researchNote.slice(0,6000) : "");setAnalysis(validated); setTab("analysis"); setMessage("Analysis ready for your review. Check the evidence and revise the proposed actions.");
      setTimeout(() => resultHeading.current?.focus(), 0);
    } catch (cause) { setError(controller.signal.aborted ? "The analysis response did not arrive within three minutes. Your work is still here. You can try again; no automatic retry was made." : cause instanceof z.ZodError ? "The returned analysis could not be checked. Your preparation is still here; no new findings have been added." : cause instanceof Error ? cause.message : "Analysis is unavailable. Your work is still here."); }
    finally { clearTimeout(timeout);setBusy(false); }
  }
  function calculate() {
    setGapError(""); setGapResult(null);
    try {
      if(!gap.change.trim()) throw new Error("Enter a what-if change, including zero for no change.");
      if(gap.unit==="count" && gap.target.trim() && !Number.isSafeInteger(Number(gap.target))) throw new Error("A count target must be a whole number.");
      const numerator=gap.numerator.trim()?Number(gap.numerator):null;
      const denominator=gap.denominator.trim()?Number(gap.denominator):null;
      if(gap.unit==="percent" && ((numerator===null)!==(denominator===null))) throw new Error("Enter both the number meeting the measure and the total group size, or leave both blank if unknown.");
      const current=gap.unit==="percent" ? numerator===null||denominator===null ? null : numerator/denominator*100 : gap.value.trim()?Number(gap.value):null;
      const measure: AggregateMeasure = { label: gap.label, unit: gap.unit, value: current, ...(gap.unit==="percent"?{numerator,denominator}:{}), periodStart: reportingDate(gap.start), periodEnd: reportingDate(gap.end), sourceId: request.sources[0]?.id ?? "source-1" };
      const result = calculateGap(measure, gap.target.trim() ? Number(gap.target) : null, gap.direction);
      const scenario = calculateScenario(measure.value, Number(gap.change));
      if(gap.unit==="percent" && scenario.value!==null && scenario.value>100) throw new Error("This what-if change exceeds 100 percent. Use a smaller change or review the assumption.");
      setGapResult({ gap: result.gap, targetMet: result.targetMet, scenario: scenario.value,current:measure.value,target:gap.target.trim()?Number(gap.target):null });
      setGapSnapshot(JSON.stringify(gap));
    } catch (cause) {
      if(cause instanceof z.ZodError) {
        const issue=cause.issues[0];
        if(issue?.path.includes("periodStart") || issue?.path.includes("periodEnd")) setGapError("Enter valid reporting dates. The end date must be on or after the start date.");
        else if(issue?.path.includes("label")) setGapError("Give the measure a clear name before comparing it.");
        else if(issue?.path.includes("denominator") || issue?.path.includes("numerator") || gap.unit==="percent") setGapError("Enter the number meeting the measure and a total group size greater than zero. The first number cannot be larger than the total.");
        else setGapError("Enter a number of zero or more in the selected unit. Counts must be whole numbers.");
      } else setGapError(cause instanceof Error ? cause.message : "Check the measure and reporting dates.");
    }
  }
  function citations(entries: AnalysisResponse["findings"][number]["citations"]) {
    return entries.length ? <div className="space-y-2 border-t border-slate-300 pt-3"><h4 className="font-bold">Referenced evidence</h4>{entries.map((citation, index) => <blockquote key={index} className="border-l-4 border-slate-500 pl-3"><p className="whitespace-pre-wrap">{citation.excerpt}</p><p className="text-sm font-semibold">{analysisSources.find(source => source.id === citation.sourceId)?.title ?? "Source unavailable"}</p></blockquote>)}</div> : <p className="text-sm">No direct excerpt attached. Treat this as an interpretation or question requiring evidence.</p>;
  }
  return <div className="space-y-6 text-slate-900">
    <div className={`${surface} flex flex-wrap items-center justify-between gap-4`}>
      <div><h2 className="text-xl font-bold">From evidence to action</h2><p className="mt-1">DHS · ADSA · One DSD</p></div>
      <div className="flex flex-wrap gap-2"><button className="btn btn--light" disabled={busy || uploading || exporting} onClick={download}>Download working copy</button><button className="btn btn--light" disabled={busy || uploading || exporting} onClick={() => void exportReport("word")}>{exporting ? "Preparing report…" : "Download Word report"}</button><button className="btn btn--light" disabled={busy || uploading || exporting} onClick={() => void exportReport("html")}>Download HTML report</button><button className="btn btn--light" disabled={busy || uploading || exporting} onClick={() => void shareReport()}>Share report file</button>{savedAvailable && <button disabled={busy || uploading} className="btn btn--light" onClick={recover}>Recover browser draft</button>}<label className="btn btn--light">Open downloaded copy<input aria-label="Open downloaded analysis copy" type="file" accept=".json,application/json" className="max-w-48 text-sm" disabled={busy || uploading || exporting} onChange={event => void importDraft(event.target.files?.[0])} /></label></div>
      <div className="w-full space-y-2 text-sm">{preparedDownload && <p><button className="btn btn--light" onClick={()=>submitDownload(preparedDownload.format,preparedDownload.payload)}>Save the prepared file</button><span className="ml-3">{preparedDownload.name}</span></p>}<label className="flex items-start gap-2"><input type="checkbox" checked={saving} onChange={event => { setSaving(event.target.checked); setMessage(event.target.checked ? "Browser saving enabled for this workspace." : "Browser saving paused. Any earlier saved copy remains until you remove it."); }} />Keep a draft in this browser on this device</label><p>Use public material or remove private personal details first. Browser drafts and downloads are private working copies, not shared program records.</p>{savedAvailable && <button className="underline" onClick={() => { try { localStorage.removeItem(KEY); setSavedAvailable(false); setSaving(false); setMessage("Removed the saved browser copy. Your open work remains."); } catch { setError("The saved browser copy could not be removed."); } }}>Remove saved browser copy</button>}</div>
    </div>
    {error && <p role="alert" className="rounded-lg border border-red-700 bg-white p-4 text-red-800">{error}</p>}
    <p role="status" aria-live="polite" className="text-sm">{message}</p>
    <p className="text-sm">{availability===null ? "Checking analysis connections…" : availability.analysisAvailable ? "Analysis connection available. Working copies stay in your browser or downloaded file." : (availability.analysisUnavailableReason || "Analysis connection is unavailable. You can prepare material, explore numeric gaps, review work and download a copy; the full analysis cannot run yet.")}</p>
    <nav aria-label="Analysis workspace" className="flex flex-wrap gap-2">{([['prepare','1. Set the question'],['analysis','2. Examine findings'],['gaps','3. Explore the gap'],['practice','4. Review and learn']] as const).map(([value,label]) => <button key={value} type="button" className={`btn ${tab === value ? "btn--primary" : "btn--light"}`} style={tab === value ? navyAction : undefined} aria-current={tab === value ? "step" : undefined} onClick={() => setTab(value)}>{label}</button>)}</nav>
    {tab==="analysis" && analysis && <section className={surface}><h2 className="text-xl font-bold">Sources used for this analysis</h2>{request.mode==="practice" && <p className="mt-2 font-bold">Practice analysis. These findings do not describe actual DHS people or programs.</p>}{researchNote && <p className="mt-2">{researchNote}</p>}<ul className="mt-3 list-disc space-y-2 pl-5">{analysisSources.map(source=><li key={source.id}>{safeSourceHref(source.url) ? <a href={safeSourceHref(source.url)!} target="_blank" rel="noopener noreferrer" className="underline">{source.title}</a> : source.title}{source.date && ` · ${source.date}`}</li>)}</ul></section>}
    {tab === "prepare" && <fieldset disabled={busy || uploading} className="min-w-0 space-y-6">
      <div className={surface}><h2 className="text-xl font-bold">Try a realistic practice situation</h2><p className="mt-2">These invented cases are not evidence about actual DHS staff, services or legislation. Loading a case replaces the open preparation and analysis. Download any work you want to keep first.</p><div className="mt-3 flex flex-wrap gap-2">{PRACTICE_SCENARIOS.map(({id,...scenario}) => <button key={id} className="btn btn--light" onClick={() => {setRequest(scenario);setAnalysis(null);setAnalysisSources([]);setResearchNote("");setConfirmed(false);setReview({});setGap(initialGap);setGapResult(null);setGapSnapshot("");setGapError("");setMessage("Practice case loaded. Review the material and confirm it before analyzing.");}}>{scenario.title}</button>)}</div></div>
      <section className={surface}><h2 className="mb-4 text-xl font-bold">What decision are you examining?</h2><div className="grid gap-4 md:grid-cols-2"><label className="space-y-1"><span className="font-semibold">Work title</span><input className={input} maxLength={200} value={request.title} onChange={event => update("title",event.target.value)} /></label><label className="space-y-1"><span className="font-semibold">Reach of the work</span><select className={input} value={request.scope} onChange={event => update("scope",event.target.value as AnalysisRequest["scope"])}>{["individual","team","division","administration","agency"].map(scope => <option key={scope} value={scope}>{scope[0].toUpperCase()+scope.slice(1)}</option>)}</select></label><label className="space-y-1"><span className="font-semibold">Type of work</span><select className={input} value={request.kind} onChange={event => update("kind",event.target.value as AnalysisRequest["kind"])}><option value="policy">Policy or procedure</option><option value="bill">Bill or legislative proposal</option><option value="hcbs">Home and community-based services</option><option value="research">Research question</option><option value="workplace">Hiring or workplace culture</option><option value="program">Program or service design</option></select></label><label className="space-y-1"><span className="font-semibold">Use</span><select className={input} value={request.mode} onChange={event => update("mode",event.target.value as AnalysisRequest["mode"])}><option value="actual">Actual work</option><option value="practice">Practice</option></select></label></div><label className="mt-4 block space-y-1"><span className="font-semibold">Question to examine</span><textarea className={input} rows={3} maxLength={2000} value={request.question} onChange={event => update("question",event.target.value)} placeholder="Which barriers could this proposed change create, and which alternatives deserve consideration?" /></label><label className="mt-4 block space-y-1"><span className="font-semibold">Situation and who is responsible for the decision</span><textarea className={input} rows={3} maxLength={12000} value={request.context} onChange={event => update("context",event.target.value)} placeholder="Describe the situation, affected people, decision owner and any known limits. Do not include private personal information." /></label></section>
      <section className={surface}><h2 className="text-xl font-bold">Connect ADSA goals when relevant</h2><p className="mb-4 mt-2">This workspace supports work anywhere in DHS. Select ADSA goals when they apply; otherwise leave them blank. Findings and actions will keep the connections you choose.</p><div className="grid gap-3 md:grid-cols-2">{ADSA_GOALS.map(goal => <label key={goal.id} className="flex items-center gap-3 rounded-lg border border-slate-300 bg-white p-3"><input type="checkbox" checked={request.goals.includes(goal.id)} onChange={event => update("goals",event.target.checked ? [...request.goals,goal.id] : request.goals.filter(id => id !== goal.id))} /><span>{goal.title}</span></label>)}</div><Link className="mt-4 inline-block underline" href="/one-dsd">Explore the program and its equity goals</Link></section>
      <section className={surface}><h2 className="text-xl font-bold">Bring in the material</h2><p className="mb-4 mt-2">Paste excerpts or upload public or deidentified documents, images, audio or video. Confirm the material below before uploading. Give each source a clear title and check the extracted text. Use PDF, Word (.docx), PowerPoint (.pptx), text, PNG/JPEG/WebP, MP3/WAV/M4A, or MP4/WebM files up to 20 MB. Each source allows 50,000 characters, with 200,000 in total. Audio transcription and video review cover at most the first five minutes; video uses sampled visuals and it is not a complete review of every frame.</p>{request.sources.map((source,index) => <div key={source.id} className="mb-5 space-y-3 rounded-lg border border-slate-300 bg-white p-4"><label className="block space-y-1"><span className="font-semibold">Source {index+1} title</span><input className={input} maxLength={300} value={source.title} onChange={event => sourceUpdate(index,"title",event.target.value)} /></label><label className="block space-y-1"><span className="font-semibold">Source {index+1} text</span><textarea className={input} rows={7} maxLength={50000} value={source.text} onChange={event => sourceUpdate(index,"text",event.target.value)} /></label><label className="block"><span className="font-semibold">Upload material for this source</span><input className="mt-1 block w-full" type="file" accept=".txt,.pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a,.mp4,.webm" disabled={!confirmed || uploading || busy} onChange={event => {void upload(event.target.files?.[0],index);event.target.value="";}} /><p className="mt-1 text-sm">Read or transcribed text is returned for your review. Uploads are sent to the reading service; browser drafts and report downloads remain your working copies.</p></label>{request.sources.length > 1 && <button className="underline" onClick={() => update("sources",request.sources.filter((_,i) => i !== index))}>Remove this source</button>}</div>)}<button className="btn btn--light" disabled={request.sources.length >= 12} onClick={() => update("sources",[...request.sources,{id:`source-${crypto.randomUUID()}`,title:"",text:""}])}>Add another source</button><label className="mt-5 flex items-start gap-3"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /><span>I confirm these materials are public or have had private personal details removed, and are appropriate to send for analysis. They contain no private personnel, client, health or case information.</span></label><label className="mt-3 flex items-start gap-3"><input type="checkbox" disabled={!availability?.researchAvailable && !request.publicResearch} checked={request.publicResearch} onChange={event => update("publicResearch",event.target.checked)} /><span>Also search public sources using my question. The text you supplied is not sent to the search service. {!availability?.researchAvailable && "Public research is currently unavailable."}</span></label><button className="btn btn--primary mt-5" style={busy || !confirmed || !availability?.analysisAvailable ? undefined : navyAction} disabled={busy || uploading || !confirmed || !availability?.analysisAvailable} onClick={() => void analyze()}>{busy ? "Preparing your analysis…" : "Analyze the material"}</button><p className="mt-3 text-sm">Findings from the analysis need your review. Completing an analysis does not make it an official DHS position or a legal decision.</p></section>
    </fieldset>}
    {tab === "analysis" && <section className="space-y-5"><h2 ref={resultHeading} tabIndex={-1} className="text-2xl font-bold">Evidence, options and proposed action</h2>{!analysis ? <div className={surface}><p>Prepare your question and sources, then run an analysis. Your results will appear here.</p><button className="btn btn--light mt-3" onClick={() => setTab("prepare")}>Return to preparation</button></div> : <><div className={surface}><EditText label="Working summary" value={analysis.summary} onChange={summary => setAnalysis({...analysis,summary})} /><p className="mt-3 text-sm">Editable working analysis. Supplied quotations stay attached as evidence; changes you make are your own interpretation.</p></div><h3 className="text-xl font-bold">Findings</h3>{analysis.findings.map((finding,index) => <article key={index} className={`${surface} space-y-3`}><p className="text-sm font-bold uppercase tracking-wide">{finding.kind === "evidence" ? "Evidence from referenced material" : finding.kind === "gap" ? "Gap to investigate" : "Interpretation to review"}</p><EditText label={`Finding ${index+1}`} value={finding.statement} onChange={statement => setAnalysis({...analysis,findings:analysis.findings.map((item,i) => i===index ? {...item,statement}:item)})} /><EditText label="Reasoning" value={finding.reasoning} onChange={reasoning => setAnalysis({...analysis,findings:analysis.findings.map((item,i) => i===index ? {...item,reasoning}:item)})} /><p><strong>People to consider:</strong> {finding.affectedGroups.join(", ") || "Not yet identified"}</p><p className="text-sm"><strong>ADSA connection:</strong> {goalNames(finding.goals)}</p>{citations(finding.citations)}</article>)}<h3 className="text-xl font-bold">Compare alternatives</h3><div className="grid gap-4 lg:grid-cols-2">{analysis.alternatives.map((alternative,index) => <article key={index} className={`${surface} space-y-3`}>{(["title","benefits","risks","evidenceNeeded"] as const).map(key => <EditText key={key} label={key === "evidenceNeeded" ? "Evidence still needed" : key[0].toUpperCase()+key.slice(1)} value={alternative[key]} onChange={value => setAnalysis({...analysis,alternatives:analysis.alternatives.map((item,i) => i===index ? {...item,[key]:value}:item)})} />)}</article>)}</div><h3 className="text-xl font-bold">Turn the analysis into action</h3>{analysis.recommendations.map((recommendation,index) => <article key={index} className={`${surface} space-y-3`}>{(["action","rationale","responsibleRole","measure","nextStep"] as const).map(key => <EditText key={key} label={{action:"Proposed action",rationale:"Why this action",responsibleRole:"Responsible role",measure:"How to check the result",nextStep:"Next step"}[key]} value={recommendation[key]} onChange={value => setAnalysis({...analysis,recommendations:analysis.recommendations.map((item,i) => i===index ? {...item,[key]:value}:item)})} />)}<p className="text-sm"><strong>ADSA connection:</strong> {goalNames(recommendation.goals)}</p>{citations(recommendation.citations)}</article>)}<div className={surface}><h3 className="text-xl font-bold">Limits and questions</h3><ul className="mt-3 list-disc space-y-2 pl-5">{[...analysis.limitations,...analysis.questionsForReview].map((item,index) => <li key={index}>{item}</li>)}</ul></div><div className="flex flex-wrap gap-3"><button className="btn btn--primary" style={navyAction} onClick={() => setTab("gaps")}>Explore a measurable gap</button><Link className="btn btn--light" href="/one-dsd/planning">Connect to implementation planning</Link></div></>}</section>}
    {tab === "gaps" && <section className={surface}><h2 className="text-xl font-bold">Compare a current measure with a target</h2><p className="my-3">Use a group total or summary you are permitted to use, and a target in the same unit. Leave a value blank when it is unknown. This comparison does not explain the cause of a difference or predict an outcome.</p><div className="grid gap-4 md:grid-cols-2">{([['label','Measure'],['value','Current value (leave blank if unknown)'],['target','Target (leave blank if unknown)']] as const).map(([key,label]) => <label key={key} className="space-y-1"><span className="font-semibold">{label}</span><input className={input} disabled={key === "value" && gap.unit === "percent"} type={key === "label" ? "text" : "number"} min={key === "label" ? undefined : 0} value={gap[key]} onChange={event => setGap({...gap,[key]:event.target.value})} /></label>)}<label className="space-y-1"><span className="font-semibold">Unit</span><select className={input} value={gap.unit} onChange={event => setGap({...gap,unit:event.target.value as "count" | "percent" | "days" | "dollars"})}><option value="count">Count</option><option value="percent">Percentage</option><option value="days">Days</option><option value="dollars">Dollars</option></select></label><label className="space-y-1"><span className="font-semibold">Desired direction</span><select className={input} value={gap.direction} onChange={event => setGap({...gap,direction:event.target.value as "increase" | "decrease"})}><option value="increase">Increase toward target</option><option value="decrease">Decrease toward target</option></select></label>{([['start','Reporting period begins'],['end','Reporting period ends']] as const).map(([key,label]) => <label key={key} className="space-y-1"><span className="font-semibold">{label}</span><input className={input} type="text" aria-label={label} placeholder="MM/DD/YYYY" maxLength={10} value={gap[key]} onChange={event => setGap({...gap,[key]:event.target.value})} /></label>)}<label className="space-y-1"><span className="font-semibold">What-if change (%)</span><input className={input} type="number" min={-100} max={1000} value={gap.change} onChange={event => setGap({...gap,change:event.target.value})} /></label></div>{gap.unit==="percent" && <div className="mt-4 grid gap-4 md:grid-cols-2"><p className="md:col-span-2">For a percentage, enter the number meeting the measure and the total group size—for example, 60 completed requests out of 100. Leave both blank if unknown. The current percentage is calculated from these numbers.</p>{([["numerator","Number meeting the measure"],["denominator","Total in the measured group"]] as const).map(([key,label])=><label key={key} className="space-y-1"><span className="font-semibold">{label}</span><input className={input} type="number" min={0} value={gap[key]} onChange={event=>setGap({...gap,[key]:event.target.value})}/></label>)}</div>}<label className="mt-4 block space-y-1"><span className="font-semibold">Evidence, assumptions and uncertainty</span><textarea className={input} rows={3} value={gap.uncertainty} maxLength={6000} onChange={event => setGap({...gap,uncertainty:event.target.value})} placeholder="Name the source, population, limits and what would need to be true for the what-if change to occur." /></label><button className="btn btn--primary mt-4" style={navyAction} onClick={calculate}>Compare and explore</button>{gapError && <p role="alert" className="mt-3 text-red-800">{gapError}</p>}{gapResult && gapSnapshot===JSON.stringify(gap) && <div role="status" className="mt-5 rounded-lg border border-slate-400 bg-white p-5"><h3 className="text-lg font-bold">{gapResult.gap === null ? "Gap unknown" : gapResult.targetMet ? "Target reached for this measure" : `${gapResult.gap.toLocaleString()} ${gap.unit === "percent" ? "percentage points" : gap.unit} to the target`}</h3>{gapResult.gap !== null && (gapResult.target ?? 0)>0 && <><p className="mt-3 text-sm">Current and target, on the same scale</p>{[['Current',gapResult.current ?? 0],['Target',gapResult.target ?? 0]] .map(([label,value]) => <div key={String(label)} className="mt-2"><span>{label}: {Number(value).toLocaleString()} {gap.unit}</span><div className="mt-1 h-3 rounded bg-slate-200"><div className="h-3 rounded bg-slate-600" style={{width:`${Math.min(100,Number(value)/Math.max(gapResult.current ?? 0,gapResult.target ?? 0,1)*100)}%`}} /></div></div>)}</>}<p className="mt-4"><strong>What if the assumed change happens:</strong> {gapResult.scenario === null ? "The current value is unknown, so this result is unknown." : `${gapResult.scenario.toLocaleString()} ${gap.unit} if the assumed change occurs.`}</p><p className="mt-2 text-sm">This is a scenario, not a forecast. Predicting future results requires suitable data and checks for accuracy. That feature is not active here.</p></div>}</section>}
    {tab === "practice" && <section className={`${surface} space-y-4`}><h2 className="text-xl font-bold">Review the work and support learning</h2><p>Whether you are practicing or reviewing actual work, use the same criteria. Review the reasoning and supporting evidence, not a person’s worth or intercultural development level. Several well-supported answers may be reasonable.</p>{REVIEW_CRITERIA.map(criterion => <fieldset key={criterion.id} className="space-y-2 rounded-lg border border-slate-300 bg-white p-4"><legend className="px-2 font-bold">{criterion.title}</legend><label className="block"><span className="font-semibold">What does the work show?</span><select className={input} value={review[criterion.id]?.status ?? ""} onChange={event => setReview({...review,[criterion.id]:{status:event.target.value,note:review[criterion.id]?.note ?? ""}})}><option value="">Not reviewed yet</option><option value="supported">Supported with evidence</option><option value="developing">Developing; needs more work</option><option value="not-addressed">Not addressed</option><option value="not-applicable">Not applicable to this situation</option></select></label><label className="block"><span className="font-semibold">Evidence and useful feedback</span><textarea className={input} rows={3} maxLength={6000} value={review[criterion.id]?.note ?? ""} onChange={event => setReview({...review,[criterion.id]:{status:review[criterion.id]?.status ?? "",note:event.target.value}})} /></label></fieldset>)}<p className="text-sm">These observations can inform a future measure of progress over time. This workspace does not rank employees, determine individual IDI results or provide an established performance rating.</p><div className="flex flex-wrap gap-3"><Link className="btn btn--light" href="/program/foundation">Connect with foundational learning</Link><Link className="btn btn--light" href="/equity-review">Open the staff equity tools</Link></div></section>}
  </div>;
}
