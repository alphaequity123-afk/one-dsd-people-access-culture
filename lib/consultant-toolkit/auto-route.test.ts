// @vitest-environment node
import { describe, expect, it } from "vitest";
import catalog from "@/lib/content/hub/dsd-policies.json";
import { detectPrograms, fullNames, KNOWN_PROGRAMS, suggestSetup } from "./auto-route";
import { recommendTrack } from "./instrument";

const today = new Date("2026-11-05T12:00:00Z");

describe("automatic setup", () => {
  it("covers every program name in the policy catalog", () => {
    const known = new Set(KNOWN_PROGRAMS.map(name => name.toLowerCase()));
    const names = new Set((catalog as { policies: { programs?: string[] }[] }).policies.flatMap(policy => policy.programs ?? []));
    for (const name of names) if (name !== "Department-wide") expect(known.has(name.toLowerCase()), name).toBe(true);
  });

  it("detects a material change, known disparities and a deadline, quoting each phrase", () => {
    const setup = suggestSetup({ title: "Revised CADI waiver eligibility", text: "The department will adopt new eligibility requirements for the CADI waiver. Black and American Indian participants are underrepresented among people using consumer-directed options. Comments are due by January 15, 2027." }, { today });
    expect(setup.routing).toEqual({ priorAnalysisIntegrated: false, materialChange: true, knownDisparities: true, timeLimited: true });
    expect(setup.reasons.some(reason => reason.startsWith("Material change: the document says “") && reason.includes("eligibility"))).toBe(true);
    expect(setup.reasons.some(reason => reason.includes("“underrepresented”"))).toBe(true);
    expect(setup.reasons.some(reason => reason.includes("by January 15, 2027"))).toBe(true);
    expect(setup.track).toBe(recommendTrack(setup.routing).track);
    expect(setup.track).toBe("full");
    expect(setup.programs).toEqual(["Community Access for Disability Inclusion Waiver"]);
    expect(setup.suggestedQuestion).toContain("Community Access for Disability Inclusion Waiver");
    expect(setup.suggestedQuestion).toContain("including the disparities the document describes");
    expect(setup.advisory).toMatch(/^Suggested; you decide\./);
  });

  it("suggests a scan only when a prior analysis is integrated and nothing else is flagged", () => {
    const setup = suggestSetup({ title: "Annual notice review", text: "This review follows the recommendations from the 2025 equity analysis of the notice. Wording stays the same." });
    expect(setup.routing.priorAnalysisIntegrated).toBe(true);
    expect(setup.routing.materialChange).toBe(false);
    expect(setup.track).toBe("scan");
    expect(setup.signals.find(signal => signal.key === "priorAnalysisIntegrated")?.phrase).toContain("equity analysis");
  });

  it("flags gaps by race, language, disability or county and urgent timing", () => {
    const setup = suggestSetup({ title: "", text: "Data show a gap in approval rates by county and by primary language. This is urgent." });
    expect(setup.routing.knownDisparities).toBe(true);
    expect(setup.routing.timeLimited).toBe(true);
    expect(setup.title).toBe("Data show a gap in approval rates by county and by primary language. This is urgent.");
  });

  it("treats a bare upcoming date as a time limit only when today is supplied, and is deterministic", () => {
    const input = { title: "Notice", text: "The meeting is scheduled for 2026-12-01." };
    expect(suggestSetup(input).routing.timeLimited).toBe(false);
    expect(suggestSetup(input, { today }).routing.timeLimited).toBe(true);
    expect(suggestSetup(input, { today: new Date("2027-08-01T00:00:00Z") }).routing.timeLimited).toBe(false);
    expect(suggestSetup(input, { today })).toEqual(suggestSetup(input, { today }));
  });

  it("returns program names in full and prefers the longest match", () => {
    expect(detectPrograms("Changes to Medical Assistance home care services and PCA, then CFSS and MnCHOICES assessments.")).toEqual([
      "Medical Assistance home care services", "Personal Care Assistance", "Community First Services and Supports", "MnCHOICES",
    ]);
    expect(detectPrograms("Nothing about programs here.")).toEqual([]);
  });

  it("suggests scope from the text and defaults to the division", () => {
    expect(suggestSetup({ title: "x", text: "A department-wide change to notices." }).scope).toBe("agency");
    expect(suggestSetup({ title: "x", text: "A change to a waiver notice." }).scope).toBe("division");
  });

  it("writes organization names in full and keeps role wording neutral", () => {
    expect(fullNames("ADSA and DSD and DHS and LTSS")).toBe("Aging and Disability Services Administration and Disability Services Division and Department of Human Services and long-term services and supports");
    expect(fullNames("One DSD Team and the One DHS collection")).toBe("One DSD Team and the One DHS collection");
    const setup = suggestSetup({ title: "x", text: "Urgent change to rates." });
    for (const reason of [...setup.trackReasons, ...setup.reasons]) expect(reason).not.toMatch(/\bconsultant\b|\bAI\b|\bDHS\b/i);
  });
  it("treats a new obligation stated against the current one as a material change", () => {
    const setup = suggestSetup({ title: "Visit timing", text: "Lead agencies must complete case management visits within 30 days of a change in condition instead of the current 60 days." });
    expect(setup.routing.materialChange).toBe(true);
  });
});
