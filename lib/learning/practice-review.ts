export const ASK_REVIEW_DRAFT_KEY = "one-dhs-ask-review-draft-v1";
export const practiceReturnKey = (id: string) => `one-dhs-practice-return-v1:${id}`;
export function practiceReviewDraft(title: string, notes: string) {
  const text = notes.trim();
  if (!text || text.length > 50000) return null;
  return {
    kind: "practice-review-v1" as const,
    question: "Review my working notes. What is promising, what assumptions or missing perspectives should I check, and how could I strengthen my next step? Distinguish evidence, suggestions and requirements that need confirmation.",
    attachment: { title: title.trim().slice(0, 300) || "Practice notes", text, note: "Working notes from your practice. Review and edit them before choosing Ask." },
  };
}

export type AskFeedback = { text: string; sources: Array<{ n: number; title: string; slug: string }> };
export const askFeedbackKey = (kind: "practice" | "resource" | "community", id: string) => `one-dhs-ask-feedback-v1:${kind}:${id}`;
export function readAskFeedback(raw: string): AskFeedback | null {
  try {
    const value = JSON.parse(raw) as Partial<AskFeedback>;
    if (typeof value.text !== "string" || !value.text.trim() || value.text.length > 12000 || !Array.isArray(value.sources) || value.sources.length > 8) return null;
    if (!value.sources.every(item => item && Number.isInteger(item.n) && item.n > 0 && typeof item.title === "string" && item.title.length <= 600 && typeof item.slug === "string" && /^[a-z0-9][a-z0-9-]{0,199}$/i.test(item.slug))) return null;
    return { text: value.text, sources: value.sources };
  } catch { return null; }
}
