import { z } from "zod";

// Shared contract for the Equity Policy Analyzer: take a policy (one of the catalog
// entries, or an uploaded or pasted document), run the equity analysis on it, draft
// recommended changes with the equity considerations embedded, record decisions
// (approve, reject, defer) by role, and formalize and export the approved set.
//
// Storage: a policy-change case is saved in the same encrypted case table as the
// consultant toolkit (pac_dsd.consultant_toolkit_cases), with `kind: "policy-change"`
// inside the encrypted payload. The table's status values are draft, review and
// final; this contract maps to them exactly. No database change is needed.
//
// Owner rules: consultant and One DSD Team only (decisions recorded by role, not by
// name); plain language; every organization and program name in full; never the
// words "AI" or "tutor" in visible text; no names of individual people; quotations
// must occur verbatim in the supplied sources; links only to pages in this program.

export const POLICY_CASE_KIND = "policy-change" as const;
export const POLICY_CASE_CONTRACT_VERSION = "2026-11-06.1";

export const POLICY_LIMITS = {
  sources: 12,
  sourceCharacters: 120_000,
  totalSourceCharacters: 360_000,
  contextCharacters: 4_000,
  recommendations: 30,
  reasonCharacters: 2_000,
} as const;

const id = z.string().min(1).max(160).regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/);
const plain = (max: number) => z.string().trim().min(1).max(max);

export const policySourceSchema = z.object({
  id,
  title: z.string().trim().min(1).max(500),
  text: z.string().min(1).max(POLICY_LIMITS.sourceCharacters),
  url: z.string().max(2048).url().optional(),
  date: z.string().max(100).optional(),
  /** "user" for supplied material; "catalog" for the catalog entry text; "program" for evidence pulled from this program. */
  origin: z.enum(["user", "catalog", "program"]).default("user"),
  note: z.string().max(2_000).optional(),
}).strict();
export type PolicySource = z.infer<typeof policySourceSchema>;

/** Which policy the case is about. catalogId is an id from lib/content/hub/dsd-policies.json when the policy is in the catalog. */
export const policyRefSchema = z.object({
  catalogId: z.string().regex(/^[a-z0-9][a-z0-9-]{0,119}$/).optional(),
  title: plain(300),
  kindLabel: z.string().max(80).optional(),
  sourceUrl: z.string().max(2048).url().optional(),
  programs: z.array(z.string().max(120)).max(20).default([]),
}).strict();
export type PolicyRef = z.infer<typeof policyRefSchema>;

export const POLICY_ANSWER_KINDS = ["evidence", "inference", "gap"] as const;
export const policyCitationSchema = z.object({ sourceId: id, excerpt: z.string().min(1).max(2_000) }).strict();
export const policyAnswerSchema = z.object({
  questionId: id,
  kind: z.enum(POLICY_ANSWER_KINDS),
  text: plain(6_000),
  citations: z.array(policyCitationSchema).max(8),
}).strict();

/** One equity principle applied to the policy. Principle ids come from lib/policy-analysis/principles.ts. */
export const principleFindingSchema = z.object({
  principleId: id,
  kind: z.enum(POLICY_ANSWER_KINDS),
  finding: plain(3_000),
  citations: z.array(policyCitationSchema).max(6),
}).strict();

export const policyAnalysisSchema = z.object({
  summary: plain(6_000),
  /** Answers to the policy review instrument (lib/analysis/instruments.ts, id "policy-review"). */
  answers: z.array(policyAnswerSchema).min(1).max(40),
  principles: z.array(principleFindingSchema).max(20),
  limitations: z.array(plain(2_000)).max(20),
  generatedAt: z.string().datetime(),
}).strict();
export type PolicyAnalysis = z.infer<typeof policyAnalysisSchema>;

export const CHANGE_TYPES = ["policy-wording", "protocol", "process", "procedure", "training", "data", "engagement"] as const;
export type ChangeType = (typeof CHANGE_TYPES)[number];
export const EFFORT = ["low", "medium", "high"] as const;

export const DECISION_OUTCOMES = ["approved", "rejected", "deferred"] as const;
export type DecisionOutcome = (typeof DECISION_OUTCOMES)[number];
/**
 * Who records a decision. With no sign-in (owner decision, November 6, 2026) the person deciding
 * chooses the role they are deciding as; a session supplies the default. Roles, never names.
 */
