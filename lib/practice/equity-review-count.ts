import { reviewResources, structuralReviewResource } from "@/lib/program/review-resources";

/**
 * Anonymous practice count for completed equity reviews (owner decision:
 * "totals only, no identities"). Each completed review adds one to a few
 * monthly totals. Nothing about the person, their unit or county, or what they
 * wrote is sent or stored. Shared by the browser and the server.
 */
/**
 * One DSD keeps its own database (pac_dsd). Its runtime_counters table accepts
 * only consultation reference numbers, so these totals would be refused there.
 * The owner's rule is to leave counting off rather than change the database:
 * while this is false, nothing is sent, written or shown as counted.
 */
export const PRACTICE_COUNTERS_ENABLED = false;

export const EQUITY_REVIEW_COUNT_PATH = "/api/practice/equity-review-completed";

export const EQUITY_REVIEW_TOOLS = ["general", "hcbs", "structural"] as const;
export type EquityReviewTool = (typeof EQUITY_REVIEW_TOOLS)[number];

export const EQUITY_REVIEW_TOOL_TITLES: Record<EquityReviewTool, string> = {
  general: reviewResources[0].title,
  hcbs: reviewResources[1].title,
  structural: structuralReviewResource.title,
};

/**
 * Tools that currently send a count when a review is finished. The policy and
 * home and community-based services reviews are fixed release files; adding the
 * count to them needs a new release of those files.
 */
export const EQUITY_REVIEW_TOOLS_COUNTED: readonly EquityReviewTool[] = ["structural"];

export const DECISION_TYPES = ["referral", "placement", "contract", "intake", "communication", "policy", "other"] as const;
export type DecisionType = (typeof DECISION_TYPES)[number];

export const DECISION_TYPE_LABELS: Record<DecisionType, string> = {
  referral: "Referral",
  placement: "Placement",
  contract: "Contract",
  intake: "Intake",
  communication: "Communication",
  policy: "Policy",
  other: "Other",
};

export const EQUITY_GOAL_NUMBERS = [1, 2, 3, 4, 5, 6] as const;

export const EQUITY_REVIEW_COUNT_NOTICE =
  "When you finish, one is added to an anonymous count of completed reviews. Nothing about who you are or what you wrote is recorded.";

export type EquityReviewCompletion = {
  tool: EquityReviewTool;
  goals?: number[];
  decisionType?: DecisionType;
};

export const PRACTICE_SCOPE_PREFIX = "practice:equity-review:";

/** Calendar month in Minnesota time, as YYYY-MM. */
export function practiceMonth(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit" }).formatToParts(now);
  const year = parts.find(part => part.type === "year")?.value;
  const month = parts.find(part => part.type === "month")?.value;
  if (!year || !month || !/^\d{4}$/.test(year) || !/^\d{2}$/.test(month)) throw new Error("The month could not be determined.");
  return `${year}-${month}`;
}

/** Counter keys for one completed review: month x tool, month x each goal, month x decision type. */
export function practiceScopes(event: EquityReviewCompletion, now: Date): string[] {
  const month = practiceMonth(now);
  const base = `${PRACTICE_SCOPE_PREFIX}${month}:`;
  return [
    `${base}tool:${event.tool}`,
    ...[...new Set(event.goals ?? [])].sort((a, b) => a - b).map(goal => `${base}goal:${goal}`),
    ...(event.decisionType ? [`${base}decision:${event.decisionType}`] : []),
  ];
}

/**
 * Browser helper: send one anonymous count. Never throws and never blocks the
 * person's work; a failed count is simply not added.
 */
export function sendEquityReviewCompletion(event: EquityReviewCompletion): void {
  if (!PRACTICE_COUNTERS_ENABLED) return;
  try {
    const body: EquityReviewCompletion = { tool: event.tool };
    if (event.goals?.length) body.goals = [...new Set(event.goals)].sort((a, b) => a - b);
    if (event.decisionType) body.decisionType = event.decisionType;
    void fetch(EQUITY_REVIEW_COUNT_PATH, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      credentials: "omit",
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Counting is optional; the review continues either way.
  }
}
