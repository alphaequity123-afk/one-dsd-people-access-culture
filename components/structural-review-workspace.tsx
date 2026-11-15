"use client";

import Link from "@/components/app-link";
import { useEffect, useRef, useState } from "react";
import { STRUCTURAL_GUIDANCE, STRUCTURAL_STEPS, type StructuralField, type StructuralStepId } from "@/lib/structural-review/content";
import { freshStructuralDraft, isStructuralCalendarDate, parseStructuralDraft, structuralChecks, structuralProgress, structuralRouteWarning, STRUCTURAL_DRAFT_MAX_BYTES, STRUCTURAL_FIELD_MAX_LENGTH, STRUCTURAL_TABLE_MAX_ROWS, type StructuralDraft, type StructuralValue } from "@/lib/structural-review/draft";
import { structuralRecordText, structuralReportHtml } from "@/lib/structural-review/report";
import { DECISION_TYPES, DECISION_TYPE_LABELS, EQUITY_REVIEW_COUNT_NOTICE, PRACTICE_COUNTERS_ENABLED, sendEquityReviewCompletion, type DecisionType } from "@/lib/practice/equity-review-count";
import goalsFile from "@/lib/content/data/equity-goals.json";
import styles from "./structural-review-workspace.module.css";

export const STRUCTURAL_DRAFT_KEY = "one-dsd-structural-review-draft";
export const STRUCTURAL_IMPORT_LIMIT = STRUCTURAL_DRAFT_MAX_BYTES;
const SUMMARY = STRUCTURAL_STEPS.length;
const COUNT_GOALS = goalsFile.goals.map(goal => ({ number: goal.number, title: goal.title }));

