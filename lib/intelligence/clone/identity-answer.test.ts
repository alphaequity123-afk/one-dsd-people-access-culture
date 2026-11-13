import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { staffDisplayText } from "../safety";
import { toStaffAskResult, type AskAnswer } from "../agents/ask";

const identity = "I am an AI assistant. I can help answer questions, but I am not a person or an official agency representative.";
const answer = (text: string): AskAnswer => ({
  context: "one_dhs", intent: "next_actions", shortAnswer: text, whyItMatters: "",
  sources: [], limits: [], nextActions: [], grounding: "none", degraded: false, generative: true,
});

describe("truthful identity in open-ended ASK answers", () => {
  it.each([
    identity,
    "I'm an AI model, not a human.",
    "As an AI assistant, I can help explain unfamiliar subjects.",
    "Artificial intelligence uses computational methods to perform tasks. OpenAI and Perplexity offer different products.",
  ])("preserves identity and educational explanation: %s", text => {
    expect(staffDisplayText(text)).toBe(text);
  });

  it.each([false, true])("preserves the final answer with public research fallback=%s", fallback => {
    const source = answer(identity);
    if (fallback) source.publicResearch = {
      status: "used", kind: "current_answer", depth: "current_web", answer: identity,
      sources: [], note: "",
    };
    const displayed = toStaffAskResult({ kind: "answer", answer: source });
    expect(displayed.kind).toBe("answer");
    if (displayed.kind === "answer") {
      expect(displayed.answer.shortAnswer).toBe(identity);
      if (fallback) {
        expect(displayed.answer.publicResearch?.answer).toBeUndefined();
        expect(displayed.answer.publicResearch?.heading).toBe("Public sources");
      }
    }
  });

  it("retains public findings when no synthesized answer was produced", () => {
    const source = answer("Here are the available findings.");
    source.generative = false;
    source.publicResearch = {
      status: "used", kind: "current_answer", depth: "current_web", answer: identity,
      sources: [{ title: "Reference", url: "https://example.com/reference" }], note: "",
    };
    const displayed = toStaffAskResult({ kind: "answer", answer: source });
    if (displayed.kind !== "answer") throw new Error("Expected answer");
    expect(displayed.answer.publicResearch?.answer).toBe(identity);
    expect(displayed.answer.publicResearch?.sources).toHaveLength(1);
  });

  it("keeps resource labels and cited titles while removing unrelated process preambles", () => {
    expect(staffDisplayText("Open resource", { kind: "label" })).toBe("Open resource");
    expect(staffDisplayText("An Introduction to AI", { kind: "source_title" })).toBe("An Introduction to AI");
    expect(staffDisplayText("I searched the web. An interpreter supports communication.")).toBe("An interpreter supports communication.");
  });
});
