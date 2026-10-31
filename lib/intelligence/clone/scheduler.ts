import "server-only";
import { openLedger } from "./ledger";
import { getPolicy } from "../policy";
import { runCycle } from "../agents/cycle";

const state = globalThis as typeof globalThis & { cloneSchedulerStarted?: boolean };
export async function runDailyReview() {
  if ((await getPolicy()).killed) return;
  const db = openLedger();
  try {
    db.exec("CREATE TABLE IF NOT EXISTS daily_review (day TEXT PRIMARY KEY,status TEXT NOT NULL)");
    const day = new Date().toISOString().slice(0, 10);
    const claim = db.prepare("INSERT OR IGNORE INTO daily_review(day,status) VALUES(?,'running')").run(day);
    if (!claim.changes) return;
    try {
      const result = await runCycle("cron");
      db.prepare("UPDATE daily_review SET status=? WHERE day=?").run(result.exceptions.length ? "needs_review" : "completed", day);
    } catch { db.prepare("UPDATE daily_review SET status='failed' WHERE day=?").run(day); }
  } finally { db.close(); }
}

export function startCloneScheduler() {
  if (state.cloneSchedulerStarted) return;
  state.cloneSchedulerStarted = true;
  const tick = () => { void runDailyReview().catch(() => console.warn("clone_daily_review_unavailable")); };
  setTimeout(tick, 60_000).unref();
  setInterval(tick, 60 * 60 * 1000).unref();
}