export const DECISION_ROLES = ["consultant", "team", "supervisor", "manager", "deputy-director", "division-director"] as const;
export type DecisionRoleId = (typeof DECISION_ROLES)[number];
export const DECISION_ROLE_LABELS: Record<DecisionRoleId, string> = {
  consultant: "Equity and Inclusion Operations Consultant",
  team: "One DSD Team",
  supervisor: "Supervisor",
  manager: "Manager",
  "deputy-director": "Deputy Director",
  "division-director": "Division Director",
};

export const decisionSchema = z.object({
  outcome: z.enum(DECISION_OUTCOMES),
  role: z.enum(DECISION_ROLES),
  reason: plain(POLICY_LIMITS.reasonCharacters),
  conditions: z.string().max(POLICY_LIMITS.reasonCharacters).optional(),
  /** Required when deferred: the date to come back to it. */
  deferredUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  at: z.string().datetime(),
}).strict().superRefine((value, ctx) => {
  if (value.outcome === "deferred" && !value.deferredUntil) ctx.addIssue({ code: "custom", path: ["deferredUntil"], message: "A deferred change needs a date to come back to it." });
});
export type Decision = z.infer<typeof decisionSchema>;

export const recommendationSchema = z.object({
  id,
  type: z.enum(CHANGE_TYPES),
  title: plain(200),
  /** The change in plain language: what is done differently, by whom, from when. */
  change: plain(4_000),
  /** For policy-wording changes: the current passage (verbatim from a source) and the proposed replacement. */
  currentWording: z.string().max(4_000).optional(),
  proposedWording: z.string().max(4_000).optional(),
  /** The equity consideration this change answers, naming principle ids and the people affected. */
  equityConsideration: plain(3_000),
  principleIds: z.array(id).max(10),
  evidence: z.array(policyCitationSchema).max(8),
  /** Catalog policy ids this change touches. Validated against the catalog by the server. */
  affectedPolicies: z.array(z.string().regex(/^[a-z0-9][a-z0-9-]{0,119}$/)).max(12),
  responsibleRole: plain(200),
  effort: z.enum(EFFORT),
  reviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  /** The current decision, if any. Earlier decisions stay in history; nothing is overwritten. */
  decision: decisionSchema.optional(),
  history: z.array(decisionSchema).max(50).default([]),
}).strict();
export type Recommendation = z.infer<typeof recommendationSchema>;

/** What the model returns for the recommendations pass: no ids, decisions or history. */
export const recommendationDraftSchema = z.object({
  recommendations: z.array(recommendationSchema.omit({ id: true, decision: true, history: true })).min(1).max(POLICY_LIMITS.recommendations),
  notes: z.array(plain(2_000)).max(10),
}).strict();

export const CASE_STATUSES = ["draft", "review", "final"] as const;

export const formalizationSchema = z.object({
  at: z.string().datetime(),
  role: z.enum(DECISION_ROLES),
  approvedRecommendationIds: z.array(id),
  documentTitle: plain(300),
  /** The statement every formalized document carries. */
  statement: plain(1_000),
}).strict();

