import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RETENTION_RECEIPT_STEPS, retentionReceipt, retentionReceiptComplete } from "./retention-receipt";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("scheduled retention receipt", () => {
  it("names steps exactly as the cycle records them", () => {
    const cycle = read("./cycle.ts");
    for (const name of Object.values(RETENTION_RECEIPT_STEPS)) expect(cycle).toContain(`"${name}"`);
  });

  it("reports every flag the pg_cron verifier checks", () => {
    const verifier = read("../../../scripts/db/one-dsd-retention-scheduler.sql");
    const required = [...verifier.matchAll(/payload->'retention'->'([a-z_]+)'/g)].map(match => match[1]);
    expect(required.length).toBeGreaterThan(0);
    expect(new Set(required)).toEqual(new Set(Object.keys(RETENTION_RECEIPT_STEPS)));
  });

  it("is complete only when every cleanup step finished", () => {
    const steps = Object.values(RETENTION_RECEIPT_STEPS).map(name => ({ name, outcome: "done" }));
    expect(retentionReceiptComplete(retentionReceipt(steps))).toBe(true);
    const missing = steps.map(step => step.name === RETENTION_RECEIPT_STEPS.ask_response_cleanup_completed ? { ...step, outcome: "denied" } : step);
    const receipt = retentionReceipt(missing);
    expect(receipt.ask_response_cleanup_completed).toBe(false);
    expect(retentionReceiptComplete(receipt)).toBe(false);
  });
});
