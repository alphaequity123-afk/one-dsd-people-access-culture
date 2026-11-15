import { describe, expect, it } from "vitest";
import { inspectLanguageRevision, type LanguageRevision } from "./professional-language";
import partialCourses from "./course-partial-language-revisions.json";

const revision: LanguageRevision = { target: "sample", kind: "surface", status: "reviewed", changes: [
  { path: ["body"], before: "Initial explanation", after: "Reviewed explanation with its reason." },
  { path: ["items", 0], before: "Initial step", after: "Reviewed step" },
] };

describe("reviewed professional language", () => {
  it("applies a complete reviewed revision without changing the original or protected fields", () => {
    const original = { body: "Initial explanation", items: ["Initial step"], transcript: "Exact recorded words", source: "https://example.org/original" };
    const result = inspectLanguageRevision("sample", original, revision);
    expect(result.applied).toBe(true);
    expect(result.value.body).toBe(revision.changes[0].after);
    expect(result.value.items).toEqual(["Reviewed step"]);
    expect(original.body).toBe("Initial explanation");
    expect(result.value.transcript).toBe(original.transcript);
    expect(result.value.source).toBe(original.source);
  });
  it("does not partially replace a later owner revision", () => {
    const original = { body: "New owner wording", items: ["Initial step"] };
    const result = inspectLanguageRevision("sample", original, revision);
    expect(result.applied).toBe(false);
    expect(result.conflicts).toEqual(["body"]);
    expect(result.value).toBe(original);
  });
  it("keeps draft material out of published pages", () => {
    const original = { body: "Initial explanation", items: ["Initial step"] };
    expect(inspectLanguageRevision("sample", original, { ...revision, status: "draft" }).value).toBe(original);
  });
  it("is idempotent for an already applied revision", () => {
    const original = { body: revision.changes[0].after, items: [revision.changes[1].after] };
    expect(inspectLanguageRevision("sample", original, revision).value).toEqual(original);
  });
  it("accepts an explicitly reviewed published variant but preserves any other owner wording", () => {
    const revised: LanguageRevision = { ...revision, changes: [{ ...revision.changes[0], beforeVariants: ["Earlier published explanation"] }] };
    expect(inspectLanguageRevision("sample", { body: "Earlier published explanation" }, revised).value.body).toBe(revision.changes[0].after);
    const later = { body: "A subsequent owner revision" };
    expect(inspectLanguageRevision("sample", later, revised).value).toBe(later);
    expect(inspectLanguageRevision("sample", later, revised).conflicts).toEqual(["body"]);
  });
  it("keeps partial course corrections to their three reviewed instructions", () => {
    const course = partialCourses.courses[0];
    const original = { pack: {
      course: { learning: { appliedNextStep: course.changes[0].before }, governance: { toolkitQuestion: course.changes[1].before }, introTranscript: "Recorded words remain exact", lessons: [{ body: "Unreviewed lesson remains unchanged" }] },
      jobAid: { use: { doNext: course.changes[2].before } },
    } };
    const result = inspectLanguageRevision(`course.${course.courseId}`, original);
    expect(result.applied).toBe(true);
    expect(result.value.pack.course.learning.appliedNextStep).toBe(course.changes[0].after);
    expect(result.value.pack.course.governance.toolkitQuestion).toBe(course.changes[1].after);
    expect(result.value.pack.jobAid.use.doNext).toBe(course.changes[2].after);
    expect(result.value.pack.course.introTranscript).toBe(original.pack.course.introTranscript);
    expect(result.value.pack.course.lessons).toEqual(original.pack.course.lessons);
    expect(original.pack.jobAid.use.doNext).toBe(course.changes[2].before);
  });
});
