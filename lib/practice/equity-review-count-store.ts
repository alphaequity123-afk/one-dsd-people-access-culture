import "server-only";

import { z } from "zod";
import {
  DECISION_TYPES,
  EQUITY_GOAL_NUMBERS,
  EQUITY_REVIEW_TOOLS,
  PRACTICE_COUNTERS_ENABLED,
  practiceMonth,
  type DecisionType,
  type EquityReviewCompletion,
  type EquityReviewTool,
} from "./equity-review-count";

/** Strict request body: closed vocabularies only, no free text and no extra fields. */
export const EquityReviewCompletionSchema = z.object({
  tool: z.enum(EQUITY_REVIEW_TOOLS),
  goals: z.array(z.number().int().min(1).max(6)).max(6)
    .refine(goals => new Set(goals).size === goals.length, "Each goal may appear once.")
    .optional(),
  decisionType: z.enum(DECISION_TYPES).optional(),
}).strict();

/**
 * Add one completed review to the anonymous monthly totals. One DSD's database
 * refuses these keys (see PRACTICE_COUNTERS_ENABLED), so nothing is written and
 * the result says so.
 */
export async function recordEquityReviewCompletion(_event: EquityReviewCompletion, _now = new Date()): Promise<boolean> {
  if (!PRACTICE_COUNTERS_ENABLED) return false;
  return false;
}

export type EquityReviewTotals = {
  total: number;
  byMonth: { month: string; count: number }[];
  lastThreeMonths: { month: string; count: number }[];
  byTool: Record<EquityReviewTool, number>;
  byGoal: Record<number, number>;
  byDecisionType: Record<DecisionType, number>;
};

/** Calendar months back from now, newest first. */
export function previousMonths(now: Date, count: number): string[] {
  const [year, month] = practiceMonth(now).split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - index, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

/** Totals by month, tool, goal and decision type, or null while counting is off. */
export async function readEquityReviewTotals(now = new Date()): Promise<EquityReviewTotals | null> {
  if (!PRACTICE_COUNTERS_ENABLED) return null;
  return {
    total: 0, byMonth: [], lastThreeMonths: previousMonths(now, 3).map(month => ({ month, count: 0 })),
    byTool: Object.fromEntries(EQUITY_REVIEW_TOOLS.map(tool => [tool, 0])) as Record<EquityReviewTool, number>,
    byGoal: Object.fromEntries(EQUITY_GOAL_NUMBERS.map(goal => [goal, 0])),
    byDecisionType: Object.fromEntries(DECISION_TYPES.map(type => [type, 0])) as Record<DecisionType, number>,
  };
}