function text(value: StructuralValue | undefined) { return typeof value === "string" ? value : ""; }
function choices(value: StructuralValue | undefined) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function StructuralReviewWorkspace() {
  const [draft, setDraft] = useState<StructuralDraft>(() => freshStructuralDraft());
  const [current, setCurrent] = useState(0);
  const [keep, setKeep] = useState(false);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const savingAllowed = useRef(false);
  const pendingFocus = useRef(false);
  const rowFocus = useRef<string | null>(null);
  const draftNow = useRef(draft);
  const generation = useRef(0);
  const importSequence = useRef(0);
  // One anonymous count per review. Kept with the saved draft so a reload does not count it again.
  const counted = useRef(false);
  const [countGoals, setCountGoals] = useState<number[]>([]);
  const [countDecision, setCountDecision] = useState<DecisionType | "">("");

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        const saved = localStorage.getItem(STRUCTURAL_DRAFT_KEY);
        if (saved) {
          const envelope = JSON.parse(saved) as { keep?: unknown; draft?: unknown; counted?: unknown };
          if (envelope.keep !== true) throw new Error("Unrecognized saved copy");
          const restored = parseStructuralDraft(envelope.draft);
          counted.current = envelope.counted === true;
          draftNow.current = restored; savingAllowed.current = true;
          setDraft(restored); setKeep(true); setNotice("Your saved draft is open.");
        }
      } catch {
        setError("Your saved draft could not be opened. It has not been replaced. You can continue here or open a downloaded working copy.");
      }
      setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !keep) return;
    const version = generation.current;
    const timer = setTimeout(() => {
      if (!savingAllowed.current || version !== generation.current) return;
      try {
        localStorage.setItem(STRUCTURAL_DRAFT_KEY, savedEnvelope());
        setNotice("Draft saved on this device.");
      } catch {
        setError("This device could not save your draft. Your work is still open. Download a working copy to keep it.");
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [draft, keep, ready]);

  useEffect(() => {
    if (pendingFocus.current) { pendingFocus.current = false; heading.current?.focus(); }
    if (rowFocus.current) {
      const target = document.getElementById(rowFocus.current);
      rowFocus.current = null;
      if (target) target.focus(); else heading.current?.focus();
    }
  }, [current, draft]);

  function replace(next: StructuralDraft) { draftNow.current = next; setDraft(next); }
  function savedEnvelope() { return JSON.stringify({ keep: true, draft: draftNow.current, ...(counted.current ? { counted: true } : {}) }); }
  function resetCount() { counted.current = false; setCountGoals([]); setCountDecision(""); }
  /** Fire-and-forget: adds one to the anonymous total the first time this review is finished. */
  function countFinishedReview() {
    if (counted.current) return;
    counted.current = true;
    sendEquityReviewCompletion({ tool: "structural", goals: countGoals, decisionType: countDecision || undefined });
    if (savingAllowed.current) { try { localStorage.setItem(STRUCTURAL_DRAFT_KEY, savedEnvelope()); } catch { /* The draft save effect reports storage problems. */ } }
  }
  function update(id: StructuralStepId, key: string, value: StructuralValue) {
    const inputTexts = typeof value === "string" ? [value] : value.flatMap(item => typeof item === "string" ? [item] : Object.values(item));
    if (inputTexts.some(input => input.length > STRUCTURAL_FIELD_MAX_LENGTH || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(input))) {
      setError("This entry could not be added. Use plain text with no more than 6,000 characters per field. Your earlier answers are unchanged.");
      return;
    }
    const definition = STRUCTURAL_STEPS.find(step => step.id === id)?.fields.find(field => field.k === key);
    if (definition?.t === "date" && typeof value === "string" && value !== "" && !isStructuralCalendarDate(value)) {
      setError("Use a valid review date. Your earlier answers are unchanged.");
      return;
    }
    const next = { ...draftNow.current, d: { ...draftNow.current.d, [id]: { ...draftNow.current.d[id], [key]: value } }, review: { privacyChecked: false, ownerConfirmed: false } };
    if (new TextEncoder().encode(JSON.stringify(next)).byteLength > STRUCTURAL_DRAFT_MAX_BYTES) {
      setError("This review has reached its size limit. Download a working copy before shortening long entries or starting a separate review.");
      return;
    }
    replace(next); setError("");
  }
  function go(index: number) {
    if (index === current) { pendingFocus.current = false; heading.current?.focus(); return; }
    pendingFocus.current = true; setCurrent(index);
  }
  function setSaving(enabled: boolean) {
    generation.current++; savingAllowed.current = enabled; setKeep(enabled); setError("");
    if (!enabled) {
      try { localStorage.removeItem(STRUCTURAL_DRAFT_KEY); setNotice("Draft saving is off. Download a working copy if you want to keep this work."); }
      catch { setError("This device could not remove the saved draft. Your open work is unchanged. Clear this site's saved data through your browser if needed."); }
    }
  }
  async function importCopy(file: File) {
    const sequence = ++importSequence.current;
    setError("");
    try {
      if (file.size > STRUCTURAL_IMPORT_LIMIT) throw new Error("Too large");
      const content = await file.text();
      if (new TextEncoder().encode(content).byteLength > STRUCTURAL_IMPORT_LIMIT) throw new Error("Too large");
      const parsed = parseStructuralDraft(JSON.parse(content));
      if (sequence !== importSequence.current) return;
      replace(parsed); resetCount(); go(0); setNotice("Working copy opened. Your answers are ready to continue.");
    } catch {
      if (sequence === importSequence.current) setError(`This working copy could not be opened. Use a structural review working copy under ${STRUCTURAL_IMPORT_LIMIT / 1_000_000} MB. Your current answers have not been replaced.`);
    }
  }
  function startOver() {
    if (!window.confirm("Start a new structural review? This will clear the current answers and the draft saved by this tool on this device. Download a working copy first if you want to keep them.")) return;
    generation.current++; importSequence.current++; savingAllowed.current = false; setKeep(false);
    replace(freshStructuralDraft()); resetCount(); go(0); setError("");
    try { localStorage.removeItem(STRUCTURAL_DRAFT_KEY); setNotice("A new review is open. Draft saving is off."); }
    catch { setError("A new review is open, but this device could not remove the older saved draft. Clear this site's saved data through your browser if needed."); }
  }
  async function exportReport(format: "html" | "word" | "copy" | "share" | "notes") {
    setBusy(true); setError("");
    try {
      const snapshot = parseStructuralDraft(draftNow.current);
      if (format === "notes") {
        download(new Blob([structuralRecordText(snapshot)], { type: "text/plain;charset=utf-8" }), "one-dsd-structural-review-notes.txt");
        setNotice("Analysis notes download requested. You can upload this file in the Consultant Workspace.");
      } else if (format === "word") {
        const { structuralWordBlob } = await import("@/lib/structural-review/word-report");
        download(await structuralWordBlob(snapshot), "One-DSD-Structural-Review.docx");
        countFinishedReview();
        setNotice("Word report download requested. Check your downloads.");
      } else if (format === "copy") {
        download(new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" }), "One-DSD-Structural-Review-Working-Copy.json");
        setNotice("Working copy download requested. Keep it to reopen and continue editing.");
      } else {
        const report = new Blob([structuralReportHtml(snapshot)], { type: "text/html" });
        const file = new File([report], "One-DSD-Structural-Review.html", { type: "text/html" });
        if (format === "share" && navigator.canShare?.({ files: [file] }) && navigator.share) {
          try { await navigator.share({ files: [file], title: "One DSD structural review" }); countFinishedReview(); setNotice("Report shared through your chosen application."); return; }
          catch (failure) { if (failure instanceof DOMException && failure.name === "AbortError") { setNotice("Sharing cancelled. Your work is unchanged."); return; } }
        }
        download(report, file.name);
        countFinishedReview();
        setNotice(format === "share" ? "Report download requested. Attach the downloaded file to your message. No public link was created." : "Readable report download requested. Check your downloads.");
      }
    } catch { setError("The report could not be prepared. Your work is still open. Try again or download a working copy."); }
    finally { setBusy(false); }
  }
  function printSummary() { go(SUMMARY); countFinishedReview(); setTimeout(() => window.print(), 100); }

  const step = STRUCTURAL_STEPS[current];
  const completed = STRUCTURAL_STEPS.filter(item => structuralProgress(draft, item.id) === "done").length;
  const started = STRUCTURAL_STEPS.filter(item => structuralProgress(draft, item.id) !== "none").length;
  const warning = structuralRouteWarning(draft);

  function field(id: StructuralStepId, item: StructuralField) {
    const control = `structural-${id}-${item.k}`;
    const value = draft.d[id][item.k];
    const help = item.h ? `${control}-help` : undefined;
    if (item.t === "chips" || item.t === "radio") {
      return <fieldset className={styles.field} key={item.k} aria-describedby={help}><legend>{item.l}{item.optional ? " (optional)" : ""}</legend>{item.h && <p id={help} className={styles.help}>{item.h}</p>}<div className={item.t === "chips" ? styles.choices : styles.radios}>{item.opts?.map((option, index) => {
        const key = typeof option === "string" ? option : option[0];
        const label = typeof option === "string" ? option : option[1];
        return <label key={key} htmlFor={`${control}-${index}`}><input id={`${control}-${index}`} name={control} type={item.t === "chips" ? "checkbox" : "radio"} checked={item.t === "chips" ? choices(value).includes(key) : text(value) === key} onChange={event => update(id, item.k, item.t === "chips" ? (event.target.checked ? [...choices(value), key] : choices(value).filter(selected => selected !== key)) : key)} />{label}</label>;
      })}</div></fieldset>;
    }
    return <div className={styles.field} key={item.k}><label htmlFor={control}>{item.l}{item.optional ? " (optional)" : ""}</label>{item.h && <p id={help} className={styles.help}>{item.h}</p>}{item.t === "area" ? <textarea id={control} aria-describedby={help} maxLength={STRUCTURAL_FIELD_MAX_LENGTH} rows={4} value={text(value)} onChange={event => update(id, item.k, event.target.value)} /> : <input id={control} aria-describedby={help} type={item.t === "date" ? "date" : "text"} min={item.t === "date" ? "0001-01-01" : undefined} max={item.t === "date" ? "9999-12-31" : undefined} maxLength={STRUCTURAL_FIELD_MAX_LENGTH} value={text(value)} onChange={event => update(id, item.k, event.target.value)} />}</div>;
  }

  return <div className={styles.workspace}>
    <section className={styles.controls} aria-label="Keep and share your review">
      <label className={styles.consent}><input type="checkbox" checked={keep} disabled={!ready} onChange={event => setSaving(event.target.checked)} />Keep a draft on this device</label>
      <p className={styles.help}>If you keep a draft, anyone using this browser profile may be able to open it. This tool does not send your answers for analysis. Downloaded reports contain your entries, and Share report can pass a report to an application you choose. Check each copy before sharing.</p>
      <div className={styles.actions}><label className={styles.fileLabel}>Open a working copy<input type="file" accept=".json,application/json" onChange={event => { const file = event.target.files?.[0]; if (file) void importCopy(file); event.target.value = ""; }} /></label><button disabled={busy} onClick={() => void exportReport("copy")}>Download working copy</button><button onClick={startOver}>Start over</button></div>
      <p role="status" className={styles.status}>{notice || "Your work is open. Draft saving is off until you choose it."}</p>{error && <p role="alert" className={styles.error}>{error}</p>}
    </section>
    <div className={styles.layout}>
      <nav className={styles.navigation} aria-label="Structural review steps"><p className={styles.progress}>{completed} of 8 steps answered · {started} started</p><p className={styles.help}>Progress shows answers entered, not the strength or approval of your analysis.</p><ol>{STRUCTURAL_STEPS.map((item, index) => { const state = structuralProgress(draft, item.id); return <li key={item.id}><button aria-current={current === index ? "step" : undefined} onClick={() => go(index)}><span>{index + 1}. {item.title}</span>{" "}<small>{state === "done" ? "Answered" : state === "part" ? "Started" : "Not started"}</small></button></li>; })}<li><button aria-current={current === SUMMARY ? "step" : undefined} onClick={() => go(SUMMARY)}>Review and share</button></li></ol></nav>
      <div className={styles.main}>
        {warning && <p className={styles.warning} role="note">{warning}</p>}
        <h2 ref={heading} tabIndex={-1}>{step ? step.title : "Review and share"}</h2>
        {step ? <>
          <p className={styles.lead}>{step.lead}</p>
          <details className={styles.guidance}><summary>Guidance and a practice example</summary><p>{STRUCTURAL_GUIDANCE[step.id].why}</p><ul>{STRUCTURAL_GUIDANCE[step.id].do.map(item => <li key={item}>{item}</li>)}</ul>{STRUCTURAL_GUIDANCE[step.id].flag && <p>{STRUCTURAL_GUIDANCE[step.id].flag}</p>}<p className={styles.example}>{step.example}</p></details>
          {step.table && <section aria-label={step.id === "points" ? "Process stages" : "Rules and requirements"} className={styles.rowSection}>
            {(draft.d[step.id][step.table.k] as Record<string, string>[]).map((row, index) => <fieldset key={index} className={styles.row}><legend>{step.id === "points" ? "Stage" : "Item"} {index + 1}</legend><div className={styles.rowFields}>{step.table!.cols.map(column => { const id = `structural-${step.id}-row-${index}-${column.k}`; return <div className={styles.field} key={column.k}><label htmlFor={id}>{column.l}</label>{column.t === "area" ? <textarea id={id} rows={3} maxLength={6000} value={row[column.k]} onChange={event => { const rows = [...draft.d[step.id][step.table!.k] as Record<string, string>[]]; rows[index] = { ...row, [column.k]: event.target.value }; update(step.id, step.table!.k, rows); }} /> : column.t === "sel" ? <select id={id} value={row[column.k]} onChange={event => { const rows = [...draft.d[step.id][step.table!.k] as Record<string, string>[]]; rows[index] = { ...row, [column.k]: event.target.value }; update(step.id, step.table!.k, rows); }}>{column.opts?.map(option => <option key={option}>{option}</option>)}</select> : <input id={id} maxLength={6000} value={row[column.k]} onChange={event => { const rows = [...draft.d[step.id][step.table!.k] as Record<string, string>[]]; rows[index] = { ...row, [column.k]: event.target.value }; update(step.id, step.table!.k, rows); }} />}</div>; })}</div><button id={`structural-${step.id}-remove-${index}`} onClick={() => { const rows = [...draft.d[step.id][step.table!.k] as Record<string, string>[]]; rows.splice(index, 1); rowFocus.current = rows.length ? `structural-${step.id}-row-${Math.min(index, rows.length - 1)}-${step.table!.cols[0].k}` : `structural-${step.id}-add`; update(step.id, step.table!.k, rows); }}>Remove {step.id === "points" ? "stage" : "item"} {index + 1}</button></fieldset>)}
            <button id={`structural-${step.id}-add`} disabled={(draft.d[step.id][step.table.k] as Record<string, string>[]).length >= STRUCTURAL_TABLE_MAX_ROWS} onClick={() => { const rows = [...draft.d[step.id][step.table!.k] as Record<string, string>[]]; rowFocus.current = `structural-${step.id}-row-${rows.length}-${step.table!.cols[0].k}`; update(step.id, step.table!.k, [...rows, { ...step.table!.blank }]); }}>{step.table.label}</button>{(draft.d[step.id][step.table.k] as Record<string, string>[]).length >= STRUCTURAL_TABLE_MAX_ROWS && <p className={styles.help}>This review can include up to {STRUCTURAL_TABLE_MAX_ROWS} rows. Continue a separate review if you need more.</p>}
          </section>}
          {step.fields.map(item => field(step.id, item))}
        </> : <section className={styles.summary} aria-label="Your structural review">
          <p className={styles.lead}>Read the full record, check what remains unanswered, and decide what to share. An answered checklist is a preparation aid, not an approval or a finding that inequity has been established.</p>
          <h3>Before you share</h3><ul className={styles.checks}>{structuralChecks(draft).map(check => <li key={check.id}><strong>{check.met ? "Answered" : "Needs attention"}:</strong> {check.label}</li>)}</ul>
          <label className={styles.consent}><input type="checkbox" checked={draft.review.privacyChecked} onChange={event => replace({ ...draftNow.current, review: { ...draftNow.current.review, privacyChecked: event.target.checked } })} />I have checked this record for personal, client, complaint, and confidential information before sharing.</label>
          <label className={styles.consent}><input type="checkbox" checked={draft.review.ownerConfirmed} onChange={event => replace({ ...draftNow.current, review: { ...draftNow.current.review, ownerConfirmed: event.target.checked } })} />The process owner has confirmed the proposed next steps.</label>
          {/* Shown only while One DSD can keep the anonymous count; see PRACTICE_COUNTERS_ENABLED. */}
          {PRACTICE_COUNTERS_ENABLED ? <>
          <fieldset className={styles.field}><legend>Which equity goals does this review connect to? (optional)</legend><p className={styles.help}>Your choices here are added to the count. They are not saved with your answers.</p><div className={styles.choices}>{COUNT_GOALS.map(goal => <label key={goal.number} htmlFor={`structural-count-goal-${goal.number}`}><input id={`structural-count-goal-${goal.number}`} type="checkbox" checked={countGoals.includes(goal.number)} onChange={event => setCountGoals(current => event.target.checked ? [...current.filter(item => item !== goal.number), goal.number] : current.filter(item => item !== goal.number))} />Goal {goal.number}: {goal.title}</label>)}</div></fieldset>
          <div className={styles.field}><label htmlFor="structural-count-decision">What kind of decision is this? (optional)</label><select id="structural-count-decision" value={countDecision} onChange={event => setCountDecision(event.target.value as DecisionType | "")}><option value="">Choose one</option>{DECISION_TYPES.map(type => <option key={type} value={type}>{DECISION_TYPE_LABELS[type]}</option>)}</select></div>
          <p className={styles.help}>{EQUITY_REVIEW_COUNT_NOTICE} Downloading, sharing or printing the report finishes the review.</p>
          </> : null}
          <div className={styles.actions}><button disabled={busy} onClick={() => void exportReport("html")}>Download readable report</button><button disabled={busy} onClick={() => void exportReport("word")}>Download Word report</button><button disabled={busy} onClick={() => void exportReport("share")}>Share report</button><button onClick={printSummary}>Print report</button></div>
          <p className={styles.help}>A working copy keeps your answers editable. Word and readable reports can be attached to a message. Consultant support is optional; preparing a report does not send it to the consultant.</p>
          <details className={styles.guidance}><summary>Continue in the Consultant Workspace</summary><p>If you have access to the <Link href="/consultant/analysis">Consultant Workspace</Link>, review its processing notice before uploading analysis notes as supporting material. Check the evidence and remove confidential information first. Downloading notes here does not submit them or authorize a recommendation.</p><button disabled={busy} onClick={() => void exportReport("notes")}>Download analysis notes</button></details>
          {STRUCTURAL_STEPS.map(item => <section key={item.id} className={styles.record}><h3>{item.title}</h3>{item.fields.map(question => { const value = draft.d[item.id][question.k]; const answer = question.t === "radio" ? question.opts?.find(option => Array.isArray(option) && option[0] === text(value)) : null; return <div key={question.k}><h4>{question.l}</h4><p>{Array.isArray(answer) ? answer[1] : typeof value === "string" ? value.trim() || "Not answered" : choices(value).join(", ") || "Not answered"}</p></div>; })}{item.table && (draft.d[item.id][item.table.k] as Record<string, string>[]).map((row, index) => <div className={styles.recordRow} key={index}><h4>{item.id === "points" ? "Stage" : "Item"} {index + 1}</h4><dl>{item.table!.cols.map(column => <div key={column.k}><dt>{column.l}</dt><dd>{row[column.k]?.trim() || "Not answered"}</dd></div>)}</dl></div>)}</section>)}
        </section>}
        <div className={styles.pager}><button disabled={current === 0} onClick={() => go(current - 1)}>Previous step</button>{current < SUMMARY && <button className={styles.primary} onClick={() => go(current + 1)}>{current === SUMMARY - 1 ? "Review and share" : "Next step"}</button>}</div>
      </div>
    </div>
  </div>;
}
