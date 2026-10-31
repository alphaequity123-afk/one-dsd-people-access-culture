"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { validPlans, emptyPlans, keepPlanCopies, loadPlans, newPlan, planFields, planText, practicePlanSections, savePlans, type PracticePlan, type PracticePlans, type SavedPlans } from "@/lib/client/dsd-practice-plans";

import { goalPlanHtml, goalPlanWord, type GoalPlanReport } from "@/lib/program/goal-plan-report";

const storage = () => window.localStorage;
const programScope: "dsd" | "dhs" = "dsd";
const programName = `One ${programScope.toUpperCase()}`;
const analysisHref = (id: string) => `/learn/equity-toolkit/practice?plan=${encodeURIComponent(id)}#toolkit-draft`;
type SaveProblem = Exclude<SavedPlans, { ok: true }>["reason"];
type EditorState = { data: PracticePlans; raw: string | null | undefined; problem: SaveProblem | null; status: string };
const openingFailure = "Saved plans could not be opened. New work will stay on this page until saving is available. Download it before leaving. Existing saved data has not been replaced.";
function openPlans(): EditorState {
  const loaded = loadPlans(storage);
  if (loaded.ok) {
    const requested = new URLSearchParams(window.location.search).get("plan");
    if (requested && loaded.data.plans.some(plan => plan.id === requested)) loaded.data = { ...loaded.data, activeId: requested };
  }
  return loaded.ok
    ? { data: loaded.data, raw: loaded.raw, problem: null, status: loaded.data.plans.length ? "Your saved plans are open." : "Create a plan to begin. Changes save automatically on this device." }
    : { data: emptyPlans(), raw: undefined, problem: "unreadable", status: openingFailure };
}
function failureMessage(problem: SaveProblem): string {
  if (problem === "invalid") return "This plan could not be saved because its working notes could not be read. Your work is still here; download a copy before leaving.";
  if (problem === "unreadable") return openingFailure;
  if (problem === "conflict") return "Saved plans changed in another page. Your edits are still here. Keep separate copies or download your current plan before leaving; the newer saved plans have not been replaced.";
  return "This device could not save your changes. Your current work is still here. Retry saving or download your plan before leaving.";
}

