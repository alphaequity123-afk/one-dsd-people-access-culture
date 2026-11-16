// @vitest-environment node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { assertWorkObjectPersistence } from "@/lib/trust/work-object-contract";
import { ADSA_WORK_ACTIONS } from "./adsa-work-links";
import { PROGRAM_OUTCOME_STORED_FIELDS, ProgramOutcomeRecordV2Schema } from "./outcome-schema";

vi.mock("server-only", () => ({}));

const read = (path: string) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");
const canonical = read("db/migrations/0070_pac_program_outcome_records_v2.sql");
const standalone = read("db/standalone/0070_pac_dsd_program_outcome_records_v2.sql");
const sqlArray = (sql: string, call: string) => sql.match(new RegExp(`${call}\\(payload,array\\[([^\\]]+)\\]`))![1].split(",").map(item => item.trim().replace(/^'|'$/g, ""));

const id = "program-outcome-0f8b1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d";
const record = {
  schemaVersion: 2, id, month: "2026-11", evidenceStatus: "self_reported", programScope: "one-dhs",
  problem: "A general appointment notice was hard to act on.", action: "Rewrote the notice with the next step first.",
  adoptedChange: "The unit now uses the clearer notice.", observedResult: "Fewer callers asked what to do next.",
  followUp: "Use the same approach for the other notices.", decision: "revise", consent: true,
  outcomeId: "access", goalActionIds: ["ADSA-6.1", "ADSA-6.3"], reviewMonth: "2027-02",
};

describe("schema-2 outcome records and the database contract (migration 0070)", () => {
  it("passes the application's persistence contract with the month only", () => {
    expect(ProgramOutcomeRecordV2Schema.safeParse(record).success).toBe(true);
    expect(() => assertWorkObjectPersistence("decision", `program_outcome:${id}`, record)).not.toThrow();
    expect(() => assertWorkObjectPersistence("decision", `program_outcome:${id}`, { ...record, createdAt: "2026-11-16T10:00:00Z" })).toThrow();
  });

  it("allows exactly the fields the stored record may hold, and requires the same ones", () => {
    expect(sqlArray(canonical, "assert_allowed_jsonb_keys").sort()).toEqual([...PROGRAM_OUTCOME_STORED_FIELDS].sort());
    const required = Object.entries(ProgramOutcomeRecordV2Schema.shape).filter(([, field]) => !field.isOptional()).map(([key]) => key);
    expect(canonical.match(/payload \?& array\[([^\]]+)\]/)![1].split(",").map(item => item.trim().replace(/^'|'$/g, "")).sort()).toEqual(required.sort());
  });

  it("accepts exactly the supplied ADSA action steps", () => {
    const pattern = new RegExp(canonical.match(/item#>>'\{\}' !~ '([^']+)'/)![1].replace(/\\\\/g, "\\"));
    for (const action of ADSA_WORK_ACTIONS) expect(pattern.test(action.id), action.id).toBe(true);
    for (const unknown of ["ADSA-1.6", "ADSA-3.9", "ADSA-7.1", "ADSA-1.1 "]) expect(pattern.test(unknown), unknown).toBe(false);
  });

  it("keeps outcome storage times to the month", () => {
    expect(canonical).toContain("date_trunc('month', new.created_at, 'UTC')");
    expect(canonical).toContain("date_trunc('month', new.updated_at, 'UTC')");
    expect(canonical).toMatch(/create trigger program_outcome_month_only before insert or update on pac\.runtime_work_objects/);
    // Sorts after immutable_program_record, so an identical retry is compared before times are coarsened.
    expect("program_outcome_month_only" > "immutable_program_record").toBe(true);
  });

  it("ships the same migration for the One DSD private schema", () => {
    const transformed = canonical
      .replace(/\bpac\./g, "pac_dsd.")
      .replace(/search_path=pg_catalog,pac /g, "search_path=pg_catalog,pac_dsd ")
      .replace(/\bpac_(app_runtime|contributor_runtime|authentication_broker|owner_writer)\b/g, "pac_dsd_$1");
    expect(standalone).toBe(transformed);
    const bootstrap = read("db/standalone/bootstrap.sql");
    expect(bootstrap).toContain(standalone.replace(/^begin;\n\n/, "").replace(/\ncommit;\n$/, "\n"));
    expect(bootstrap.indexOf("-- 0070_pac_program_outcome_records_v2.sql")).toBeLessThan(bootstrap.indexOf("-- 0072_pac_dsd_consensus_research_usage.sql"));
    const manifest = JSON.parse(read("db/standalone/manifest.json"));
    const sha = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");
    expect(manifest.migrations.find((entry: { name: string }) => entry.name === "0070_pac_program_outcome_records_v2.sql")).toEqual({
      name: "0070_pac_program_outcome_records_v2.sql", sourceHash: sha(canonical), transformedHash: sha(standalone),
    });
    expect(manifest.forwardMigrations.at(-1)).toEqual({ file: "0070_pac_dsd_program_outcome_records_v2.sql", sha256: sha(standalone), appliesOnlyTo: "pac_dsd" });
    expect(manifest.bootstrapSha256).toBe(sha(bootstrap));
  });
});
