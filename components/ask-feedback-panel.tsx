"use client";
import { useEffect, useState } from "react";
import Link from "@/components/app-link";
import { askFeedbackKey, readAskFeedback, type AskFeedback } from "@/lib/learning/practice-review";
export function AskFeedbackPanel({ practiceId, kind = "practice" }: { practiceId: string; kind?: "practice" | "community" | "resource" }) {
  const [feedback, setFeedback] = useState<AskFeedback | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { const key = askFeedbackKey(kind, practiceId); const raw = sessionStorage.getItem(key); if (!raw) return; const item = readAskFeedback(raw); if (item) { setFeedback(item); sessionStorage.removeItem(key); } } catch { /* Practice remains available. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [practiceId, kind]);
  if (!feedback) return null;
  return <section className="mt-5 rounded-lg border border-line p-4" aria-label="Feedback from Ask"><h3 className="text-lg font-bold">Feedback from Ask</h3><p className="mt-2 whitespace-pre-wrap">{feedback.text}</p>{feedback.sources.length ? <ol className="mt-3 list-decimal pl-5">{feedback.sources.map(source => <li key={`${source.n}-${source.slug}`} value={source.n}><Link href={`/r/${source.slug}`}>{source.title}</Link></li>)}</ol> : null}</section>;
}
