import { z } from "zod";
import { getInstrument, instrumentQuestions } from "@/lib/analysis/instruments";
import { getPolicy } from "@/lib/content/hub/dsd-policies";
import {
  POLICY_CASE_CONTRACT_VERSION,
  POLICY_CASE_KIND,
  POLICY_LIMITS,
  policyAnalysisSchema,
  policyCaseSchema,
  readyToFormalize,
  FORMALIZATION_STATEMENT,
  recommendationDraftSchema,
  type createCaseRequestSchema,
  type decideRequestSchema,
  type Decision,
  type PolicyAnalysis,
  type PolicyCase,
  type PolicySource,
  type Recommendation,
  type updateCaseRequestSchema,
} from "./contract";
import { PolicyAnalysisError } from "./errors";
import { isPrincipleId } from "./principles";

// The pure core of the Equity Policy Analyzer: validation of drafted material and every
// status transition. Nothing here reads the database, the network or the session, so
// each rule can be tested directly. lib/policy-analysis/operations.ts wires it to storage.

export type DecisionRole = "consultant" | "team";
export type CreateCaseRequest = z.infer<typeof createCaseRequestSchema>;
export type UpdateCaseRequest = z.infer<typeof updateCaseRequestSchema>;
export type DecideRequest = z.infer<typeof decideRequestSchema>;
type Citation = { sourceId: string; excerpt: string };

/** What the analysis pass returns: the analysis without its timestamp. */
export const analysisDraftSchema = policyAnalysisSchema.omit({ generatedAt: true });
export type AnalysisDraft = z.infer<typeof analysisDraftSchema>;
export type RecommendationDraft = z.infer<typeof recommendationDraftSchema>;
type DraftedRecommendation = RecommendationDraft["recommendations"][number];

export const POLICY_INSTRUMENT_ID = "policy-review" as const;
export function policyReviewQuestions() { return instrumentQuestions(POLICY_INSTRUMENT_ID); }
export function policyReviewInstrument() { return getInstrument(POLICY_INSTRUMENT_ID); }

export const RESPONSIBLE_FALLBACK = "the person or area responsible";
const NOT_YET_ANSWERED = "Not yet answered.";

// ---------------------------------------------------------------------------
// Citations

const squash = (value: string) => value.replace(/\s+/g, " ").trim();

/** Checks quotations against the sources: exact text, or the same words with only spacing differences. */
export function citationChecker(sources: readonly PolicySource[]) {
  const texts = new Map(sources.map(source => [source.id, source.text]));
  const squashed = new Map<string, string>();
  const occurs = (sourceId: string | undefined, excerpt: string): boolean => {
    const trimmed = excerpt.trim();
    if (!trimmed) return false;
    const ids = sourceId === undefined ? [...texts.keys()] : [sourceId];
    return ids.some(id => {
      const text = texts.get(id);
      if (text === undefined) return false;
      if (text.includes(trimmed)) return true;
      if (!squashed.has(id)) squashed.set(id, squash(text));
      return squashed.get(id)!.includes(squash(trimmed));
    });
  };
  return {
    /** True when the excerpt occurs in the named source. */
    citation: (citation: Citation) => occurs(citation.sourceId, citation.excerpt),
    /** True when the passage occurs in any source. */
    anywhere: (passage: string) => occurs(undefined, passage),
    keep: <T extends Citation>(citations: readonly T[]): T[] => citations.filter(item => occurs(item.sourceId, item.excerpt)).map(item => ({ ...item, excerpt: item.excerpt.trim() })),
  };
}

export function citationOccurs(citation: Citation, sources: readonly PolicySource[]): boolean {
  return citationChecker(sources).citation(citation);
}

// ---------------------------------------------------------------------------
// Analysis pass

/**
 * Validate a drafted analysis: keep one answer per policy review question in instrument
 * order, drop quotations that are not word for word in their source, mark an evidence
 * answer with no remaining quotation as missing information, and drop unknown principles.
 */
