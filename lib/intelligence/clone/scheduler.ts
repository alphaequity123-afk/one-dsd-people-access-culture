import "server-only";
import { claimDailyReview, settleDailyReview } from "./ledger";
import { getPolicy } from "../policy";
import { runCycle } from "../agents/cycle";

const state = globalThis as typeof globalThis & { cloneSchedulerStarted?: boolean };
export async function runDailyReview() {
  if ((await getPolicy()).killed) return;
  const day = new Date().toISOString().slice(0, 10);
  if (!(await claimDailyReview(day))) return;
  let status: "completed" | "needs_review" | "failed";
  try {
    const result = await runCycle("cron");
    status = result.exceptions.length ? "needs_review" : "completed";
  } catch { status = "failed"; }
  await settleDailyReview(day, status);
}

export function startCloneScheduler() {
  if (state.cloneSchedulerStarted) return;
  state.cloneSchedulerStarted = true;
  const tick = () => { void runDailyReview().catch(() => console.warn("clone_daily_review_unavailable")); };
  setTimeout(tick, 60_000).unref();
  setInterval(tick, 60 * 60 * 1000).unref();
}
