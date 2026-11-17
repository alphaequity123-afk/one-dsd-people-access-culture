"use client";
import { useId, useState } from "react";
import { AskFeedbackPanel } from "@/components/ask-feedback-panel";
import { agencyHref, agencyZoneEnabled } from "@/lib/program/agency-zone";
import { ASK_REVIEW_DRAFT_KEY, practiceReturnKey, practiceReviewDraft } from "@/lib/learning/practice-review";

export function AskReviewHandoff({ practiceId, title, notes, hasNotes, returnState }: { practiceId: string; title: string; notes: string; hasNotes: boolean; returnState: unknown }) {
  const id = useId(); const [review, setReview] = useState<string | null>(null); const [error, setError] = useState("");
  if (!agencyZoneEnabled) return null;
  function openAsk() {
    const draft = practiceReviewDraft(title, review ?? "");
    if (!draft) { setError("Choose nonempty notes of 50,000 characters or fewer."); return; }
    const current = new URL(window.location.href); const query = new URLSearchParams({ path: practiceId });
    for (const key of ["learningPath", "learningFamily"] as const) {
      const value = current.searchParams.get(key);
      if (value && /^[a-z0-9][a-z0-9-]{0,79}$/i.test(value)) query.set(key, value);
    }
    const target = new URL(agencyHref(`/ask?${query.toString()}`), window.location.href);
    if (target.origin !== window.location.origin) { setError("This view cannot carry notes to Ask. Copy the notes into Ask instead."); return; }
    const returnKey = practiceReturnKey(practiceId);
    try {
      sessionStorage.setItem(returnKey, JSON.stringify(returnState));
      sessionStorage.setItem(ASK_REVIEW_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      try { sessionStorage.removeItem(returnKey); } catch { /* Storage may be unavailable. */ }
      setError("This browser could not carry your notes to Ask. Keep this page open and copy them into Ask instead."); return;
    }
    window.location.assign(target.pathname + target.search + target.hash);
  }
  return <section className="mt-5 border-t border-line pt-5" aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`} className="text-lg font-bold">Review your work with Ask</h3>
    <AskFeedbackPanel practiceId={practiceId} />
    <p className="mt-2 text-sm">Choose which notes to review. Your practice stays in this browser tab so you can return to it.</p>
    <button type="button" className="btn btn--light mt-3" disabled={!hasNotes} onClick={() => { setReview(notes); setError(""); }}>Prepare notes for Ask</button>
    {review !== null ? <div className="mt-3 space-y-3">
      <label htmlFor={`${id}-notes`} className="block font-bold">Notes to review</label>
      <textarea id={`${id}-notes`} className="w-full rounded-lg border border-line p-3" rows={10} value={review} onChange={event => setReview(event.target.value)} />
      <p className="text-sm">Leave out names, case details and other confidential information. You can edit the notes here and again in Ask before submitting.</p>
      <p className="text-sm">{review.length.toLocaleString()} of 50,000 characters</p>
      {error ? <p role="alert" className="text-sm font-bold">{error}</p> : null}
      <button type="button" className="btn btn--primary" onClick={openAsk}>Open in Ask</button>
    </div> : null}
  </section>;
}