export function sanitizeAnalysis(draft: AnalysisDraft, sources: readonly PolicySource[], generatedAt: string): PolicyAnalysis {
  const check = citationChecker(sources);
  const questions = policyReviewQuestions();
  const known = new Set(questions.map(question => question.id));
  const drafted = new Map<string, AnalysisDraft["answers"][number]>();
  for (const answer of draft.answers) if (known.has(answer.questionId) && !drafted.has(answer.questionId)) drafted.set(answer.questionId, answer);

  let downgraded = 0, missing = 0, droppedQuotes = 0;
  const answers = questions.map(question => {
    const answer = drafted.get(question.id);
    if (!answer) { missing++; return { questionId: question.id, kind: "gap" as const, text: NOT_YET_ANSWERED, citations: [] }; }
    const citations = check.keep(answer.citations);
    droppedQuotes += answer.citations.length - citations.length;
    if (answer.kind === "evidence" && citations.length === 0) { downgraded++; return { ...answer, kind: "gap" as const, citations }; }
    return { ...answer, citations };
  });

  const seen = new Set<string>();
  const principles = draft.principles.flatMap(finding => {
    if (!isPrincipleId(finding.principleId) || seen.has(finding.principleId)) return [];
    seen.add(finding.principleId);
    const citations = check.keep(finding.citations);
    droppedQuotes += finding.citations.length - citations.length;
    if (finding.kind === "evidence" && citations.length === 0) { downgraded++; return [{ ...finding, kind: "gap" as const, citations }]; }
    return [{ ...finding, citations }];
  });

  const added: string[] = [];
  if (downgraded) added.push(`${countWords(downgraded, "finding")} said to come from the sources had no quotation that could be found word for word in the sources, so ${downgraded === 1 ? "it is" : "they are"} marked as missing information until checked.`);
  else if (droppedQuotes) added.push(`${countWords(droppedQuotes, "quotation")} could not be found word for word in the sources and ${droppedQuotes === 1 ? "was" : "were"} removed.`);
  if (missing) added.push(`${countWords(missing, "policy review question")} ${missing === 1 ? "was" : "were"} not answered in this draft and ${missing === 1 ? "is" : "are"} marked as missing information.`);
  const limitations = [...draft.limitations.slice(0, 20 - added.length), ...added];

  const parsed = policyAnalysisSchema.safeParse({ summary: draft.summary, answers, principles, limitations, generatedAt });
  if (!parsed.success) throw new PolicyAnalysisError("invalid_response");
  return parsed.data;
}

function countWords(count: number, noun: string) {
  return `${count === 1 ? "One" : String(count)} ${noun}${count === 1 ? "" : "s"}`;
}

/** The record used when people write the analysis themselves and send the case for decisions. */
export function manualAnalysis(generatedAt: string): PolicyAnalysis {
  return policyAnalysisSchema.parse({
    summary: "This analysis was written by hand. The policy review questions below have not been answered in the program yet.",
    answers: policyReviewQuestions().map(question => ({ questionId: question.id, kind: "gap", text: NOT_YET_ANSWERED, citations: [] })),
    principles: [],
    limitations: ["The case was sent for decisions before the policy review questions were answered."],
    generatedAt,
  });
}

// ---------------------------------------------------------------------------
// Recommendations

type RecommendationBody = Omit<Recommendation, "id" | "decision" | "history">;

/** Words that must never name the party responsible for a change. */
function responsibleRole(value: string): string {
  return /\boffices?\b/i.test(value) ? RESPONSIBLE_FALLBACK : value.trim();
}

const unique = <T>(values: readonly T[]) => [...new Set(values)];

/**
 * Validate one recommended change: quotations word for word, current wording found in a
 * source, catalog ids that exist, principle ids that exist, and a responsible role that
 * is never an office. Returns the cleaned change and whether its current wording was removed.
 */
export function sanitizeRecommendation<T extends RecommendationBody>(item: T, sources: readonly PolicySource[], check = citationChecker(sources)): { value: T; wordingRemoved: boolean } {
  const currentWording = item.currentWording?.trim();
  const wordingKept = Boolean(currentWording && check.anywhere(currentWording));
  const value = {
    ...item,
    principleIds: unique(item.principleIds.filter(isPrincipleId)),
    affectedPolicies: unique(item.affectedPolicies.filter(id => Boolean(getPolicy(id)))),
    evidence: check.keep(item.evidence),
    responsibleRole: responsibleRole(item.responsibleRole),
  };
  if (wordingKept) value.currentWording = currentWording; else delete value.currentWording;
  if (!item.proposedWording?.trim()) delete value.proposedWording;
  if (!item.reviewDate) delete value.reviewDate;
  return { value, wordingRemoved: Boolean(currentWording) && !wordingKept };
}

