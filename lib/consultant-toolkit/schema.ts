import { z } from "zod";
import { getQuestions, TOOLKIT_VERSION } from "./instrument";

export const TOOLKIT_LIMITS = { sources: 40, sourceCharacters: 120_000, totalSourceCharacters: 360_000, answerCharacters: 12_000 } as const;
const id = z.string().min(1).max(160).regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/, "Use a stable source or question identifier.");
const inputText = (max: number) => z.string().max(max);
const markdownOrHtml = /```|\*\*[^*]+\*\*|__[^_]+__|\[[^\]]+\]\([^)]*\)|<\/?[a-z][^>]*>|(^|\n)\s{0,3}(?:#{1,6}\s|[-*+]\s|>\s|\d+[.)]\s)/im;
export function isPlainReportText(value: string): boolean { return !markdownOrHtml.test(value) && !value.includes("`"); }
const reportText = (max = 12_000) => z.string().trim().min(1).max(max).refine(isPlainReportText, "Use plain prose without Markdown or HTML formatting.");
const httpUrl = z.string().max(2048).url().refine(value => {
  const parsed = new URL(value);
  return ["https:", "http:"].includes(parsed.protocol) && !parsed.username && !parsed.password;
}, "Use an HTTP or HTTPS source address without credentials.");

export const toolkitSourceSchema = z.object({
  id, title: z.string().trim().min(1).max(500), text: z.string().min(1).max(TOOLKIT_LIMITS.sourceCharacters),
  url: httpUrl.optional(), date: z.string().max(100).optional(),
  // Missing origin preserves legacy user-supplied evidence. Retrieval refreshes marked context on generation.
  origin: z.enum(["user", "application-context"]).optional(),
}).strict();
export const toolkitRoutingSchema = z.object({
  priorAnalysisIntegrated: z.boolean().default(false), materialChange: z.boolean().default(false),
  knownDisparities: z.boolean().default(false), timeLimited: z.boolean().default(false),
}).strict();
export const toolkitRequestSchema = z.object({
  title: z.string().trim().min(1).max(240), question: z.string().trim().min(1).max(12_000),
  context: inputText(20_000).default(""), track: z.enum(["scan", "full"]),
  scope: z.enum(["agency", "administration", "division", "team", "individual"]).default("division"),
  programs: z.array(z.string().trim().min(1).max(300)).max(40).default([]),
  goals: z.array(z.string().trim().min(1).max(300)).max(20).default([]),
  sources: z.array(toolkitSourceSchema).max(TOOLKIT_LIMITS.sources).default([]),
  routing: toolkitRoutingSchema.default({ priorAnalysisIntegrated: false, materialChange: false, knownDisparities: false, timeLimited: false }),
  answers: z.record(id, inputText(TOOLKIT_LIMITS.answerCharacters)).default({}),
}).strict().superRefine((value, ctx) => {
  const seen = new Set<string>();
  value.sources.forEach((source, index) => {
    if (seen.has(source.id)) ctx.addIssue({ code: "custom", path: ["sources", index, "id"], message: "Source identifiers must be unique." });
    seen.add(source.id);
  });
  if (value.sources.reduce((total, source) => total + source.text.length, 0) > TOOLKIT_LIMITS.totalSourceCharacters) {
    ctx.addIssue({ code: "custom", path: ["sources"], message: "Source text exceeds the per-analysis processing limit. Select smaller excerpts and disclose what was omitted." });
  }
  const expected = new Set(getQuestions(value.track).map(question => question.id));
  for (const key of Object.keys(value.answers)) if (!expected.has(key)) ctx.addIssue({ code: "custom", path: ["answers", key], message: "Answer does not belong to the selected instrument." });
});
export type ToolkitRequest = z.infer<typeof toolkitRequestSchema>;
export type ToolkitSource = z.infer<typeof toolkitSourceSchema>;

export const toolkitCitationSchema = z.object({ sourceId: id, excerpt: z.string().min(1).max(2_000) }).strict();
export const toolkitAnswerSchema = z.object({
  questionId: id, text: reportText(), kind: z.enum(["evidence", "inference", "gap"]),
  citations: z.array(toolkitCitationSchema).max(12),
}).strict();
export const toolkitResponseSchema = z.object({
  summary: reportText(6_000), answers: z.array(toolkitAnswerSchema).min(1).max(50),
  alternatives: z.array(z.object({ title: reportText(500), benefits: reportText(4_000), burdens: reportText(4_000), evidenceNeeded: reportText(4_000) }).strict()).max(8),
  actions: z.array(z.object({
    action: reportText(4_000), responsibleRole: reportText(1_000), dueDate: reportText(200),
    resources: reportText(4_000), measure: reportText(4_000), followUp: reportText(4_000),
  }).strict()).max(30),
  limitations: z.array(reportText(2_000)).max(30), questionsForReview: z.array(reportText(2_000)).max(30),
}).strict();
export type ToolkitResponse = z.infer<typeof toolkitResponseSchema>;

