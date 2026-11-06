// @vitest-environment node
import { describe, expect, it } from "vitest";
import { getQuestions } from "./instrument";
import { afterRun, beforeRun, closedSinceLastRun, gapQuestionIds, INFORMATION_CHECK_NOTE, PLAIN_REQUESTS } from "./information-needed";
import type { ToolkitRequest, ToolkitResponse } from "./schema";

const base = (text: string, track: ToolkitRequest["track"] = "full"): ToolkitRequest => ({
  title: "Notice change", question: "How would the revised notice affect people?", context: "", track, scope: "division",
  programs: [], goals: [], sources: [{ id: "doc", title: "Proposal", text, origin: "user" }],
  routing: { priorAnalysisIntegrated: false, materialChange: false, knownDisparities: false, timeLimited: false }, answers: {},
});

describe("information needed before a run", () => {
  it("flags every kind of information missing from thin material and links it to the track's questions", () => {
    const items = beforeRun(base("We will revise the notice."));
    expect(items.map(item => item.id)).toEqual(["people-served-data", "experience-of-people-affected", "decision-and-decider", "alternatives-considered", "budget-and-resources", "timeline", "prior-analyses", "tribal-nations"]);
    expect(items.every(item => item.status === "missing")).toBe(true);
    const ids = new Set(getQuestions("full").map(question => question.id));
    for (const item of items) { expect(item.questionIds.length).toBeGreaterThan(0); for (const id of item.questionIds) expect(ids.has(id)).toBe(true); }
  });

  it("marks information found when the material contains it", () => {
    const text = [
      "In 2025, 34 percent of people served in Hennepin County spoke a primary language other than English.",
      "At listening sessions, participants said the notice was hard to read.",
      "The division director will decide in March.",
      "Options considered include keeping the current notice.",
      "The budget includes $40,000 for translation.",
      "The change takes effect January 1, 2027.",
      "A 2023 evaluation found lower response rates.",
      "Tribal Nations were notified through the Office of Indian Affairs.",
    ].join(" ");
    expect(beforeRun(base(text)).every(item => item.status === "found")).toBe(true);
  });

  it("does not count application references as attached material, and counts typed notes", () => {
    const request = base("We will revise the notice.");
    request.sources.push({ id: "program-x", title: "Reference", text: "listening sessions participants said budget", origin: "application-context" });
    expect(beforeRun(request).find(item => item.id === "experience-of-people-affected")?.status).toBe("missing");
    request.answers = { "full-3-2": "Participants said the notice was confusing." };
    expect(beforeRun(request).find(item => item.id === "experience-of-people-affected")?.status).toBe("found");
  });

  it("keeps question links within the selected track", () => {
    for (const item of beforeRun(base("text", "scan"))) for (const id of item.questionIds) expect(id).toMatch(/^(scan-|prep-)/);
  });

  it("names roles, never an office or a person, as the holder", () => {
    for (const item of beforeRun(base("text"))) { expect(item.whoMightHaveIt).not.toMatch(/office/i); expect(item.whoMightHaveIt).toMatch(/^the person or area responsible/); }
    expect(beforeRun(base("text")).find(item => item.id === "tribal-nations")?.need).toContain("Office of Indian Affairs");
    expect(INFORMATION_CHECK_NOTE).toContain("not a judgement");
  });

  it("has a plain request for every question in both tracks", () => {
    for (const track of ["scan", "full"] as const) for (const question of getQuestions(track)) expect(PLAIN_REQUESTS[question.id], question.id).toBeTruthy();
  });
});

const response = (gaps: string[]): ToolkitResponse => ({
  summary: "Summary.",
  answers: getQuestions("scan").map(question => ({ questionId: question.id, text: gaps.includes(question.id) ? `No evidence for ${question.id}.` : "Answered.", kind: gaps.includes(question.id) ? "gap" as const : "inference" as const, citations: [] })),
  alternatives: [], actions: [],
  limitations: ["No engagement findings were supplied.", "No engagement findings were supplied!"],
  questionsForReview: ["Who decides?"],
});

describe("information needed after a run", () => {
  it("lists gaps as plain requests, then limitations and open questions, without duplicates", () => {
    const items = afterRun(base("x", "scan"), response(["scan-2", "scan-3"]));
    expect(items.map(item => item.id)).toEqual(["gap-scan-2", "gap-scan-3", "limitation-1", "review-1"]);
    expect(items[0].need).toBe(PLAIN_REQUESTS["scan-2"]);
    expect(items[0].why).toBe("No evidence for scan-2.");
    expect(items[0].questionIds).toEqual(["scan-2"]);
    expect(items.every(item => item.status === "missing" && !/office/i.test(item.whoMightHaveIt))).toBe(true);
  });

  it("reports which needs closed since the previous run", () => {
    const before = gapQuestionIds(response(["scan-2", "scan-3", "scan-5"]));
    expect(closedSinceLastRun(before, response(["scan-3"]))).toEqual([
      { questionId: "scan-2", title: PLAIN_REQUESTS["scan-2"] },
      { questionId: "scan-5", title: PLAIN_REQUESTS["scan-5"] },
    ]);
    expect(closedSinceLastRun([], response(["scan-3"]))).toEqual([]);
  });
});