/** Next ids rec-N, never reusing an id already present on the case. */
export function assignRecommendationIds(existing: readonly Pick<Recommendation, "id">[], count: number): string[] {
  const used = new Set(existing.map(item => item.id));
  let next = existing.reduce((max, item) => {
    const match = /^rec-(\d+)$/.exec(item.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0) + 1;
  const ids: string[] = [];
  while (ids.length < count) {
    const candidate = `rec-${next++}`;
    if (!used.has(candidate)) { ids.push(candidate); used.add(candidate); }
  }
  return ids;
}

/**
 * Apply drafted changes to a case. Changes that already carry a decision or a decision
 * history are kept as they are; undecided changes are replaced by the new draft. The case
 * moves to review once it holds an analysis and at least one change.
 */
export function applyRecommendationDraft(current: PolicyCase, draft: RecommendationDraft): PolicyCase {
  editable(current);
  if (!current.analysis) throw new PolicyAnalysisError("transition", "Run or write the analysis before drafting recommended changes.");
  const check = citationChecker(current.sources);
  const kept = current.recommendations.filter(item => item.decision || item.history.length > 0);
  const room = Math.max(0, POLICY_LIMITS.recommendations - kept.length);
  let wordingRemoved = 0;
  const cleaned = draft.recommendations.slice(0, room).map((item: DraftedRecommendation) => {
    const result = sanitizeRecommendation(item, current.sources, check);
    if (result.wordingRemoved) wordingRemoved++;
    return result.value;
  });
  const ids = assignRecommendationIds(current.recommendations, cleaned.length);
  const added: Recommendation[] = cleaned.map((item, index) => ({ ...item, id: ids[index], history: [] }));
  const recommendations = [...kept, ...added];
  const analysis = wordingRemoved ? withLimitation(current.analysis, `The current wording quoted for ${countWords(wordingRemoved, "recommended change").replace(/^One/, "one")} could not be found word for word in the sources and was removed. Add the passage from the official source before deciding.`) : current.analysis;
  return { ...current, analysis, recommendations, status: recommendations.length > 0 ? "review" : current.status };
}

function withLimitation(analysis: PolicyAnalysis, text: string): PolicyAnalysis {
  return { ...analysis, limitations: [...analysis.limitations.slice(0, 19), text] };
}

/** The fields whose change means a decision must be made again. */
function recommendationText(item: RecommendationBody): string {
  return JSON.stringify([item.type, item.title, item.change, item.currentWording ?? "", item.proposedWording ?? "", item.equityConsideration, item.principleIds, item.evidence.map(citation => [citation.sourceId, citation.excerpt]), item.affectedPolicies, item.responsibleRole, item.effort, item.reviewDate ?? ""]);
}

// ---------------------------------------------------------------------------
// Case lifecycle

function editable(current: PolicyCase) {
  if (current.status === "final") throw new PolicyAnalysisError("transition", "Reopen this case before changing it.");
}

export function newPolicyCase(request: CreateCaseRequest, id: string, now: string): PolicyCase {
  if (request.policy.catalogId && !getPolicy(request.policy.catalogId)) throw new PolicyAnalysisError("invalid", "Choose a policy from the catalog, or leave the catalog entry empty for an uploaded or pasted policy.");
  return validCase({
    kind: POLICY_CASE_KIND,
    contractVersion: POLICY_CASE_CONTRACT_VERSION,
    id, version: 1, status: "draft",
    title: request.title,
    policy: request.policy,
    sources: request.sources,
    context: request.context,
    analysis: null,
    recommendations: [],
    formalization: null,
    createdAt: now, updatedAt: now, finalizedAt: null,
  });
}

/**
 * Edit sources, context, title or recommendation text while the case is a draft or in review.
 * A recommendation keeps its decision and history by id; when its text changes after a
 * decision, the current decision is cleared (history is kept) so it is decided again.
 */
export function applyUpdate(current: PolicyCase, request: UpdateCaseRequest): PolicyCase {
  editable(current);
  const sources = request.sources ?? current.sources;
  let next: PolicyCase = { ...current, title: request.title ?? current.title, sources, context: request.context ?? current.context };
  if (request.recommendations) {
    if (new Set(request.recommendations.map(item => item.id)).size !== request.recommendations.length) throw new PolicyAnalysisError("invalid", "Each recommended change needs its own id.");
    const check = citationChecker(sources);
    const existing = new Map(current.recommendations.map(item => [item.id, item]));
    const recommendations = request.recommendations.map(incoming => {
      const { id, ...body } = incoming;
      const { value, wordingRemoved } = sanitizeRecommendation(body, sources, check);
      // Current wording is typed by hand here, so a passage not in the sources is refused rather than dropped.
      // Quotations no longer in the sources (for example after a source is removed) are dropped.
      if (wordingRemoved) throw new PolicyAnalysisError("invalid", `The current wording for "${body.title}" does not appear word for word in the sources. Copy it from the source text, or leave it empty.`);
      const before = existing.get(id);
      if (!before) return { ...value, id, history: [] } as Recommendation;
      const { id: _id, decision, history, ...beforeBody } = before;
      void _id;
      const changed = recommendationText(value) !== recommendationText(beforeBody);
      const merged: Recommendation = { ...value, id, history };
      if (decision && !changed) merged.decision = decision;
      return merged;
    });
    next = { ...next, recommendations, status: current.status === "review" && recommendations.length === 0 ? "draft" : current.status };
  }
  return next;
}

export function applyAnalysis(current: PolicyCase, analysis: PolicyAnalysis): PolicyCase {
  editable(current);
  return { ...current, analysis };
}

/** Move a draft to review for decisions. A hand-written case without an analysis gets the minimal record. */
export function applySendForDecisions(current: PolicyCase, now: string): PolicyCase {
  if (current.status !== "draft") throw new PolicyAnalysisError("transition", current.status === "review" ? "This case is already open for decisions." : "Reopen this case before changing it.");
  if (current.recommendations.length === 0) throw new PolicyAnalysisError("transition", "Add at least one recommended change before sending the case for decisions.");
  return { ...current, status: "review", analysis: current.analysis ?? manualAnalysis(now) };
}

/** Record approve, reject or defer by role. The decision becomes current and is added to the history. */
export function applyDecision(current: PolicyCase, request: Pick<DecideRequest, "recommendationId" | "outcome" | "reason" | "conditions" | "deferredUntil">, role: DecisionRole, now: string): PolicyCase {
  if (current.status !== "review") throw new PolicyAnalysisError("transition", current.status === "final" ? "Reopen this case before recording a decision." : "Send the case for decisions before recording one.");
  const index = current.recommendations.findIndex(item => item.id === request.recommendationId);
  if (index < 0) throw new PolicyAnalysisError("not_found", "This recommended change was not found in the case.");
  if (request.outcome === "deferred" && !request.deferredUntil) throw new PolicyAnalysisError("invalid", "A deferred change needs a date to come back to it.");
  const target = current.recommendations[index];
  if (target.history.length >= 50) throw new PolicyAnalysisError("invalid", "This change has reached the limit of 50 recorded decisions.");
  const decision: Decision = { outcome: request.outcome, role, reason: request.reason.trim(), at: now };
  if (request.conditions?.trim()) decision.conditions = request.conditions.trim();
  if (request.outcome === "deferred") decision.deferredUntil = request.deferredUntil;
  const recommendations = current.recommendations.map((item, position) => position === index ? { ...item, decision, history: [...item.history, decision] } : item);
  return { ...current, recommendations };
}

export const NOT_READY_TO_FORMALIZE = "Every recommended change needs a decision, and at least one must be approved, before the case is formalized.";

export function applyFormalize(current: PolicyCase, documentTitle: string, role: DecisionRole, now: string): PolicyCase {
  if (current.status !== "review") throw new PolicyAnalysisError("transition", current.status === "final" ? "This case is already formalized." : "Send the case for decisions before formalizing it.");
  if (!readyToFormalize(current)) throw new PolicyAnalysisError("transition", NOT_READY_TO_FORMALIZE);
  const approvedRecommendationIds = current.recommendations.filter(item => item.decision?.outcome === "approved").map(item => item.id);
  return { ...current, status: "final", finalizedAt: now, formalization: { at: now, role, approvedRecommendationIds, documentTitle: documentTitle.trim(), statement: FORMALIZATION_STATEMENT } };
}

export function applyReopen(current: PolicyCase): PolicyCase {
  if (current.status !== "final") throw new PolicyAnalysisError("transition", "Only a formalized case can be reopened.");
  return { ...current, status: "review", formalization: null, finalizedAt: null };
}

/** Bump version and timestamp, then validate the whole record. */
export function nextVersion(value: PolicyCase, now: string): PolicyCase {
  return validCase({ ...value, version: value.version + 1, updatedAt: now });
}

export function validCase(value: unknown): PolicyCase {
  const parsed = policyCaseSchema.safeParse(value);
  if (!parsed.success) throw new PolicyAnalysisError("invalid", parsed.error.issues.find(issue => issue.code === "custom")?.message ?? undefined);
  return parsed.data;
}

export type PolicyCaseSummary = {
  id: string; version: number; status: PolicyCase["status"]; title: string; policyTitle: string; catalogId?: string;
  recommendationCount: number; approvedCount: number; createdAt: string; updatedAt: string; finalizedAt: string | null;
};

export function caseSummary(value: PolicyCase): PolicyCaseSummary {
  return {
    id: value.id, version: value.version, status: value.status, title: value.title, policyTitle: value.policy.title,
    ...(value.policy.catalogId ? { catalogId: value.policy.catalogId } : {}),
    recommendationCount: value.recommendations.length,
    approvedCount: value.recommendations.filter(item => item.decision?.outcome === "approved").length,
    createdAt: value.createdAt, updatedAt: value.updatedAt, finalizedAt: value.finalizedAt,
  };
}
