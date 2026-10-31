import { z } from "zod";

export const ADSA_GOALS = [
  { id: "equity-goal-1", title: "Eliminate Disparities" },
  { id: "equity-goal-2", title: "Community Engagement" },
  { id: "equity-goal-3", title: "Hiring and Retention" },
  { id: "equity-goal-4", title: "Learning and Development" },
  { id: "equity-goal-5", title: "Contracts and Procurement" },
  { id: "equity-goal-6", title: "Communication and Accessibility" },
] as const;
export const goalIdSchema = z.enum(["equity-goal-1", "equity-goal-2", "equity-goal-3", "equity-goal-4", "equity-goal-5", "equity-goal-6"]);
const text = z.string().trim().min(1).max(6000);
const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/);
export const calendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Enter a valid calendar date.");
export const sourceSchema = z.object({
  id, title: z.string().trim().min(1).max(300), text: z.string().trim().min(1).max(50000),
  url: z.string().url().refine(value => {
    try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password; }
    catch { return false; }
  }, "Use a web address without embedded sign-in details.").optional(),
  date: calendarDateSchema.optional(),
}).strict();
export const analysisRequestSchema = z.object({
  title: z.string().trim().min(1).max(200), question: z.string().trim().min(1).max(2000),
  publicMaterialConfirmed: z.literal(true), publicResearch: z.boolean().default(false),
  scope: z.enum(["individual", "team", "division", "administration", "agency"]),
  kind: z.enum(["policy", "bill", "hcbs", "research", "workplace", "program"]),
  mode: z.enum(["actual", "practice"]),
  goals: z.array(goalIdSchema).max(6),
  sources: z.array(sourceSchema).min(1).max(12),
  context: z.string().trim().max(12000).optional(),
}).strict().superRefine((value, ctx) => {
  if (new Set(value.sources.map(source => source.id)).size !== value.sources.length)
    ctx.addIssue({ code: "custom", path: ["sources"], message: "Each source needs a different reference." });
  if (new Set(value.goals).size !== value.goals.length)
    ctx.addIssue({ code: "custom", path: ["goals"], message: "Choose each goal once." });
  if (value.sources.reduce((sum, source) => sum + source.text.length, 0) > 200000)
    ctx.addIssue({ code: "custom", path: ["sources"], message: "Use shorter excerpts or fewer sources." });
});
const citationSchema = z.object({ sourceId: id, excerpt: z.string().trim().min(1).max(2000) }).strict();
export const analysisResponseSchema = z.object({
  summary: text,
  findings: z.array(z.object({
    statement: text, kind: z.enum(["evidence", "inference", "gap"]),
    citations: z.array(citationSchema).max(12), reasoning: text,
    affectedGroups: z.array(text).max(20), goals: z.array(goalIdSchema).max(6),
  }).strict()).min(1).max(30),
  alternatives: z.array(z.object({ title: text, benefits: text, risks: text, evidenceNeeded: text }).strict()).min(2).max(8),
  recommendations: z.array(z.object({
    action: text, rationale: text, responsibleRole: text, measure: text,
    nextStep: text, goals: z.array(goalIdSchema).max(6),
    citations: z.array(citationSchema).max(12),
  }).strict()).min(1).max(15),
  limitations: z.array(text).min(1).max(20),
  questionsForReview: z.array(text).min(1).max(15),
}).strict();
export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;

const ANALYSIS_VALIDATION_MESSAGES = {
  response_shape: "The returned analysis does not match the required structure.",
  uncited_evidence: "An evidence finding must reference supplied material.",
  duplicate_goal: "Goal connections must use selected goals once each.",
  unselected_goal: "Goal connections must use selected goals once each.",
  unknown_source: "A reference does not match the supplied material.",
  quotation_mismatch: "A reference does not match the supplied material.",
} as const;
export class AnalysisValidationError extends Error {
  constructor(readonly code: keyof typeof ANALYSIS_VALIDATION_MESSAGES) {
    super(ANALYSIS_VALIDATION_MESSAGES[code]);
    this.name = "AnalysisValidationError";
  }
}

/** Reject invented references or quotations before presenting generated analysis. */
export function validateAnalysisResponse(input: unknown, request: AnalysisRequest): AnalysisResponse {
  const parsedRequest = analysisRequestSchema.parse(request);
  const checked = analysisResponseSchema.safeParse(input);
  if (!checked.success) throw new AnalysisValidationError("response_shape");
  const response = checked.data;
  const sources = new Map(parsedRequest.sources.map(source => [source.id, source]));
  for (const finding of response.findings) {
    if (finding.kind === "evidence" && finding.citations.length === 0)
      throw new AnalysisValidationError("uncited_evidence");
  }
  for (const entry of [...response.findings, ...response.recommendations]) {
    if (new Set(entry.goals).size !== entry.goals.length) throw new AnalysisValidationError("duplicate_goal");
    if (entry.goals.some(goal => !parsedRequest.goals.includes(goal))) throw new AnalysisValidationError("unselected_goal");
    for (const citation of entry.citations) {
      const source = sources.get(citation.sourceId);
      if (!source) throw new AnalysisValidationError("unknown_source");
      if (!source.text.includes(citation.excerpt)) throw new AnalysisValidationError("quotation_mismatch");
    }
  }
  return response;
}
