// @vitest-environment node
import { describe, expect, it } from "vitest";
import { getQuestions, TOOLKIT_VERSION } from "./instrument";
import { TOOLKIT_REPORT_FILE_STEMS, TOOLKIT_REPORT_KINDS, toolkitReportBlocks, toolkitReportPdf, toolkitReportWord } from "./report";
import type { ToolkitCase } from "./schema";

const fixture: ToolkitCase = {
  id: "46aad095-0bad-49ea-8e34-d343b91ceac5", version: 2, instrumentVersion: TOOLKIT_VERSION, status: "review", title: "Revised waiver notice",
  request: { title: "Revised waiver notice", question: "How would the revised notice affect people served by the Community Access for Disability Inclusion Waiver?", context: "Synthetic example.", track: "scan", scope: "division", programs: ["Community Access for Disability Inclusion Waiver"], goals: [], sources: [{ id: "notice", title: "Synthetic notice", text: "People may request a translated copy.", origin: "user" }], routing: { priorAnalysisIntegrated: false, materialChange: true, knownDisparities: false, timeLimited: false }, answers: {} },
  result: {
    summary: "The notice offers translation, but evidence about who receives it is missing.",
    answers: getQuestions("scan").map((question, index) => ({ questionId: question.id, text: index === 0 ? "The notice offers a translated copy." : index === 1 ? "The proposal may reduce confusion for people who read English as a second language." : `No evidence was supplied for ${question.id}.`, kind: index === 0 ? "evidence" as const : index === 1 ? "inference" as const : "gap" as const, citations: index === 0 ? [{ sourceId: "notice", excerpt: "People may request a translated copy." }] : [] })),
    alternatives: [{ title: "Keep the current notice", benefits: "No new cost.", burdens: "Barriers may remain.", evidenceNeeded: "Who receives the notice." }, { title: "Test a revised notice", benefits: "Finds barriers early.", burdens: "Takes participant time.", evidenceNeeded: "Feedback." }],
    actions: [{ action: "Test the revised notice with participants", responsibleRole: "Program manager", dueDate: "Date to confirm", resources: "Interpretation", measure: "Participants can name the next step", followUp: "Share the results" }],
    limitations: ["No engagement findings were supplied."], questionsForReview: ["Which perspectives are missing?"],
  },
  createdAt: "2026-11-05T12:00:00.000Z", updatedAt: "2026-11-05T12:10:00.000Z", finalizedAt: null,
};
const text = (kind: Parameters<typeof toolkitReportBlocks>[1], value = fixture) => toolkitReportBlocks(value, kind).map(block => block.text).join("\n");

describe("information request and leadership brief", () => {
  it("lists the new kinds with file names", () => {
    expect(TOOLKIT_REPORT_KINDS).toEqual(["report", "worksheet", "action-plan", "information-request", "leadership-brief"]);
    expect(TOOLKIT_REPORT_FILE_STEMS["information-request"]).toBe("equity-information-request");
    expect(TOOLKIT_REPORT_FILE_STEMS["leadership-brief"]).toBe("equity-leadership-brief");
  });

  it("writes a request with purpose, each need, why, the question it answers and how to send it back", () => {
    const value = text("information-request");
    for (const heading of ["Purpose", "The decision being analyzed", "Information requested", "How to send it back"]) expect(value).toContain(heading);
    expect(value).toContain("Why it is needed:");
    expect(value).toContain("It helps answer:");
    expect(value).toContain("Who might have it: the person or area responsible");
    expect(value).toContain("Which perspectives are missing?");
    expect(value).not.toMatch(/\bconsultant\b|\bDHS\b|\bAI\b/);
  });

  it("writes a short leadership brief with evidence labels in words and the decision needed", () => {
    const blocks = toolkitReportBlocks(fixture, "leadership-brief");
    const value = blocks.map(block => block.text).join("\n");
    for (const heading of ["The question", "Summary", "Key findings", "Alternatives", "Recommended actions", "What is still unknown", "Decision needed"]) expect(blocks.some(block => block.kind === "heading" && block.text === heading), heading).toBe(true);
    expect(value).toContain("Supported by cited material: The notice offers a translated copy.");
    expect(value).toContain("Interpretation to review against the evidence:");
    expect(value).toContain("Responsible role: Program manager. Timing: Date to confirm.");
    expect(value.length).toBeLessThan(7000);
    expect(value).not.toMatch(/\bconsultant\b|\bAI\b/);
  });

  it("still produces both documents before an analysis exists", () => {
    const draft = { ...structuredClone(fixture), status: "draft" as const, result: null };
    expect(text("leadership-brief", draft)).toContain("An analysis has not yet been prepared.");
    expect(text("information-request", draft)).toContain("Dated information describing who is served");
  });

  it.each(["information-request", "leadership-brief"] as const)("creates non-empty Word and PDF files for %s", async kind => {
    const word = await toolkitReportWord(fixture, kind); const pdf = await toolkitReportPdf(fixture, kind);
    expect(word.byteLength).toBeGreaterThan(1000); expect(Buffer.from(word).subarray(0, 2).toString()).toBe("PK");
    expect(pdf.byteLength).toBeGreaterThan(1000); expect(Buffer.from(pdf).subarray(0, 5).toString()).toBe("%PDF-");
  });
});
