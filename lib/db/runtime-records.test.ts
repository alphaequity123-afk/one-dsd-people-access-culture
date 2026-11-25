import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runtimeRecordsStore } from "./runtime-records";
import { runtimeSql } from "./runtime-client";
import {
  admitRun, claimDailyReview, finishRun, ledgerSummary, openLedger, recordDecision, recordVoiceUse, settleDailyReview,
} from "@/lib/intelligence/clone/ledger";
import { readPageEdits, savePageEdit, undoPageEdit } from "@/lib/content/page-edits-store";
import { claimCreation, enqueueCreation, finishCreation, findCreationJob, listCreationJobs, renewCreation, saveCreationArtifact } from "@/lib/learning/resource-creation-store";

// The database half runs only against a disposable database that has migration 0073 applied, for
// example: PAC_TEST_RECORDS_RUNTIME_URL=postgres://pac_dsd_app_runtime:...@localhost/test
//          PAC_TEST_RECORDS_OWNER_URL=postgres://pac_dsd_owner_writer:...@localhost/test
const runtimeUrl = process.env.PAC_TEST_RECORDS_RUNTIME_URL?.trim();
const ownerUrl = process.env.PAC_TEST_RECORDS_OWNER_URL?.trim();

vi.mock("@/lib/db/owner-client", () => ({
  ownerDatabase: async () => {
    if (!ownerUrl) throw new Error("No owner test database.");
    return runtimeSql({ databaseUrl: ownerUrl, ssl: false });
  },
}));

const directories: string[] = [];
afterAll(() => { for (const directory of directories) rmSync(directory, { recursive: true, force: true }); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("where runtime records are kept", () => {
  it("defaults to the volume and accepts only the two known stores", () => {
    const environment = (value?: string) => ({ PAC_RUNTIME_RECORDS: value }) as unknown as NodeJS.ProcessEnv;
    expect(runtimeRecordsStore(environment())).toBe("volume");
    expect(runtimeRecordsStore(environment(" Postgres "))).toBe("postgres");
    expect(() => runtimeRecordsStore(environment("s3"))).toThrow(/volume or postgres/);
  });

  it("refuses the database store without a runtime database instead of writing to disk", () => {
    vi.stubEnv("PAC_RUNTIME_RECORDS", "postgres");
    vi.stubEnv("PAC_RUNTIME_DATABASE_URL", "");
    expect(() => openLedger()).toThrow(/PAC_RUNTIME_DATABASE_URL/);
  });
});

describe("the Ask pilot ledger on the volume", () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(path.join(os.tmpdir(), "ledger-"));
    directories.push(root);
  });

  it("records runs, decisions, voice use and one daily review claim", async () => {
    const ledger = openLedger(root);
    const now = new Date();
    const stale = await admitRun(ledger, new Date(now.getTime() - 300_000));
    const run = await admitRun(ledger, now);
    await recordDecision(run, "learning", root);
    await finishRun(ledger, run, "completed");
    await finishRun(ledger, stale, "completed");
    ledger.close();
    expect(await ledgerSummary(now, root)).toEqual(expect.arrayContaining([
      { status: "completed", count: 1, jev_calls: 1 },
      { status: "interrupted", count: 1, jev_calls: 0 },
    ]));
    expect(await recordVoiceUse("speech", 0, now, root)).toBe(false);
    expect(await recordVoiceUse("speech", 40, now, root)).toBe(true);
    expect(await claimDailyReview("2026-11-25", root)).toBe(true);
    expect(await claimDailyReview("2026-11-25", root)).toBe(false);
    await settleDailyReview("2026-11-25", "completed", root);
  });
});

