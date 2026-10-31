/** A durable daily claim prevents repeats across restarts of the single clone replica. */
export async function register() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.PAC_CLONE_AGENTS === "on" && process.env.PAC_CLONE_DAILY_REVIEW === "on") {
    const { startCloneScheduler } = await import("./lib/intelligence/clone/scheduler");
    startCloneScheduler();
  }
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production" && process.env.PAC_CLONE_AGENTS === "on") {
    void import("./lib/intelligence/retrieval/local-semantic").then(({ warmLocalSemantic }) => warmLocalSemantic()).catch(() => { /* Ask reports this itself and answers without it. */ });
  }
}
