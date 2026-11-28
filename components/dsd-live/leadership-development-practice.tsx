"use client";
import type { AskFeedback } from "@/lib/dsd-live/learning/applied-learning";
import { AskFeedbackContent } from "./ask-feedback-content";
import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import type { DevelopmentModule } from "@/lib/dsd-live/leadership/development/modules";
import { RESPONSIBILITIES } from "@/lib/dsd-live/leadership/development/framework";
import { ASK_REVIEW_DRAFT_KEY, askFeedbackKey, readAskFeedback } from "@/lib/dsd-live/learning/applied-learning";

type Draft = { choice: number | null; revealed: boolean; response: string; fields: string[]; review: string; role: string };
const emptyDraft = (m: DevelopmentModule): Draft => ({ choice: null, revealed: false, response: "", fields: m.tool.fields.map(() => ""), review: "", role: "emerging" });
export function LeadershipDevelopmentPractice({ module: m }: { module: DevelopmentModule }) {
  const router = useRouter(); const uid = useId();
  const key = `leadership-development:${m.id}:v1`;
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(m));
  const [ready, setReady] = useState(false); const [notice, setNotice] = useState("");
  const [feedback, setFeedback] = useState<AskFeedback | null>(null); const [exporting, setExporting] = useState(false);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const d = JSON.parse(saved) as Partial<Draft>;
        if (Array.isArray(d.fields) && d.fields.length === m.tool.fields.length && d.fields.every(f => typeof f === "string" && f.length <= 5000) && typeof d.response === "string" && d.response.length <= 5000 && typeof d.review === "string" && d.review.length <= 5000 && RESPONSIBILITIES.some(r => r.id === d.role) && (d.choice === null || (typeof d.choice === "number" && Number.isInteger(d.choice) && d.choice >= 0 && d.choice < m.choices.length)) && typeof d.revealed === "boolean") setDraft(d as Draft);
      }
      const raw = sessionStorage.getItem(askFeedbackKey("practice", `leadership:${m.id}`));
      if (raw) { const f = readAskFeedback(raw); if (f) setFeedback(f); }
    } catch { setNotice("Your earlier draft could not be opened. You can continue here or download your work."); }
    setReady(true);
  }, [key, m.id, m.tool.fields.length, m.choices.length]);
  useEffect(() => {
    if (!ready) return;
    try { sessionStorage.setItem(key, JSON.stringify(draft)); }
    catch { setNotice("This browser cannot retain the draft for your return. Download your work before leaving."); }
  }, [draft, key, ready]);
  const update = (change: Partial<Draft>) => setDraft(d => ({ ...d, ...change }));
  const role = RESPONSIBILITIES.find(r => r.id === draft.role)!;
  const workText = () => [m.title, m.objective, `Responsibility: ${role.title}`, "My revised response", draft.response, ...m.tool.fields.flatMap((f, i) => [f, draft.fields[i] || "Not yet drafted"]), "Return to the effects", draft.review || "Not yet reviewed", "Review question", m.review].join("\n\n");
  function download(content: Blob, name: string) { const href = URL.createObjectURL(content); const a = document.createElement("a"); a.href = href; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(href), 2000); }
  async function downloadWord() {
    setExporting(true);
    try {
      const { Document, Packer, Paragraph, HeadingLevel, TextRun } = await import("docx");
      const body = (text: string) => new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 22, color: "000000" })], spacing: { after: 100 } });
      const heading = (text: string) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, font: "Arial", size: 24, bold: true, color: "000000" })], keepNext: true, spacing: { before: 160, after: 60 } });
      const doc = new Document({ title: m.tool.title, description: "Personal leadership practice draft", creator: "People, Access and Culture", styles: { default: { document: { run: { font: "Arial", size: 22, color: "000000", language: {value:"en-US"} } } } }, sections: [{ children: [new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({text:m.title.replace(/[^\p{L}\p{N}\s]/gu,""),font:"Arial",size:32,bold:true,color:"000000"})],spacing:{after:160} }), body(m.objective), body(`Responsibility: ${role.title}`), heading("My revised response"), body(draft.response || "Not yet drafted"), ...m.tool.fields.flatMap((field,i)=>[heading(field),body(draft.fields[i] || "Not yet drafted")]), heading("Return to the effects"), body(draft.review || "Not yet reviewed"), heading("Review question"), body(m.review)] }] });
      download(await Packer.toBlob(doc), `${m.id}-practice.docx`); setNotice("Word draft downloaded. It was created in your browser.");
    } catch { setNotice("Word export could not finish. Download the text draft or print this page instead."); }
    finally { setExporting(false); }
  }
  function askForReview() {
    if (!draft.response.trim() && !draft.fields.some(f => f.trim())) { setNotice("Write a response or part of your work tool before asking for feedback."); return; }
    try {
      sessionStorage.setItem(ASK_REVIEW_DRAFT_KEY, JSON.stringify({ kind: "practice-review-v1", question: `Help me review my proposed application of "${m.title}". What assumptions, perspectives or tradeoffs should I examine, and what would strengthen the next step?`, attachment: { title: m.tool.title, text: workText(), note: "A learner's draft, not an approved decision or assessment result." } }));
      router.push(`/ask?leadershipModule=${encodeURIComponent(m.id)}`);
    } catch { setNotice("This browser could not carry your draft to Ask. Download or copy the parts you want to discuss."); }
  }
  function clear() {
    setDraft(emptyDraft(m)); setFeedback(null);
    try { sessionStorage.removeItem(key); sessionStorage.removeItem(askFeedbackKey("practice", `leadership:${m.id}`)); } catch { /* in-memory draft still cleared */ }
    setNotice("This module's draft and returned feedback have been cleared from this tab.");
  }
  return <div>
    <section id="practice"><h2>Try the decision</h2><p className="development-kicker">Fictional learning situation</p><p>{m.case}</p><p className="development-note">{m.dsd}</p>
      <fieldset><legend>{m.question}</legend>{m.choices.map((c, i) => <label className="development-choice" key={c.text}><input type="radio" name={`${uid}-choice`} checked={draft.choice === i} onChange={() => update({ choice: i })} /><span>{c.text}</span></label>)}</fieldset>
      {draft.choice !== null ? <div className="development-feedback" role="status"><h3>Consider this response</h3><p>{m.choices[draft.choice].feedback}</p><p>You can compare another response, too.</p></div> : null}
      <button type="button" onClick={() => update({ revealed: !draft.revealed })} aria-expanded={draft.revealed} aria-controls={`${uid}-perspective`}>{draft.revealed ? "Hide the additional perspective" : "Consider another perspective"}</button>
      <div id={`${uid}-perspective`} hidden={!draft.revealed}><h3>What changes your judgment?</h3><p>{m.reveal}</p></div>
      <label htmlFor={`${uid}-response`}>Rehearse and revise your response</label><p>{m.rehearsal}</p><textarea id={`${uid}-response`} maxLength={5000} value={draft.response} onChange={e => update({ response: e.target.value })} />
    </section>
    <section className="development-work" id="work-tool"><h2>{m.tool.title}</h2><p>Choose an example without identifying details. Your draft stays in this browser tab; download a copy to keep it. If you choose feedback from Ask, you can review your draft before sending it.</p>
      <label htmlFor={`${uid}-role`}>Apply this at your level of responsibility</label><select id={`${uid}-role`} value={draft.role} onChange={e => update({ role: e.target.value })}>{RESPONSIBILITIES.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}</select><p>{role.task}</p>
      {draft.role === "program" || draft.role === "executive" ? <p className="development-note"><strong>Extend the work:</strong> {m.advanced}</p> : null}
      <details><summary>See an example</summary><p>{m.tool.example}</p></details>
      {m.tool.fields.map((field, i) => <div key={field}><label htmlFor={`${uid}-field-${i}`}>{field}</label><textarea id={`${uid}-field-${i}`} maxLength={5000} value={draft.fields[i]} onChange={e => update({ fields: draft.fields.map((value, j) => i === j ? e.target.value : value) })} /></div>)}
      <h3>Use it in your work</h3><p>{m.transfer}</p><p>Confirm the required authority and support before changing an actual process.</p>
      <label htmlFor={`${uid}-review`}>Return to what happened</label><p>{m.review}</p><textarea id={`${uid}-review`} maxLength={5000} value={draft.review} onChange={e => update({ review: e.target.value })} />
      {feedback ? <details open><summary>Feedback brought back from Ask</summary><AskFeedbackContent feedback={feedback} /><p>Review suggestions against the relevant evidence and responsible decision process before acting.</p></details> : null}
      <div className="development-actions"><button type="button" onClick={askForReview}>Ask for feedback on this draft</button><button type="button" onClick={downloadWord} disabled={exporting}>{exporting ? "Preparing Word draft…" : "Download Word draft"}</button><button type="button" onClick={() => download(new Blob([workText()], {type:"text/plain;charset=utf-8"}), `${m.id}-practice.txt`)}>Download text draft</button><button type="button" onClick={clear}>Clear this module's draft</button></div>
      <p role="status">{notice}</p>
    </section>
  </div>;
}
