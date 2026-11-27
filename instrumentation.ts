/** A durable daily claim prevents repeats across restarts of the single clone replica. */
export async function register() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") {
    void import("./lib/learning/resource-creation-worker").then(({ startResourceCreationWorker }) => startResourceCreationWorker())
      .catch(() => console.warn("resource_creation_worker_unavailable"));
  }
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production" && process.env.PAC_SEARCH_WARMUP !== "off") {
    // The first search after a restart loaded the search modules and read the published library
    // while the person waited (11.4 s on 2026-11-27). One read-only search shortly after startup
    // does that work in the background instead. It stores nothing and records no query.
    setTimeout(() => {
      void import("./lib/search/site-search").then(async ({ siteSearch }) => {
        for (const scope of ["dsd", "one-dhs"] as const) await siteSearch("leadership", scope, 8);
      }).catch(() => console.warn("search_warmup_unavailable"));
    }, 5_000).unref?.();
  }
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.PAC_CLONE_AGENTS === "on" && process.env.PAC_CLONE_DAILY_REVIEW === "on") {
    const { startCloneScheduler } = await import("./lib/intelligence/clone/scheduler");
    startCloneScheduler();
  }
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production" && process.env.PAC_CLONE_AGENTS === "on") {
    void import("./lib/intelligence/retrieval/local-semantic").then(({ warmLocalSemantic }) => warmLocalSemantic()).catch(() => { /* Ask reports this itself and answers without it. */ });
  }
}
