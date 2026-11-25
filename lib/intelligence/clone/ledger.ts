import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { RuntimeSql } from "@/lib/db/runtime-client";
import { runtimeRecordsSql, runtimeRecordsStore } from "@/lib/db/runtime-records";

/**
 * The Ask pilot's operational counts: runs, voice use and the daily review claim. No prompts, names
 * or answers are kept.
 *
 * Where they live is set by PAC_RUNTIME_RECORDS. "volume" (the default) keeps today's SQLite file
 * on the service's persistent volume. "postgres" keeps them in pac_dsd through the restricted runtime
 * connection (db/standalone/0073_pac_dsd_volume_free_runtime_records.sql), so the service can run
 * without a volume and updates can overlap. A misconfigured "postgres" fails loudly instead of
 * quietly writing to a disk that a restart would erase.
 */
export type RunStatus = "completed" | "needs_review" | "refused" | "failed";
export type VoiceKind = "speech" | "transcribe";
export type DailyReviewStatus = "completed" | "needs_review" | "failed";
export type LedgerSummaryRow = { status: string; count: number; jev_calls: number };

/** A handle for one request. Close it when the request is done; closing never ends the shared database pool. */
export type Ledger =
  | { readonly kind: "volume"; readonly db: DatabaseSync; close(): void }
  | { readonly kind: "postgres"; readonly sql: RuntimeSql; close(): void };

function openVolumeLedger(root: string): DatabaseSync {
  mkdirSync(root, { recursive: true });
  const db = new DatabaseSync(join(root, "clone-agents.sqlite"));
  db.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, started TEXT NOT NULL, finished TEXT, status TEXT NOT NULL, route TEXT, jev_calls INTEGER NOT NULL DEFAULT 0)");
  return db;
}

export function openLedger(root = join(process.cwd(), ".data")): Ledger {
  if (runtimeRecordsStore() === "postgres") return { kind: "postgres", sql: runtimeRecordsSql(), close() {} };
  const db = openVolumeLedger(root);
  return { kind: "volume", db, close: () => db.close() };
}

async function withLedger<T>(work: (ledger: Ledger) => Promise<T> | T, root?: string): Promise<T> {
  const ledger = openLedger(root);
  try { return await work(ledger); } finally { ledger.close(); }
}

export async function admitRun(ledger: Ledger, now = new Date()): Promise<string> {
  if (ledger.kind === "postgres") {
    const rows = await ledger.sql.unsafe<{ id: string }[]>("select pac_dsd.admit_clone_agent_run($1::timestamptz)::text as id", [now.toISOString()]);
    return rows[0].id;
  }
  const db = ledger.db;
  const at = now.toISOString();
  db.exec("BEGIN IMMEDIATE");
  try {
    // Abandoned requests remain charged against the allowance, including after restarts.
    db.prepare("UPDATE runs SET status='interrupted', finished=? WHERE status='running' AND started < ?")
      .run(at, new Date(now.getTime() - 240_000).toISOString());
    // Every question is admitted: Ask carries no daily, monthly or concurrent allowance. Runs are still recorded.
    const id = randomUUID();
    db.prepare("INSERT INTO runs(id,started,status) VALUES(?,?,'running')").run(id, at);
    db.exec("COMMIT");
    return id;
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

export async function finishRun(ledger: Ledger, id: string, status: RunStatus): Promise<void> {
  if (ledger.kind === "postgres") {
    await ledger.sql.unsafe("select pac_dsd.finish_clone_agent_run($1::uuid,$2::text)", [id, status]);
    return;
  }
  ledger.db.prepare("UPDATE runs SET status=?,finished=? WHERE id=? AND status='running'").run(status, new Date().toISOString(), id);
}

export function recordDecision(id: string, route?: string, root?: string): Promise<void> {
  return withLedger(async (ledger) => {
    if (ledger.kind === "postgres") {
      await ledger.sql.unsafe("select pac_dsd.record_clone_agent_decision($1::uuid,$2::text)", [id, route ?? null]);
      return;
    }
    ledger.db.prepare("UPDATE runs SET jev_calls=jev_calls+1,route=coalesce(?,route) WHERE id=?").run(route ?? null, id);
  }, root);
}

/** Record voice use before network work. Nothing is refused for volume; zero units is not a use. */
export function recordVoiceUse(kind: VoiceKind, units: number, now = new Date(), root?: string): Promise<boolean> {
  if (!(units > 0)) return Promise.resolve(false);
  return withLedger(async (ledger) => {
    if (ledger.kind === "postgres") {
      const rows = await ledger.sql.unsafe<{ recorded: boolean }[]>("select pac_dsd.record_clone_voice_use($1::text,$2::integer,$3::timestamptz) as recorded", [kind, Math.ceil(units), now.toISOString()]);
      return rows[0].recorded === true;
    }
    ledger.db.exec("CREATE TABLE IF NOT EXISTS voice_usage (at TEXT NOT NULL, kind TEXT NOT NULL, units INTEGER NOT NULL)");
    ledger.db.prepare("INSERT INTO voice_usage(at,kind,units) VALUES(?,?,?)").run(now.toISOString(), kind, units);
    return true;
  }, root);
}

/** Claim a day's review. Only the first claim for a day succeeds, across restarts and replicas. */
export function claimDailyReview(day: string, root?: string): Promise<boolean> {
  return withLedger(async (ledger) => {
    if (ledger.kind === "postgres") {
      const rows = await ledger.sql.unsafe<{ claimed: boolean }[]>("select pac_dsd.claim_clone_daily_review($1::date) as claimed", [day]);
      return rows[0].claimed === true;
    }
    ledger.db.exec("CREATE TABLE IF NOT EXISTS daily_review (day TEXT PRIMARY KEY,status TEXT NOT NULL)");
    return ledger.db.prepare("INSERT OR IGNORE INTO daily_review(day,status) VALUES(?,'running')").run(day).changes > 0;
  }, root);
}

export function settleDailyReview(day: string, status: DailyReviewStatus, root?: string): Promise<void> {
  return withLedger(async (ledger) => {
    if (ledger.kind === "postgres") {
      await ledger.sql.unsafe("select pac_dsd.settle_clone_daily_review($1::date,$2::text)", [day, status]);
      return;
    }
    ledger.db.prepare("UPDATE daily_review SET status=? WHERE day=?").run(status, day);
  }, root);
}

export function ledgerSummary(now = new Date(), root?: string): Promise<LedgerSummaryRow[]> {
  const month = now.toISOString().slice(0, 7);
  return withLedger(async (ledger) => {
    if (ledger.kind === "postgres") {
      const rows = await ledger.sql.unsafe<{ status: string; count: string | number; jev_calls: string | number | null }[]>(
        "select status,count,jev_calls from pac_dsd.summarize_clone_agent_runs($1::timestamptz)", [`${month}-01T00:00:00.000Z`]);
      return rows.map(row => ({ status: row.status, count: Number(row.count), jev_calls: Number(row.jev_calls ?? 0) }));
    }
    return ledger.db.prepare("SELECT status,count(*) AS count,sum(jev_calls) AS jev_calls FROM runs WHERE started >= ? GROUP BY status")
      .all(month) as LedgerSummaryRow[];
  }, root);
}
