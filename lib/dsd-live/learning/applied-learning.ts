export const ASK_REVIEW_DRAFT_KEY = "one-dhs-ask-review-draft-v1";
export type AppliedLearningDraft = { task: string; perspectives: string; action: string };

/** The caller gives this to the staff member for review before it is submitted. */
export function appliedLearningQuestion(title: string, draft: AppliedLearningDraft): string | null {
  const task = draft.task.trim(); const action = draft.action.trim();
  if (!task || !action) return null;
  const name = title.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 160);
  return [
    `Help me review how I might apply the resource "${name}" to my work.`,
    `My task or decision: ${task}`,
    ...(draft.perspectives.trim() ? [`Perspectives or access needs to consider: ${draft.perspectives.trim()}`] : []),
    `My proposed next step: ${action}`,
    "What is promising, what assumptions or missing perspectives should I check, and how could I strengthen this approach? Distinguish the resource's guidance from suggestions and requirements that need confirmation.",
  ].join("\n\n");
}

export type PracticeReviewDraft = { kind: "practice-review-v1"; question: string; attachment: { title: string; text: string; note: string } };
export function readAskReviewDraft(raw: string): { question: string; attachment?: PracticeReviewDraft["attachment"] } | null {
  if (raw.startsWith("{")) {
    try {
      const value = JSON.parse(raw) as Partial<PracticeReviewDraft>;
      const a = value.attachment;
      if (value.kind === "practice-review-v1" && typeof value.question === "string" && value.question.trim() && value.question.length <= 2000 && a && typeof a.title === "string" && a.title.trim() && a.title.length <= 300 && typeof a.text === "string" && a.text.trim() && a.text.length <= 50000 && typeof a.note === "string" && a.note.length <= 2000) return { question: value.question, attachment: a };
    } catch { return null; }
    return null;
  }
  return raw.trim() && raw.length <= 2000 ? { question: raw } : null;
}

export const MAX_ASK_FEEDBACK_SOURCES = 12;
export type AskFeedback = { text: string; sources: Array<{ n: number; title: string; slug: string; sourceUrl?: string }> };
export const askFeedbackKey = (kind: "practice" | "resource" | "community", id: string) => `one-dhs-ask-feedback-v1:${kind}:${id}`;
export function readAskFeedback(raw: string): AskFeedback | null {
  try {
    const value = JSON.parse(raw) as Partial<AskFeedback>;
    if (typeof value.text !== "string" || !value.text.trim() || value.text.length > 12000 || !Array.isArray(value.sources) || value.sources.length > MAX_ASK_FEEDBACK_SOURCES) return null;
    if (!value.sources.every(item => item && Number.isInteger(item.n) && item.n > 0 && typeof item.title === "string" && item.title.length <= 600 && (item.sourceUrl === undefined || (typeof item.sourceUrl === "string" && item.sourceUrl.length <= 2048)) && typeof item.slug === "string" && /^[a-z0-9][a-z0-9-]{0,199}$/i.test(item.slug))) return null;
    return { text: value.text, sources: value.sources };
  } catch { return null; }
}
