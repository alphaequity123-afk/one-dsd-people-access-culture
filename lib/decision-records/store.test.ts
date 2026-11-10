import { describe, expect, it } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import { openRecord, sealRecord, type TeamDecisionRecord } from "./store";
import { caseRowKind, policyChangeCaseAad, sealCaseEnvelope } from "@/lib/consultant-toolkit/cases";

describe("team-space decision records", () => {
  const key = randomBytes(32);
  const record: TeamDecisionRecord = { kind: "decision-record", id: randomUUID(), version: 1, title: "Notice change", fields: { decision: "Move reminders to text" }, savedBy: "", createdAt: "2026-11-09T00:00:00.000Z", updatedAt: "2026-11-09T00:00:00.000Z" };
  it("round-trips and identifies its own rows", () => {
    const sealed = sealRecord(record, key);
    const row = { id: record.id, version: 1, encrypted_payload: sealed };
    expect(openRecord(row, key)).toEqual(record);
    expect(caseRowKind(row, key)).toBe("decision-record");
  });
  it("never opens a policy case as a decision record", () => {
    const sealed = sealCaseEnvelope(JSON.stringify(record), policyChangeCaseAad(record.id, 1), key);
    expect(openRecord({ id: record.id, version: 1, encrypted_payload: sealed }, key)).toBeNull();
  });
  it("refuses a record moved to another id or version", () => {
    const sealed = sealRecord(record, key);
    expect(openRecord({ id: randomUUID(), version: 1, encrypted_payload: sealed }, key)).toBeNull();
    expect(openRecord({ id: record.id, version: 2, encrypted_payload: sealed }, key)).toBeNull();
  });
});
