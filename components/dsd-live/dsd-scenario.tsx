"use client";
import { useEffect, useId, useState } from "react";
import type { PracticeGuide } from "@/lib/dsd-live/dsd-practice/guides";
export function DsdScenario({ guide }: { guide: PracticeGuide }) {
  const id = useId();
  const [ready,setReady]=useState(false);
  useEffect(()=>setReady(true),[]);
  const [selected, setSelected] = useState<number | null>(null);
  const [reviewed, setReviewed] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  return <section className="dsd-scenario" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>Consider a situation</h2><p>{guide.scenario}</p>
    <fieldset disabled={!ready}><legend>Which approach would you take, and why?</legend>{guide.choices.map((choice, i) => <label key={choice.text} className="dsd-choice"><input type="radio" name={id} checked={selected === i} onChange={() => { setSelected(i); setReviewed(null); }} /><span>{choice.text}</span></label>)}</fieldset>
    <button className="button" disabled={selected === null} onClick={() => setReviewed(selected)}>Review this choice</button>
    <div role="status">{reviewed !== null ? <p className="dsd-feedback">{guide.choices[reviewed].feedback}</p> : null}</div>
    <h2>A next step to try</h2><p>{guide.output}</p><p><strong>What would help you learn?</strong> {guide.check}</p>
    <label htmlFor={`${id}-notes`}>Your draft or next step</label><textarea id={`${id}-notes`} rows={6} maxLength={6000} value={notes} onChange={e => { setNotes(e.target.value); setStatus(""); }} />
    <p className="meta">These optional notes are not submitted or saved. Copy them before leaving this page. Use an invented example; leave out names, case details, medical information and personnel records.</p>
    <button className="button secondary" disabled={!notes.trim()} onClick={async () => { try { await navigator.clipboard.writeText(`${guide.title}\n\n${notes}\n\nReview question: ${guide.check}`); setStatus("Copied. Paste your draft somewhere you choose to keep it."); } catch { setStatus("Copy is unavailable. Your notes are still here; select and copy them manually before leaving."); } }}>Copy my draft</button><p role="status">{status}</p>
  </section>;
}
