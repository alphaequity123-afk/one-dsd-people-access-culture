import { describe, expect, it } from "vitest";
import { emptyRecord, loadBook, recordText, recordWordDocument, validRecord } from "./records";

describe("personal records", () => {
  const now = new Date("2026-11-09T12:00:00Z");
  it("starts a plan with a thirty-day review and the source filled in", () => {
    const plan = emptyRecord("action-plan", "a1", now, { source: "Inclusive hiring", title: "Hiring panel" });
    expect(plan.fields.reviewDate).toBe("2026-12-09");
    expect(plan.fields.source).toBe("Inclusive hiring");
    expect(validRecord(plan, "action-plan")).toBe(true);
  });
  it("rejects unknown fields and the wrong kind", () => {
    const plan = emptyRecord("action-plan", "a1", now);
    expect(validRecord({ ...plan, fields: { ...plan.fields, extra: "x" } })).toBe(false);
    expect(validRecord(plan, "decision-record")).toBe(false);
  });
  it("survives unreadable storage", () => {
    expect(loadBook("{not json").records).toEqual([]);
    expect(loadBook(JSON.stringify({ version: 1, records: [{ id: 1 }] })).records).toEqual([]);
  });
  it("exports escaped text for Word", () => {
    const record = emptyRecord("decision-record", "d1", now, { decision: "<b>Rule</b> & notice", title: "Notice" });
    expect(recordWordDocument(record)).toContain("&lt;b&gt;Rule&lt;/b&gt; &amp; notice");
    expect(recordText(record)).toContain("The decision");
  });
});
