import { describe, expect, it } from "vitest";
import { FIELDS_FOR, REFLECTION_KINDS, emptyRecord, loadBook, lookBackDue, recordText, recordWordDocument, validRecord } from "./records";

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

describe("reflections", () => {
  const now = new Date("2026-11-09T12:00:00Z");
  it("starts with a look-back a week out and asks what happened, why it matters and what comes next", () => {
    const reflection = emptyRecord("reflection", "r1", now, { about: "Feedback across power differences", title: "Reflection: feedback" });
    expect(reflection.title).toBe("Reflection: feedback");
    expect(reflection.fields.reviewDate).toBe("2026-11-16");
    expect(reflection.fields.about).toBe("Feedback across power differences");
    expect(validRecord(reflection, "reflection")).toBe(true);
    expect(validRecord(reflection, "action-plan")).toBe(false);
    expect(FIELDS_FOR.reflection.map(field => field.key)).toEqual(["type", "about", "what", "soWhat", "nowWhat", "reviewDate", "lookBack"]);
    expect(REFLECTION_KINDS).toHaveLength(5);
    expect(emptyRecord("reflection", "r2", now).title).toBe("My reflection");
  });
  it("is kept only as the fields it defines", () => {
    const reflection = emptyRecord("reflection", "r1", now);
    expect(validRecord({ ...reflection, fields: { ...reflection.fields, score: "5" } })).toBe(false);
    expect(validRecord({ ...reflection, kind: "badge" })).toBe(false);
    expect(loadBook(JSON.stringify({ version: 1, records: [reflection] })).records).toHaveLength(1);
  });
  it("downloads in plain words, saying no copy is kept", () => {
    const reflection = emptyRecord("reflection", "r1", now, { what: "I asked instead of assuming." });
    const text = recordText(reflection);
    expect(text).toContain("Reflection: My reflection");
    expect(text).toContain("What happened\nI asked instead of assuming.");
    expect(text).toContain("keeps no copy of this record");
  });
});

describe("looking back when the date arrives", () => {
  const now = new Date("2026-11-09T12:00:00Z");
  it("is ready on the date and after it, until something is written", () => {
    const reflection = emptyRecord("reflection", "r1", now);
    expect(lookBackDue(reflection, "2026-11-15")).toBe(false);
    expect(lookBackDue(reflection, "2026-11-16")).toBe(true);
    expect(lookBackDue(reflection, "2026-12-01")).toBe(true);
    expect(lookBackDue({ ...reflection, fields: { ...reflection.fields, lookBack: "The team spoke up more." } }, "2026-12-01")).toBe(false);
  });
  it("works for an action plan too, and never for a record with no date or no look-back question", () => {
    const plan = emptyRecord("action-plan", "a1", now);
    expect(lookBackDue(plan, "2026-12-09")).toBe(true);
    expect(lookBackDue({ ...plan, fields: { ...plan.fields, happened: "Tried it twice." } }, "2026-12-09")).toBe(false);
    expect(lookBackDue({ ...plan, fields: { ...plan.fields, reviewDate: "" } }, "2026-12-09")).toBe(false);
    expect(lookBackDue(emptyRecord("decision-record", "d1", now), "2027-01-01")).toBe(false);
  });
});

