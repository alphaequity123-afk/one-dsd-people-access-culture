import { z } from "zod";

// Shared contract for the staff "Analyze a document" workspace.
//
// Owner rules this contract enforces by shape:
// - nothing a person uploads or pastes is stored on the server; sources travel
//   with the request and the result returns to the browser only;
// - every answer is typed evidence, inference or gap, and evidence must quote
//   the supplied sources verbatim;
// - guidance links point only at pages that exist in this program;
// - plain language, full names, never the words "AI" or "tutor" in visible text.

export const ANALYSIS_LIMITS = {
  sources: 12,
  sourceCharacters: 50_000,
  totalSourceCharacters: 240_000,
  contextCharacters: 2_000,
  titleCharacters: 300,
  answerCharacters: 4_000,
  excerptCharacters: 1_200,
} as const;

export const INSTRUMENT_IDS = [
  "equity-analysis",
  "policy-review",
  "program-analysis",
  "engagement-plan",
  "plain-language",
  "working-group-plan",
] as const;
export type InstrumentId = (typeof INSTRUMENT_IDS)[number];

const id = z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/);

export const analysisSourceSchema = z.object({
  id: id,
  title: z.string().trim().min(1).max(ANALYSIS_LIMITS.titleCharacters),
  text: z.string().min(1).max(ANALYSIS_LIMITS.sourceCharacters),
  /** A reading note from extraction, such as pages that had no selectable text. */
  note: z.string().max(2_000).optional(),
}).strict();
export type AnalysisSource = z.infer<typeof analysisSourceSchema>;

export const analysisRequestSchema = z.object({
  instrumentId: z.enum(INSTRUMENT_IDS),
  sources: z.array(analysisSourceSchema).min(1).max(ANALYSIS_LIMITS.sources),
  /** What the person wants to know or decide; optional. */
  context: z.string().trim().max(ANALYSIS_LIMITS.contextCharacters).optional(),
  /** A Minnesota community page id, when the work concerns one community. */
  communityId: z.string().regex(/^[a-z0-9-]{1,60}$/).optional(),
}).strict().superRefine((value, ctx) => {
  const total = value.sources.reduce((sum, source) => sum + source.text.length, 0);
  if (total > ANALYSIS_LIMITS.totalSourceCharacters) ctx.addIssue({ code: "custom", path: ["sources"], message: "The sources together hold too much text. Remove one, or paste shorter excerpts." });
  if (new Set(value.sources.map(source => source.id)).size !== value.sources.length) ctx.addIssue({ code: "custom", path: ["sources"], message: "Each source needs its own id." });
});
export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;

export const ANSWER_KINDS = ["evidence", "inference", "gap"] as const;
export type AnswerKind = (typeof ANSWER_KINDS)[number];

export const analysisCitationSchema = z.object({
  sourceId: id,
  /** Verbatim text from that source. The server drops any excerpt it cannot find. */
  excerpt: z.string().min(1).max(ANALYSIS_LIMITS.excerptCharacters),
}).strict();

export const analysisAnswerSchema = z.object({
  questionId: id,
  kind: z.enum(ANSWER_KINDS),
  text: z.string().min(1).max(ANALYSIS_LIMITS.answerCharacters),
  citations: z.array(analysisCitationSchema).max(6),
}).strict();
export type AnalysisAnswer = z.infer<typeof analysisAnswerSchema>;

/** What the model returns. The server validates citations and adds next steps itself. */
export const analysisDraftSchema = z.object({
  summary: z.string().min(1).max(ANALYSIS_LIMITS.answerCharacters),
  answers: z.array(analysisAnswerSchema).min(1).max(60),
  /** Things the sources do not settle, in plain language. */
  limitations: z.array(z.string().min(1).max(600)).max(12),
}).strict();
export type AnalysisDraft = z.infer<typeof analysisDraftSchema>;

export const nextStepSchema = z.object({
  /** The gap this step answers. */
  questionId: id,
  label: z.string().min(1).max(160),
  /** A page in this program. Never an outside address. */
  href: z.string().regex(/^\/[a-z0-9\-/?=&#%.]*$/i),
  why: z.string().min(1).max(400),
}).strict();
export type NextStep = z.infer<typeof nextStepSchema>;

export const analysisResponseSchema = z.object({
  instrumentId: z.enum(INSTRUMENT_IDS),
  summary: z.string(),
  answers: z.array(analysisAnswerSchema),
  limitations: z.array(z.string()),
  nextSteps: z.array(nextStepSchema),
  /** Counts the page shows beside the result. */
  counts: z.object({ evidence: z.number().int(), inference: z.number().int(), gap: z.number().int() }).strict(),
  /** True when the answer service could not run; the page then shows the instrument's questions as a worksheet. */
  unavailable: z.boolean(),
  unavailableReason: z.string().optional(),
  notice: z.string(),
}).strict();
export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;

/** Shown with every result and on the page. */
export const ANALYSIS_NOTICE = "This is a draft analysis of the material you supplied. It has not been reviewed or approved. Check the quotations against your document before relying on them.";

export type InstrumentQuestion = { id: string; prompt: string; help?: string };
export type InstrumentStage = { id: string; title: string; description?: string; questions: InstrumentQuestion[] };
export type GuidanceLink = {
  /** Lowercase words or phrases; a gap answer containing any of them gets this link. */
  keywords: string[];
  label: string;
  href: string;
  why: string;
};
export type Instrument = {
  id: InstrumentId;
  title: string;
  /** One plain sentence on what to upload or paste. */
  whatToUpload: string;
  intro: string;
  /** The published method the questions come from, named in full. */
  basis: string;
  stages: InstrumentStage[];
  guidance: GuidanceLink[];
};

/** Upload route response. */
export const uploadResponseSchema = z.object({
  source: analysisSourceSchema,
  note: z.string().optional(),
}).strict();
export type UploadResponse = z.infer<typeof uploadResponseSchema>;
