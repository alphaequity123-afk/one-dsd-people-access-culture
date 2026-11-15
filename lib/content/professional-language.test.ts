import { describe, expect, it } from "vitest";
import { inspectLanguageRevision, type LanguageRevision } from "./professional-language";

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
});
