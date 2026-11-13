import { describe, expect, it } from "vitest";
import { assessLocalEvidence, localEvidenceNeedsResearch } from "./local-evidence";

describe("whether the program's own material answers a question", () => {
  const passage = { title: "Giving feedback fairly", excerpt: "Fair feedback describes the work and its effect, names one specific change, and asks what would help the person do it." };
  it("finds no program material", () => expect(assessLocalEvidence("How do I give feedback fairly?", [])).toBe("absent"));
  it("finds material that covers the question", () => expect(assessLocalEvidence("How do I give fair feedback about the work?", [passage])).toBe("potentially_sufficient"));
  it("finds material that does not cover the question", () => expect(assessLocalEvidence("What changed in the federal waiver rules this year?", [passage])).toBe("insufficient"));
  it("does not mistake word overlap or an uncertain routing decision for sufficient evidence", () => {
    expect(localEvidenceNeedsResearch('potentially_sufficient', null)).toBe(true);
    expect(localEvidenceNeedsResearch('potentially_sufficient', 'clarify')).toBe(true);
    expect(localEvidenceNeedsResearch('potentially_sufficient', 'research')).toBe(true);
    expect(localEvidenceNeedsResearch('potentially_sufficient', 'sufficient')).toBe(false);
    expect(localEvidenceNeedsResearch('absent', 'sufficient')).toBe(true);
  });
});
