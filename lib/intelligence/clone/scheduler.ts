import "server-only";
import { getPolicy } from "../policy";
import { runCycle } from "../agents/cycle";

const state = globalThis as typeof globalThis & { cloneSchedulerStarted?: boolean; cloneReviewDay?: string };
export async function runDailyReview() {
  if ((await getPolicy()).killed) return;
  // One review a day, claimed in memory: the single replica needs no stored record of it.
  const day = new Date().toISOString().slice(0, 10);
  if (state.cloneReviewDay === day) return;
  state.cloneReviewDay = day;
  try { await runCycle("cron"); } catch { console.warn("clone_daily_review_failed"); }
}

export function startCloneScheduler() {
  if (state.cloneSchedulerStarted) return;
  state.cloneSchedulerStarted = true;
  const tick = () => { void runDailyReview().catch(() => console.warn("clone_daily_review_unavailable")); };
  setTimeout(tick, 60_000).unref();
  setInterval(tick, 60 * 60 * 1000).unref();
}
