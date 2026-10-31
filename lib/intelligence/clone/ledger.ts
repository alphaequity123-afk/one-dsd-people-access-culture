import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";


/** Single-replica pilot ledger on the clone's persistent volume. No prompts, names or answers. */
export function openLedger(root = join(process.cwd(), ".data")) {
  mkdirSync(root, { recursive: true });
  const db = new DatabaseSync(join(root, "clone-agents.sqlite"));
  db.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, started TEXT NOT NULL, finished TEXT, status TEXT NOT NULL, route TEXT, jev_calls INTEGER NOT NULL DEFAULT 0)");
  return db;
}

export function admitRun(db: DatabaseSync, now = new Date()) {
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

export function finishRun(db: DatabaseSync, id: string, status: "completed" | "needs_review" | "refused" | "failed") {
  db.prepare("UPDATE runs SET status=?,finished=? WHERE id=? AND status='running'").run(status, new Date().toISOString(), id);
}

export function recordDecision(id: string, route?: string) {
  const db = openLedger();
  try { db.prepare("UPDATE runs SET jev_calls=jev_calls+1,route=coalesce(?,route) WHERE id=?").run(route ?? null, id); }
  finally { db.close(); }
}

export function ledgerSummary() {
  const db = openLedger();
  try {
    return db.prepare("SELECT status,count(*) AS count,sum(jev_calls) AS jev_calls FROM runs WHERE started >= ? GROUP BY status")
      .all(new Date().toISOString().slice(0, 7)) as Array<{ status: string; count: number; jev_calls: number }>;
  } finally { db.close(); }
}
