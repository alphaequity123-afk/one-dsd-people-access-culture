import { z } from "zod";
import { analysisRequestSchema, goalIdSchema, sourceSchema } from "./schema";

// Downloads preserve unfinished and consultant-edited wording. They do not
// certify that a draft meets the requirements for generating a new analysis.
const wording = z.string().max(6000);
const source = z.object({ ...sourceSchema.shape, id: z.string().max(80), title: z.string().max(300), text: z.string().max(50000) }).strict();
const request = z.object({ ...analysisRequestSchema.shape, title: z.string().max(200), question: z.string().max(2000), context: z.string().max(12000).optional(), sources: z.array(source).min(1).max(12) }).strict();
const citation = z.object({ sourceId: z.string().max(80), excerpt: z.string().max(2000) }).strict();
const goals = z.array(goalIdSchema).max(6);
const analysis = z.object({
  summary: wording,
  findings: z.array(z.object({ statement: wording, kind: z.enum(["evidence", "inference", "gap"]), citations: z.array(citation).max(12), reasoning: wording, affectedGroups: z.array(wording).max(20), goals }).strict()).max(30),
  alternatives: z.array(z.object({ title: wording, benefits: wording, risks: wording, evidenceNeeded: wording }).strict()).max(8),
  recommendations: z.array(z.object({ action: wording, rationale: wording, responsibleRole: wording, measure: wording, nextStep: wording, goals, citations: z.array(citation).max(12) }).strict()).max(15),
  limitations: z.array(wording).max(20), questionsForReview: z.array(wording).max(15),
}).strict();
export const analysisExportSchema = z.object({
  request, analysis: analysis.nullable(), analysisSources: z.array(source).max(30), researchNote: wording,
  gap: z.object({ label: z.string().max(300), value: z.string().max(30), target: z.string().max(30), unit: z.enum(["count", "percent", "days", "dollars"]), numerator: z.string().max(30), denominator: z.string().max(30), direction: z.enum(["increase", "decrease"]), start: z.string().max(10), end: z.string().max(10), change: z.string().max(30), uncertainty: wording }).strict(),
  review: z.partialRecord(z.enum(["perspectives", "barriers", "evidence", "alternatives", "action"]), z.object({ status: z.enum(["", "supported", "developing", "not-addressed", "not-applicable"]), note: wording }).strict()),
  gapResult: z.object({ gap: z.number().finite().nullable(), targetMet: z.boolean().nullable(), scenario: z.number().finite().nullable(), current: z.number().finite().nullable(), target: z.number().finite().nullable() }).strict().nullable().optional(),
}).strict();
