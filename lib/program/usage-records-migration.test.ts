// @vitest-environment node
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");
const canonical = read("db/migrations/0073_pac_drop_usage_records.sql");
const standalone = read("db/standalone/0073_pac_dsd_drop_usage_records.sql");
const sha = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");
const statements = (sql: string) => sql.split("\n").filter(line => line.trim() && !line.trim().startsWith("--"));

describe("usage records are dropped (migration 0073, owner decision 2026-11-16)", () => {
  it("drops both tables, safely, with the functions that only existed for them", () => {
    expect(canonical).toContain("drop table if exists pac.ask_response_records;");
    expect(canonical).toContain("drop table if exists pac.runtime_counters;");
    for (const fn of [
      "append_ask_response_record(jsonb)", "list_ask_response_records(integer,timestamptz,uuid,timestamptz)",
      "delete_ask_response_records(jsonb)", "purge_expired_ask_response_records(timestamptz)",
      "valid_ask_evidence_claims(jsonb)", "valid_ask_source_evidence(jsonb)", "valid_ask_practice_artifact(jsonb)",
    ]) expect(canonical).toContain(`drop function if exists pac.${fn};`);
    // Restore preparation is replaced before the drop and no longer reaches Ask records.
    const restore = canonical.slice(canonical.indexOf("create or replace function pac.prepare_isolated_program_restore"), canonical.indexOf("end $$;"));
    expect(restore).not.toMatch(/ask_response/);
    expect(restore).toContain("values(p_recovery_id,p_environment,0,revoked,invitations,credentials)");
    expect(canonical.indexOf("prepare_isolated_program_restore")).toBeLessThan(canonical.indexOf("drop table if exists pac.ask_response_records"));
    // Only drops touch the two tables; the owner audit table is kept.
    for (const line of statements(canonical).filter(l => /ask_response_records|runtime_counters/.test(l))) expect(line).toMatch(/^drop (?:table|function) if exists /);
    expect(canonical).not.toMatch(/runtime_audit_events/);
    expect(canonical).not.toMatch(/\bcascade\b/i);
  });

  it("ships the same migration for the One DSD private schema, in the bootstrap and the manifest", () => {
    const transformed = canonical
      .replace(/\bpac\./g, "pac_dsd.")
      .replace(/search_path=pg_catalog,pac /g, "search_path=pg_catalog,pac_dsd ")
      .replace(/\bpac_(app_runtime|contributor_runtime|authentication_broker|owner_writer)\b/g, "pac_dsd_$1");
    expect(standalone).toBe(transformed);
    const bootstrap = read("db/standalone/bootstrap.sql");
    const section = "-- 0073_pac_drop_usage_records.sql\n" + standalone.replace(/^begin;\n\n/, "").replace(/\ncommit;\n$/, "\n");
    expect(bootstrap.endsWith(section + "commit;\n")).toBe(true);
    expect(bootstrap.indexOf("-- 0072_pac_dsd_consensus_research_usage.sql")).toBeLessThan(bootstrap.indexOf("-- 0073_pac_drop_usage_records.sql"));
    const manifest = JSON.parse(read("db/standalone/manifest.json"));
    expect(manifest.migrations.find((entry: { name: string }) => entry.name === "0073_pac_drop_usage_records.sql")).toEqual({
      name: "0073_pac_drop_usage_records.sql", sourceHash: sha(canonical), transformedHash: sha(standalone),
    });
    expect(manifest.forwardMigrations.at(-1)).toEqual({ file: "0073_pac_dsd_drop_usage_records.sql", sha256: sha(standalone), appliesOnlyTo: "pac_dsd" });
    expect(manifest.bootstrapSha256).toBe(sha(bootstrap));
    expect(manifest.totalBytes).toBe(Buffer.byteLength(bootstrap, "utf8"));
  });

  it("leaves no application code that reads or writes either table", () => {
    const found: string[] = [];
    const visit = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        const path = join(dir, entry.name);
        if (entry.isDirectory()) visit(path);
        else if (/\.(?:ts|tsx|mjs|cjs|js)$/.test(entry.name) && !/\.test\./.test(entry.name)
          && /\bask_response_records\b|\bappend_ask_response_record\b|\bruntime_counters\b/.test(readFileSync(path, "utf8"))) found.push(path);
      }
    };
    for (const dir of ["app", "components", "lib", "scripts"]) visit(dir);
    expect(found).toEqual([]);
  });
});
