import "server-only";
import type { z } from "zod";
import type { analyzeCaseRequestSchema, decideRequestSchema, exportRequestSchema, formalizeRequestSchema, PolicyCase, updateCaseRequestSchema } from "./contract";
import { PolicyAnalysisError } from "./errors";
import { draftPolicyAnalysis, draftPolicyRecommendations } from "./provider";
import { applyAnalysis, applyDecision, applyFormalize, applyRecommendationDraft, applyReopen, applySendForDecisions, applyUpdate, type DecisionRole } from "./service";
import { getPolicyCase, mutatePolicyCase } from "./store";
import { renderPolicyExport } from "./export";

// Wires the pure transitions in service.ts to storage and drafting. Route handlers call these.

async function savedAt(id: string, expectedVersion: number): Promise<PolicyCase> {
  const current = await getPolicyCase(id);
  if (!current) throw new PolicyAnalysisError("not_found");
  if (current.version !== expectedVersion) throw new PolicyAnalysisError("conflict");
  return current;
}

export function updatePolicyCase(id: string, request: z.infer<typeof updateCaseRequestSchema>) {
  return mutatePolicyCase(id, request.expectedVersion, current => applyUpdate(current, request));
}

/**
 * Run the drafting passes outside any database transaction, then save the result only if
 * the case is still at the expected version. "both" saves once, after both passes.
 */
export async function analyzePolicyCase(request: z.infer<typeof analyzeCaseRequestSchema>): Promise<PolicyCase> {
  const current = await savedAt(request.caseId, request.expectedVersion);
  if (current.status === "final") throw new PolicyAnalysisError("transition", "Reopen this case before changing it.");
  let working = current;
  if (request.step === "analysis" || request.step === "both") {
    if (!current.sources.length && !current.policy.catalogId) throw new PolicyAnalysisError("invalid", "Attach or paste the policy text before running the analysis.");
    working = applyAnalysis(working, await draftPolicyAnalysis(working));
  }
  if (request.step === "recommendations" || request.step === "both") {
    if (!working.analysis) throw new PolicyAnalysisError("transition", "Run or write the analysis before drafting recommended changes.");
    working = applyRecommendationDraft(working, await draftPolicyRecommendations(working));
  }
  const result = working;
  return mutatePolicyCase(request.caseId, request.expectedVersion, () => result);
}

export function decidePolicyCase(request: z.infer<typeof decideRequestSchema>, role: DecisionRole) {
  return mutatePolicyCase(request.caseId, request.expectedVersion, current => applyDecision(current, request, role, new Date().toISOString()));
}

export function formalizePolicyCase(request: z.infer<typeof formalizeRequestSchema>, role: DecisionRole) {
  return mutatePolicyCase(request.caseId, request.expectedVersion, current => applyFormalize(current, request.documentTitle, role, new Date().toISOString()));
}

export function reopenPolicyCase(caseId: string, expectedVersion: number) {
  return mutatePolicyCase(caseId, expectedVersion, applyReopen);
}

export function sendPolicyCaseForDecisions(caseId: string, expectedVersion: number) {
  return mutatePolicyCase(caseId, expectedVersion, current => applySendForDecisions(current, new Date().toISOString()));
}

export async function exportPolicyCase(request: z.infer<typeof exportRequestSchema>) {
  const current = await savedAt(request.caseId, request.expectedVersion);
  return renderPolicyExport(current, request.kind, request.format);
}
