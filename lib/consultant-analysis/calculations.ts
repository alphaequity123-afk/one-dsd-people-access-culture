import { z } from "zod";
import { calendarDateSchema } from "./schema";

const number = z.number().finite().min(0).max(Number.MAX_SAFE_INTEGER);
export const measureSchema = z.object({
  label: z.string().trim().min(1).max(300),
  unit: z.enum(["count", "percent", "rate", "days", "dollars"]),
  value: number.nullable(), numerator: number.nullable().optional(), denominator: number.nullable().optional(),
  periodStart: calendarDateSchema, periodEnd: calendarDateSchema,
  sourceId: z.string().trim().min(1).max(80),
}).strict().superRefine((measure, ctx) => {
  if (measure.periodEnd < measure.periodStart) ctx.addIssue({ code: "custom", message: "The reporting period ends before it starts." });
  if (measure.unit === "percent" && measure.value !== null && measure.value > 100) ctx.addIssue({ code: "custom", message: "A percentage must be between zero and 100." });
  if (measure.unit === "rate" && measure.value !== null && measure.value > 1) ctx.addIssue({ code: "custom", message: "A proportion must be between zero and one." });
  if (measure.unit === "count" && measure.value !== null && !Number.isSafeInteger(measure.value)) ctx.addIssue({ code: "custom", message: "A count must be a whole number." });
  if ((measure.unit === "percent" || measure.unit === "rate") && measure.value !== null) {
    if (measure.denominator == null || measure.denominator <= 0 || measure.numerator == null)
      ctx.addIssue({ code: "custom", message: "A known proportion needs a numerator and positive denominator." });
    else {
      const calculated = measure.numerator / measure.denominator * (measure.unit === "percent" ? 100 : 1);
      if (measure.numerator > measure.denominator || Math.abs(calculated - measure.value) > 0.01)
        ctx.addIssue({ code: "custom", message: "The value does not match its numerator and denominator." });
    }
  }
});
export type AggregateMeasure = z.infer<typeof measureSchema>;
export function calculateGap(currentInput: AggregateMeasure, target: number | null, direction: "increase" | "decrease") {
  const current = measureSchema.parse(currentInput);
  if (target !== null && (!Number.isFinite(target) || target < 0 || target > Number.MAX_SAFE_INTEGER || (current.unit === "percent" && target > 100) || (current.unit === "rate" && target > 1) || (current.unit === "count" && !Number.isSafeInteger(target))))
    throw new Error("Enter a valid target in the same unit.");
  if (current.value === null || target === null) return { status: "unknown" as const, gap: null, targetMet: null, unit: current.unit };
  const gap = direction === "increase" ? target - current.value : current.value - target;
  return { status: "known" as const, gap, targetMet: gap <= 0, unit: current.unit };
}
/** Arithmetic scenario only; this does not establish a forecast or causal effect. */
export function calculateScenario(baseline: number | null, changePercent: number) {
  if (!Number.isFinite(changePercent) || changePercent < -100 || changePercent > 1000) throw new Error("Enter a change between minus 100 and 1,000 percent.");
  if (baseline === null) return { status: "unknown" as const, value: null, kind: "scenario" as const };
  number.parse(baseline);
  const value = baseline * (1 + changePercent / 100);
  if (!Number.isFinite(value) || value > Number.MAX_SAFE_INTEGER) throw new Error("The scenario exceeds supported values.");
  return { status: "known" as const, value, kind: "scenario" as const };
}

export const REVIEW_CRITERIA = [
  { id: "perspectives", title: "Affected people and missing perspectives" },
  { id: "barriers", title: "Unequal impacts and systemic barriers" },
  { id: "evidence", title: "Evidence and its limits" },
  { id: "alternatives", title: "Alternatives and trade-offs" },
  { id: "action", title: "Responsibility and measurable follow-through" },
] as const;
export const rubricReviewSchema = z.object({
  criterion: z.enum(["perspectives", "barriers", "evidence", "alternatives", "action"]),
  status: z.enum(["supported", "developing", "not-addressed", "not-applicable"]),
  evidence: z.string().trim().max(6000), feedback: z.string().trim().min(1).max(6000),
}).strict().superRefine((value, ctx) => {
  if (value.status === "supported" && !value.evidence) ctx.addIssue({ code: "custom", message: "Explain what supports this feedback." });
});
/** Summarizes reviewed work; deliberately produces no person rating or IDI classification. */
export function summarizeReview(input: unknown) {
  const reviews = z.array(rubricReviewSchema).length(REVIEW_CRITERIA.length).parse(input);
  if (new Set(reviews.map(review => review.criterion)).size !== REVIEW_CRITERIA.length) throw new Error("Review each criterion once.");
  return { reviewed: reviews.length, supported: reviews.filter(review => review.status === "supported").length,
    needsAttention: reviews.filter(review => ["developing", "not-addressed"].includes(review.status)).map(review => review.criterion), reviews };
}