type ValidationIssue = { path: (string | number)[]; message: string };
function responseIssues(request: ToolkitRequest, response: ToolkitResponse): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const expected = new Set(getQuestions(request.track).map(question => question.id));
  const seen = new Set<string>();
  const sources = new Map(request.sources.map(source => [source.id, source.text]));
  response.answers.forEach((answer, index) => {
    if (!expected.has(answer.questionId)) issues.push({ path: ["answers", index, "questionId"], message: "Unknown question for this instrument." });
    if (seen.has(answer.questionId)) issues.push({ path: ["answers", index, "questionId"], message: "Each instrument question must have exactly one answer." });
    seen.add(answer.questionId);
    if (answer.kind === "evidence" && answer.citations.length === 0) issues.push({ path: ["answers", index, "citations"], message: "An evidence answer requires a verifiable source quotation." });
    answer.citations.forEach((citation, citationIndex) => {
      const source = sources.get(citation.sourceId);
      const path = ["answers", index, "citations", citationIndex];
      if (source === undefined) issues.push({ path: [...path, "sourceId"], message: "Citation source was not supplied with this analysis." });
      else if (!citation.excerpt.trim() || !source.includes(citation.excerpt)) issues.push({ path: [...path, "excerpt"], message: "Citation must quote an exact, nonempty passage from its supplied source." });
    });
  });
  for (const questionId of expected) if (!seen.has(questionId)) issues.push({ path: ["answers"], message: `Missing answer for ${questionId}; record a gap if evidence is unavailable.` });
  if (response.answers.some(answer => answer.kind === "gap") && response.limitations.length === 0) issues.push({ path: ["limitations"], message: "Include evidence gaps in the limitations." });
  return issues;
}
/** Does not infer truth from a valid quote; substantive claims still require consultant review. */
export function validateToolkitResponse(requestInput: unknown, responseInput: unknown): ToolkitResponse {
  const request = toolkitRequestSchema.parse(requestInput);
  const response = toolkitResponseSchema.parse(responseInput);
  const issues = responseIssues(request, response);
  if (issues.length) throw new z.ZodError(issues.map(issue => ({ code: "custom" as const, ...issue })));
  const order = new Map(getQuestions(request.track).map((question, index) => [question.id, index]));
  return { ...response, answers: [...response.answers].sort((a, b) => order.get(a.questionId)! - order.get(b.questionId)!) };
}

export const casePayloadSchema = z.object({ request: toolkitRequestSchema, result: toolkitResponseSchema.nullable() }).strict().superRefine((value, ctx) => {
  if (value.result) for (const issue of responseIssues(value.request, value.result)) ctx.addIssue({ code: "custom", path: ["result", ...issue.path], message: issue.message });
});
export type CasePayload = z.infer<typeof casePayloadSchema>;
export const toolkitCaseSchema = z.object({
  id, version: z.number().int().positive(), status: z.enum(["draft", "review", "final"]), title: z.string().trim().min(1).max(240),
  instrumentVersion: z.literal(TOOLKIT_VERSION, { error: "This case uses a different toolkit instrument version. Open it with a compatible version before reviewing or exporting." }).default(TOOLKIT_VERSION),
  request: toolkitRequestSchema, result: toolkitResponseSchema.nullable(),
  createdAt: z.string().datetime(), updatedAt: z.string().datetime(), finalizedAt: z.string().datetime().nullable(),
}).strict().superRefine((value, ctx) => {
  if (value.title !== value.request.title) ctx.addIssue({ code: "custom", path: ["title"], message: "Case title must match the saved request." });
  if (value.status !== "draft" && !value.result) ctx.addIssue({ code: "custom", path: ["result"], message: "A reviewed or final case must contain an analysis." });
  if ((value.status === "final") !== (value.finalizedAt !== null)) ctx.addIssue({ code: "custom", path: ["finalizedAt"], message: "Only a final case has a finalization timestamp." });
  if (value.result) for (const issue of responseIssues(value.request, value.result)) ctx.addIssue({ code: "custom", path: ["result", ...issue.path], message: issue.message });
});
export type ToolkitCase = z.infer<typeof toolkitCaseSchema>;
