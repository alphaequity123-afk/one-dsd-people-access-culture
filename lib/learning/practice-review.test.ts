import { describe, expect, it } from "vitest";
import { practiceReturnKey, practiceReviewDraft, askFeedbackKey, readAskFeedback } from "./practice-review";
describe("practice review handoff", () => {
  it("preserves the selected notes and asks for evidence-aware feedback", () => {
    const notes = "Task: Improve scheduling\nProposed action: Ask people which times work.";
    const draft = practiceReviewDraft("Evaluation plan", notes);
    expect(draft?.attachment.text).toBe(notes);
    expect(draft?.attachment.title).toBe("Evaluation plan");
    expect(draft?.question).toMatch(/assumptions.*perspectives/i);
    expect(draft?.question).toMatch(/evidence.*suggestions.*requirements/i);
    expect(practiceReturnKey("measurement")).not.toContain(notes);
  });
  it("rejects empty or oversized notes without truncating them", () => {
    expect(practiceReviewDraft("Plan", " ")).toBeNull();
    expect(practiceReviewDraft("Plan", "x".repeat(50001))).toBeNull();
  });
});

describe("feedback returned to work", () => {
  it("preserves the answer and safe source links without storing it in the address", () => {
    const feedback = { text: "Consider who is missing from the discussion.", sources: [{ n: 1, title: "Inclusive meetings", slug: "inclusive-meetings" }] };
    expect(readAskFeedback(JSON.stringify(feedback))).toEqual(feedback);
    expect(askFeedbackKey("practice", "measurement")).not.toContain(feedback.text);
  });
  it("rejects unsafe links and oversized feedback", () => {
    expect(readAskFeedback(JSON.stringify({ text: "Review", sources: [{ n: 1, title: "Source", slug: "//other.example" }] }))).toBeNull();
    expect(readAskFeedback(JSON.stringify({ text: "x".repeat(12001), sources: [] }))).toBeNull();
  });
});