export const policyCaseSchema = z.object({
  kind: z.literal(POLICY_CASE_KIND),
  contractVersion: z.literal(POLICY_CASE_CONTRACT_VERSION).default(POLICY_CASE_CONTRACT_VERSION),
  id: z.string().uuid(),
  version: z.number().int().positive(),
  status: z.enum(CASE_STATUSES),
  title: plain(240),
  policy: policyRefSchema,
  sources: z.array(policySourceSchema).max(POLICY_LIMITS.sources).default([]),
  context: z.string().max(POLICY_LIMITS.contextCharacters).default(""),
  analysis: policyAnalysisSchema.nullable().default(null),
  recommendations: z.array(recommendationSchema).max(POLICY_LIMITS.recommendations).default([]),
  formalization: formalizationSchema.nullable().default(null),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  finalizedAt: z.string().datetime().nullable(),
}).strict().superRefine((value, ctx) => {
  if ((value.status === "final") !== (value.finalizedAt !== null)) ctx.addIssue({ code: "custom", path: ["finalizedAt"], message: "Only a final case has a finalization timestamp." });
  if (value.status === "final" && !value.formalization) ctx.addIssue({ code: "custom", path: ["formalization"], message: "A final case records its formalization." });
  if (value.status !== "draft" && !value.analysis) ctx.addIssue({ code: "custom", path: ["analysis"], message: "A case in review or final holds an analysis." });
  const total = value.sources.reduce((sum, source) => sum + source.text.length, 0);
  if (total > POLICY_LIMITS.totalSourceCharacters) ctx.addIssue({ code: "custom", path: ["sources"], message: "The sources together hold too much text." });
  if (new Set(value.sources.map(source => source.id)).size !== value.sources.length) ctx.addIssue({ code: "custom", path: ["sources"], message: "Each source needs its own id." });
  if (new Set(value.recommendations.map(item => item.id)).size !== value.recommendations.length) ctx.addIssue({ code: "custom", path: ["recommendations"], message: "Each recommendation needs its own id." });
});
export type PolicyCase = z.infer<typeof policyCaseSchema>;

/** Status rules: draft until an analysis exists and the case is sent for decisions; review while decisions are recorded; final once formalized. */
export function everyRecommendationDecided(value: PolicyCase): boolean {
  return value.recommendations.length > 0 && value.recommendations.every(item => item.decision && item.decision.outcome !== "deferred");
}

/** A case can be formalized when every recommendation has a decision (deferred counts as a decision and is listed as deferred) and at least one is approved. */
export function readyToFormalize(value: PolicyCase): boolean {
  return value.recommendations.length > 0
    && value.recommendations.every(item => Boolean(item.decision))
    && value.recommendations.some(item => item.decision?.outcome === "approved");
}

export const EXPORT_KINDS = ["analysis", "recommendations", "decision-record", "formal-policy-proposal"] as const;
export type PolicyExportKind = (typeof EXPORT_KINDS)[number];

export const FORMALIZATION_STATEMENT = "This document records changes approved inside the One DSD People, Access and Culture program by the roles named in its decision record. It is a program decision. Adoption as Department of Human Services policy follows the department's own policy process, and the official source named here remains the authority until that process is complete.";

/** Request bodies for the routes. */
export const createCaseRequestSchema = z.object({
  title: plain(240),
  policy: policyRefSchema,
  sources: z.array(policySourceSchema).max(POLICY_LIMITS.sources).default([]),
  context: z.string().max(POLICY_LIMITS.contextCharacters).default(""),
}).strict();

export const updateCaseRequestSchema = z.object({
  expectedVersion: z.number().int().positive(),
  title: plain(240).optional(),
  sources: z.array(policySourceSchema).max(POLICY_LIMITS.sources).optional(),
  context: z.string().max(POLICY_LIMITS.contextCharacters).optional(),
  /** Hand-edited recommendations (text fields only; decisions and history are never edited here). */
  recommendations: z.array(recommendationSchema.omit({ decision: true, history: true })).max(POLICY_LIMITS.recommendations).optional(),
}).strict();

export const analyzeCaseRequestSchema = z.object({
  caseId: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  /** "analysis" runs the equity analysis; "recommendations" drafts changes from an existing analysis; "both" does both. */
  step: z.enum(["analysis", "recommendations", "both"]).default("both"),
}).strict();

export const decideRequestSchema = z.object({
  caseId: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  recommendationId: id,
  outcome: z.enum(DECISION_OUTCOMES),
  reason: plain(POLICY_LIMITS.reasonCharacters),
  conditions: z.string().max(POLICY_LIMITS.reasonCharacters).optional(),
  deferredUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  /** The role the person is deciding as. When absent, the session's role is used. */
  decidingAs: z.enum(DECISION_ROLES).optional(),
}).strict();

export const formalizeRequestSchema = z.object({
  caseId: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  documentTitle: plain(300),
  decidingAs: z.enum(DECISION_ROLES).optional(),
}).strict();

export const exportRequestSchema = z.object({
  caseId: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  kind: z.enum(EXPORT_KINDS),
  format: z.enum(["docx", "pdf", "json"]),
}).strict();
