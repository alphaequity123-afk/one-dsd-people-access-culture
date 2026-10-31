import "server-only";

/** Explicit deployment opt-in; the DHS and DSD applications retain their current behavior. */
export function cloneAgentsEnabled() {
  return process.env.PAC_CLONE_AGENTS === "on";
}

export const CLONE_LIMITS = { dailyRequests: 20, monthlyRequests: 100, concurrentRequests: 2 } as const;