describe.skipIf(!runtimeUrl || !ownerUrl)("runtime records in the database", () => {
  beforeEach(() => {
    vi.stubEnv("PAC_RUNTIME_RECORDS", "postgres");
    vi.stubEnv("PAC_RUNTIME_DATABASE_URL", runtimeUrl ?? "");
    vi.stubEnv("PAC_RUNTIME_DATABASE_SSL", "disable");
    const directory = mkdtempSync(path.join(os.tmpdir(), "records-"));
    directories.push(directory);
    vi.spyOn(process, "cwd").mockReturnValue(directory);
  });

  it("keeps the ledger in pac_dsd and writes nothing to disk", async () => {
    const ledger = openLedger();
    expect(ledger.kind).toBe("postgres");
    const now = new Date();
    const stale = await admitRun(ledger, new Date(now.getTime() - 300_000));
    const run = await admitRun(ledger, now);
    expect(run).toMatch(/^[0-9a-f-]{36}$/);
    await recordDecision(run, "learning");
    await finishRun(ledger, run, "needs_review");
    ledger.close();
    const summary = await ledgerSummary(now);
    expect(summary.find(row => row.status === "needs_review")?.jev_calls).toBeGreaterThanOrEqual(1);
    expect(summary.find(row => row.status === "interrupted")?.count).toBeGreaterThanOrEqual(1);
    expect(stale).not.toBe(run);
    expect(await recordVoiceUse("transcribe", 1, now)).toBe(true);
    const day = `2099-01-${String(1 + Math.floor(Math.random() * 28)).padStart(2, "0")}`;
    const first = await claimDailyReview(day);
    expect(await claimDailyReview(day)).toBe(false);
    if (first) await settleDailyReview(day, "completed");
  });

  it("saves, reads and undoes page edits, and survives a save from another server", async () => {
    const key = await savePageEdit({ path: "/about", kind: "text", original: "Old wording", occurrence: 0, value: "New wording", scope: "page" });
    expect((await readPageEdits("/about", { owner: false })).page[key]).toBe("New wording");

    // Another server saves in between: this server's next save must keep that edit, not overwrite it.
    const sql = runtimeSql({ databaseUrl: ownerUrl!, ssl: false });
    const [current] = await sql.unsafe<{ revision: string; body: Record<string, unknown> & { pages: Record<string, Record<string, unknown>> } }[]>(
      "select revision,body from pac_dsd.read_page_edit_document(-1)");
    const elsewhere = { ...current.body, pages: { ...current.body.pages, "/learn": { [key]: { kind: "text", original: "Old wording", value: "Saved elsewhere", occurrence: 0, updatedAt: new Date().toISOString() } } } };
    await sql.unsafe("select pac_dsd.write_page_edit_document($1::bigint,$2::text::jsonb)", [Number(current.revision), JSON.stringify(elsewhere)]);

    const second = await savePageEdit({ path: "/about", kind: "text", original: "Other wording", occurrence: 0, value: "Second edit", scope: "page" });
    const about = await readPageEdits("/about", { owner: true });
    expect(about.page).toMatchObject({ [key]: "New wording", [second]: "Second edit" });
    expect((await readPageEdits("/learn", { owner: true })).page[key]).toBe("Saved elsewhere");

    expect(await undoPageEdit({ path: "/about", key, scope: "page" })).toBe(true);
    expect((await readPageEdits("/about", { owner: false })).page[key]).toBeUndefined();
  });

  it("keeps the resource creation queue in pac_dsd with one leased job at a time", async () => {
    const marker = `test-${Date.now()}`;
    const input = { scope: "dsd" as const, resourcePath: `/library/${marker}`, title: "Queue test", kind: "quiz" as const, revision: marker };
    const first = await enqueueCreation(input);
    expect(first?.reused).toBe(false);
    expect((await enqueueCreation(input))?.job.id).toBe(first?.job.id);
    expect((await listCreationJobs("dsd")).some(job => job.id === first?.job.id)).toBe(true);
    expect(await findCreationJob(first!.job.id, "one-dhs")).toBeUndefined();
    const lease = await claimCreation();
    expect(lease?.token).toMatch(/^[0-9a-f-]{36}$/);
    expect(await claimCreation()).toBeNull(); // another job is running
    expect(await renewCreation(lease!)).toBe(true);
    expect(await saveCreationArtifact(lease!, { version: 1 } as never)).toBe(true);
    expect(await finishCreation(lease!, "ready", [])).toBe(true);
    expect(await finishCreation(lease!, "ready", [])).toBe(false);
    if (lease!.id === first!.job.id) expect((await findCreationJob(first!.job.id, "dsd"))?.status).toBe("ready");
  });
});
