import { describe, expect, it } from "vitest";
import { PROGRAM_PURPOSE } from "./purpose";
import { programFunctions, programOutcomes } from "./model";
import { buildPrompt } from "@/lib/analysis/service";
import { getInstrument } from "@/lib/analysis/instruments";

describe("One DHS program purpose", () => {
  it("connects cultural development to the staff functions that carry learning into work", () => {
    expect(programOutcomes.find(outcome => outcome.id === "cultural_development")?.intendedChange).toMatch(/assumptions.*perspectives.*adapt/i);
    for (const id of ["ask", "learning", "resources", "community_context", "guided_practice", "equity_analysis", "workforce_context"]) {
      expect(programFunctions.find(item => item.id === id)?.outcomeIds).toContain("cultural_development");
    }
    expect(PROGRAM_PURPOSE.askGuidance).toMatch(/without diagnosing, scoring or assigning/i);
    expect(PROGRAM_PURPOSE.askGuidance).toMatch(/do not impose a cultural lesson on unrelated work/i);
  });
  it("asks equity analysis to consider relevant perspectives without inventing an assessment", () => {
    const prompt = buildPrompt(getInstrument("equity-analysis"), { instrumentId: "equity-analysis", sources: [{ id: "test-source", title: "Test", text: "A team is planning service scheduling." }] });
    expect(prompt.system).toMatch(/perspectives are missing.*assumptions.*practical adaptation/i);
    expect(prompt.system).toMatch(/never infer a person’s or agency’s intercultural orientation/i);
  });
});
