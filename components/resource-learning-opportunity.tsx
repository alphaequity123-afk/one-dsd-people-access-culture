"use client";
import { useEffect, useId, useState } from "react";
import { AskFeedbackPanel } from "@/components/ask-feedback-panel";
import { agencyHref, agencyZoneEnabled } from "@/lib/program/agency-zone";
import { ASK_REVIEW_DRAFT_KEY, practiceReviewDraft } from "@/lib/learning/practice-review";

/** A practical companion to the resource; the source itself stays unchanged. */
export function ResourceLearningOpportunity({ kind, resourceId, title }: { kind: "resource" | "reading" | "podcast"; resourceId: string; title: string }) {
  const id = useId();
  const key = `${kind}:${resourceId}`;
  const restoreKey = `one-dhs-resource-learning-v1:${key}`;
  const [task, setTask] = useState(""); const [step, setStep] = useState(""); const [error, setError] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { const raw = sessionStorage.getItem(restoreKey); if (!raw) return; const value = JSON.parse(raw) as { task?: unknown; step?: unknown }; if (typeof value.task === "string" && typeof value.step === "string" && value.task.length <= 2000 && value.step.length <= 2000) { setTask(value.task); setStep(value.step); } sessionStorage.removeItem(restoreKey); } catch { /* The exercise remains available. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [restoreKey]);
  if (!agencyZoneEnabled || !/^[a-z0-9][a-z0-9-]{0,199}$/i.test(resourceId)) return null;
  function review() {
    if (!task.trim() || !step.trim()) { setError("Add your task and the step you want to consider."); return; }
    const draft = practiceReviewDraft(title, `Resource: ${title}\nTask or decision: ${task}\nPossible next step: ${step}`);
    const target = new URL(agencyHref(`/ask?${new URLSearchParams({ legacyKind: kind, legacyId: resourceId })}`), window.location.href);
    if (!draft || target.origin !== window.location.origin) { setError("Keep this page open and copy your notes into Ask."); return; }
    try { sessionStorage.setItem(restoreKey, JSON.stringify({ task, step })); sessionStorage.setItem(ASK_REVIEW_DRAFT_KEY, JSON.stringify(draft)); }
    catch { setError("Your browser could not carry your notes to Ask. Keep this page open and copy them into Ask."); return; }
    window.location.assign(target.pathname + target.search);
  }
  return <section className="my-6 rounded-lg border border-line p-5 print:hidden" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`} className="text-xl font-semibold">Try this in your work</h2>
    <p className="mt-2">Consider how this resource could inform a task or decision, then review your next step with Ask.</p>
    <AskFeedbackPanel practiceId={key} kind="resource" />
    <div className="mt-4 space-y-3">
      <label className="block font-semibold" htmlFor={`${id}-task`}>Your task or decision</label>
      <textarea className="w-full rounded-lg border border-line p-3" id={`${id}-task`} rows={3} maxLength={2000} value={task} onChange={event => setTask(event.target.value)} />
      <label className="block font-semibold" htmlFor={`${id}-step`}>What would you do next?</label>
      <textarea className="w-full rounded-lg border border-line p-3" id={`${id}-step`} rows={3} maxLength={2000} value={step} onChange={event => setStep(event.target.value)} />
      <p className="text-sm">Leave out names, case details and other confidential information. You can review your notes before submitting them.</p>
      {error ? <p role="alert">{error}</p> : null}
      <button type="button" className="btn btn--light" onClick={review}>Review with Ask</button>
    </div>
  </section>;
}