/** This shelf only reads the browser's existing plans; opening My work never creates a draft. */
export function SavedDecisionLinks() {
  const [analyses, setAnalyses] = useState<PracticePlan[]>([]);
  const [problem, setProblem] = useState(false);
  useEffect(() => {
    const refresh = () => {
      const loaded = loadPlans(storage);
      setProblem(!loaded.ok);
      if (loaded.ok) setAnalyses(loaded.data.plans.filter(plan => Boolean(plan.analysis)));
    };
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);
  if (problem) return <p role="status">Your saved analyses could not be opened on this device. Your existing information has not been replaced.</p>;
  if (!analyses.length) return null;
  return <section className="dsd-work-card" aria-labelledby="saved-analyses-title">
    <p className="dsd-eyebrow">Continue your work</p><h2 id="saved-analyses-title">Your saved analyses</h2>
    <p>Pick up the Toolkit analyses you saved, right where you left them.</p>
    <ul className="space-y-4">{analyses.map(plan => <li key={plan.id}>
      <Link href={analysisHref(plan.id)}>{plan.title.trim() || "Untitled analysis"}</Link>
      <p><Link href={`/my-work/plan?plan=${encodeURIComponent(plan.id)}`}>Read or download this plan →</Link></p>
    </li>)}</ul>
  </section>;
}

export default function PracticePlannerEditor() {
  const [state, setState] = useState(openPlans);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [manualCopy, setManualCopy] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState("");
  const titleInput = useRef<HTMLInputElement>(null);
  const active = state.data.plans.find(plan => plan.id === state.data.activeId);
  const toDelete = state.data.plans.find(plan => plan.id === deleteId);
  const unsaved = state.problem !== null && state.data.plans.length > 0;

  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  function commit(data: PracticePlans, deletion = false) {
    const result = savePlans(storage, data, state.raw);
    if (result.ok) {
      setState({ data, raw: result.raw, problem: null, status: deletion ? "The plan was deleted from this device." : "All plans saved on this device." });
      return true;
    }
    setState({ ...state, data: deletion ? state.data : data, problem: result.reason,
      status: deletion ? result.reason === "unavailable"
        ? "The plan could not be deleted and remains here. Choose Yes, delete this plan to try again, or Keep this plan to cancel."
        : `The plan could not be deleted and remains here. ${failureMessage(result.reason)}` : failureMessage(result.reason) });
    return false;
  }
  function create() {
    const plan = newPlan(`Practice plan ${state.data.plans.length + 1}`);
    commit({ version: 1, activeId: plan.id, plans: [...state.data.plans, plan] });
    setDeleteId(null); setManualCopy(false); setDownloadStatus("");
    window.requestAnimationFrame(() => titleInput.current?.focus());
  }
  function select(id: string) {
    commit({ ...state.data, activeId: id });
    setDeleteId(null); setManualCopy(false); setDownloadStatus("");
  }
  function edit(change: Partial<PracticePlan>) {
    if (!active || active.analysis) return;
    commit({ ...state.data, plans: state.data.plans.map(plan => plan.id === active.id ? { ...plan, ...change, updatedAt: new Date().toISOString() } : plan) });
    setDeleteId(null); setDownloadStatus("");
  }
  function retry() {
    if (state.problem !== "unreadable" && state.problem !== "conflict") { commit(state.data); return; }
    const loaded = loadPlans(storage);
    if (!loaded.ok) { setState(current => ({ ...current, status: openingFailure })); return; }
    const combined = keepPlanCopies(loaded.data, state.data);
    const saved = savePlans(storage, combined, loaded.raw);
    setState(saved.ok
      ? { data: combined, raw: saved.raw, problem: null, status: "Your plans are saved. Existing saved versions were kept." }
      : { data: combined, raw: loaded.raw, problem: saved.reason, status: failureMessage(saved.reason) });
    setDeleteId(null);
  }
  function remove() {
    if (!toDelete) return;
    const plans = state.data.plans.filter(plan => plan.id !== toDelete.id);
    const activeId = state.data.activeId === toDelete.id ? plans[0]?.id ?? null : state.data.activeId;
    if (commit({ version: 1, activeId, plans }, true)) { setDeleteId(null); setManualCopy(false); setDownloadStatus(""); }
  }
  function cancelDelete() {
    setDeleteId(null);
    setState(current => ({ ...current, status: current.problem ? `The plan is still open. ${failureMessage(current.problem)}` : "The plan was kept." }));
  }
  function backup() {
    try{const url=URL.createObjectURL(new Blob([JSON.stringify(state.data)],{type:'application/json'}));const anchor=document.createElement('a');anchor.href=url;anchor.download=`${programName} - Restorable practice plans.json`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setDownloadStatus('Your working-copy download is ready. Keep it privately; it includes every plan and its complete saved analysis.');}catch{setDownloadStatus('The working-copy download could not start. Your plans remain here.');}
  }
  async function restore(file:File|undefined) {
    if(!file)return;
    if(file.size>5_000_000){setDownloadStatus(`This file is too large. Choose a ${programName} working copy smaller than 5 MB.`);return;}
    try{const data:unknown=JSON.parse(await file.text());if(!validPlans(data)||data.plans.length>300)throw Error('invalid');const combined=keepPlanCopies(state.data,data);if(commit(combined))setDownloadStatus('The working copy is open. Existing plans were kept, and different versions are kept separately.');}catch{setDownloadStatus(`This file could not be read as a ${programName} working copy. Your existing plans have not changed.`);}
  }
  function report(): GoalPlanReport {
    return {title: active?.title || "Practice plan", notes:[`${programName} People, Access and Culture`, active?.analysis ? "Working draft. This is not submitted, approved, or a completed official equity analysis." : "Private working draft. This is not submitted or approved. Share only the information you intend to share."], sections: active ? practicePlanSections(active) : []};
  }
  async function downloadWord() {
    if(!active)return;
    try {const blob=await goalPlanWord(report());const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=`${programName} - Practice plan.docx`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setDownloadStatus('Your editable Word download is ready.');}
    catch {setDownloadStatus('The Word download could not start. Your work remains here; use the text download to keep a copy.');}
  }
  function printReport() {
    if(!active)return;
    const view=window.open('', '_blank');
    if(!view){setDownloadStatus('Allow this page to open a report window, then try again. Your work remains here.');return;}
    view.document.open();view.document.write(goalPlanHtml(report()));view.document.close();view.focus();view.print();
    setDownloadStatus('The report is open. Choose a printer or Save as PDF.');
  }
  function download() {
    if (!active) return;
    let url: string | undefined;
    let anchor: HTMLAnchorElement | undefined;
    try {
      url = URL.createObjectURL(new Blob([planText(active, programScope)], { type: "text/plain;charset=utf-8" }));
      anchor = document.createElement("a"); anchor.href = url;
      const name = active.title.trim().replace(/[^A-Za-z0-9-]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "practice-plan";
      anchor.download = `${programName.replaceAll(" ", "-")}-${name}.txt`;
      document.body.appendChild(anchor); anchor.click();
      setManualCopy(false); setDownloadStatus("Download requested. Check your downloads for the text file.");
    } catch {
      setManualCopy(true); setDownloadStatus("The download could not start. Copy your complete plan below to keep it. Your current entries are still here.");
    } finally {
      anchor?.remove();
      if (url) { const pending = url; window.setTimeout(() => URL.revokeObjectURL(pending), 1000); }
    }
  }

  return <div className="dsd-planner">
    <p className="dsd-planner-privacy">Plans are private working drafts saved on this device. They are not submitted to the program or shared with supervisors. Anyone using this device may be able to open them. Use role descriptions and general work information; leave out names and private client, case, health, or personnel information.</p>
    <div className="dsd-planner-status" role="status" aria-live="polite"><p>{state.status}</p>{state.problem && !(deleteId && state.problem === "unavailable") ? <button type="button" onClick={retry}>{state.problem === "conflict" ? "Keep my changes as separate copies" : state.problem === "unreadable" ? "Check saved plans again" : "Retry saving"}</button> : null}</div>
    <div className="dsd-planner-actions"><button type="button" onClick={backup}>Download restorable working copy</button><label>Import working copy<input type="file" accept=".json,application/json" onChange={event=>{void restore(event.target.files?.[0]);event.target.value="";}} /></label></div>
    <p className="dsd-planner-download-status" role="status" aria-live="polite">{downloadStatus}</p>
    <div className="dsd-planner-layout">
      <aside className="dsd-planner-list" aria-labelledby="planner-list-heading">
        <h2 id="planner-list-heading">Your plans</h2>
        <button type="button" onClick={create}>New plan</button>
        {state.data.plans.length ? <ul>{state.data.plans.map(plan => <li key={plan.id}><button type="button" aria-current={active?.id === plan.id ? "true" : undefined} onClick={() => select(plan.id)}>{plan.title.trim() || "Untitled plan"}</button></li>)}</ul> : <p>No plans are open yet. Start with one decision or practice you want to examine.</p>}
      </aside>
      {active ? <section className="dsd-planner-editor" aria-labelledby="planner-current-heading">
        <header className="dsd-planner-heading"><p className="dsd-planner-eyebrow">Private working draft</p><h2 id="planner-current-heading">{active.title.trim() || "Untitled plan"}</h2><p>Use this plan to prepare a discussion or practical next step. It does not replace the official Equity Analysis Toolkit or establish an approved decision.</p></header>
        {active.analysis ? <div className="dsd-planner-field">
          <p>This plan includes your complete saved Toolkit analysis. Continue there to update the notes, options, responsibilities, and review together.</p>
          <p><Link href={analysisHref(active.id)}>Continue your analysis →</Link></p>
          <details><summary>Read the complete saved analysis</summary>{practicePlanSections(active).map(section => <section key={section.heading} className="my-6">
            <h3 className="font-semibold">{section.heading}</h3><dl>{section.entries.map((entry, index) => <div key={index} className="my-4">
              <dt className="font-medium">{entry.label}</dt><dd className="whitespace-pre-wrap break-words">{entry.text}</dd>
            </div>)}</dl>
          </section>)}</details>
        </div> : <>
        <div className="dsd-planner-field"><label htmlFor="practice-plan-title">Plan name</label><input ref={titleInput} id="practice-plan-title" type="text" maxLength={120} value={active.title} onChange={event => edit({ title: event.target.value })} /></div>
        {planFields.map(field => <div className="dsd-planner-field" key={field.key}>
          <label htmlFor={`practice-plan-${field.key}`}>{field.label}</label><p className="dsd-planner-help" id={`practice-help-${field.key}`}>{field.help}</p>
          {field.key === "reviewDate" ? <input type="date" id={`practice-plan-${field.key}`} aria-describedby={`practice-help-${field.key}`} value={active.fields[field.key]} onChange={event => edit({ fields: { ...active.fields, [field.key]: event.target.value } })} />
            : <textarea rows={3} id={`practice-plan-${field.key}`} aria-describedby={`practice-help-${field.key}`} value={active.fields[field.key]} onChange={event => edit({ fields: { ...active.fields, [field.key]: event.target.value } })} />}
        </div>)}
        <p><Link href={analysisHref(active.id)}>Continue this plan in the Equity Analysis Toolkit →</Link></p>
        </>}
        <div className="dsd-planner-actions"><button type="button" onClick={downloadWord}>Download Word</button><button type="button" onClick={printReport}>Print or save as PDF</button><button type="button" onClick={download}>Download text copy</button><button type="button" onClick={() => setDeleteId(active.id)}>Delete this plan</button></div>
        {toDelete ? <div className="dsd-planner-confirm" role="group" aria-label="Confirm plan deletion"><p>Delete “{toDelete.title.trim() || "Untitled plan"}” from this device? Download a copy first if you want to keep it. Other plans will remain.</p><div className="dsd-planner-actions"><button type="button" onClick={remove}>Yes, delete this plan</button><button type="button" onClick={cancelDelete}>Keep this plan</button></div></div> : null}
        
        {manualCopy ? <div className="dsd-planner-field"><label htmlFor="practice-plan-copy">Copy your complete plan</label><textarea id="practice-plan-copy" readOnly rows={16} value={planText(active, programScope)} onFocus={event => event.currentTarget.select()} /></div> : null}
      </section> : <section className="dsd-planner-empty" aria-label="Plan a practical change"><h2>Connect a decision to a next step</h2><p>Gather the relevant perspectives and evidence, compare options, and decide what you will observe. You can return to each plan as the work develops.</p></section>}
    </div>
  </div>;
}
