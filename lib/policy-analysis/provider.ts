import "server-only";
import type { ZodType } from "zod";
import { readiness } from "@/lib/consultant-toolkit/service";
import { strictSchemaForOpenAI, stripInjectedNulls } from "@/lib/intelligence/providers/openai";
import { runTool, ToolDenied } from "@/lib/intelligence/tools/runtime";
import { recommendationDraftSchema, type PolicyAnalysis, type PolicyCase } from "./contract";
import { DRAFTING_UNAVAILABLE_MESSAGE, PolicyAnalysisError } from "./errors";
import { analysisSystemPrompt, analysisUserMessage, recommendationsSystemPrompt, recommendationsUserMessage } from "./prompts";
import { analysisDraftSchema, sanitizeAnalysis, type RecommendationDraft } from "./service";

// The private drafting adapter for the Equity Policy Analyzer. It reuses the consultant
// toolkit's readiness checks, model identity and tool audit, and sends material to the
// configured service with storage disabled. Request and response bodies are never logged.

const TIMEOUT_MS = 150_000;
const MAX_RESPONSE_BYTES = 2_000_000;

export async function policyDraftingAvailability(): Promise<{ analysisAvailable: boolean; analysisUnavailableReason: string | null }> {
  try {
    const state = await readiness();
    return state.available ? { analysisAvailable: true, analysisUnavailableReason: null } : { analysisAvailable: false, analysisUnavailableReason: DRAFTING_UNAVAILABLE_MESSAGE };
  } catch { return { analysisAvailable: false, analysisUnavailableReason: DRAFTING_UNAVAILABLE_MESSAGE }; }
}

/** One structured call, validated by the given schema. Provider bodies never enter errors or logs. */
export async function privateStructuredCall<T>(schema: ZodType<T>, name: string, model: string, system: string, user: string, credential: string, fetcher: typeof fetch = fetch, maxOutputTokens = 22_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const strict = strictSchemaForOpenAI(schema);
  try {
    const response = await fetcher("https://api.openai.com/v1/responses", {
      method: "POST", headers: { authorization: `Bearer ${credential}`, "content-type": "application/json" }, redirect: "error", signal: controller.signal,
      body: JSON.stringify({ model, store: false, max_output_tokens: maxOutputTokens, input: [{ role: "developer", content: system }, { role: "user", content: user }], text: { format: { type: "json_schema", name, strict: true, schema: strict.schema } } }),
    });
    if (!response.ok) { await response.body?.cancel().catch(() => undefined); throw new PolicyAnalysisError("provider_failed"); }
    const reader = response.body?.getReader();
    if (!reader) throw new PolicyAnalysisError("invalid_response");
    const chunks: Uint8Array[] = []; let length = 0;
    try {
      while (true) {
        const part = await reader.read(); if (part.done) break;
        length += part.value.byteLength;
        if (length > MAX_RESPONSE_BYTES) { await reader.cancel(); throw new PolicyAnalysisError("invalid_response"); }
        chunks.push(part.value);
      }
    } finally { reader.releaseLock(); }
    const envelope = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (envelope.status !== "completed" || !Array.isArray(envelope.output)) throw new PolicyAnalysisError("invalid_response");
    const content = envelope.output.flatMap((item: { type?: string; content?: Array<{ type?: string; text?: string }> }) => item.type === "message" && Array.isArray(item.content) ? item.content : []);
    if (content.some((item: { type?: string }) => item.type === "refusal")) throw new PolicyAnalysisError("provider_failed");
    const text = content.filter((item: { type?: string }) => item.type === "output_text").map((item: { text?: string }) => item.text ?? "").join("");
    const value = stripInjectedNulls(JSON.parse(text), strict.schema, strict.schema, strict.injected);
    return schema.parse(value);
  } catch (error) {
    if (controller.signal.aborted) throw new PolicyAnalysisError("timeout");
    if (error instanceof PolicyAnalysisError) throw error;
    throw new PolicyAnalysisError("invalid_response");
  } finally { clearTimeout(timer); }
}

async function ready() {
  let state: Awaited<ReturnType<typeof readiness>>;
  try { state = await readiness(); } catch { throw new PolicyAnalysisError("unavailable"); }
  const { context, model, credential, available } = state;
  if (!available || !model || !credential) throw new PolicyAnalysisError("unavailable");
  return { context, model, credential };
}

/** Run through the tool runtime so the call is audited; a runtime denial reads as drafting being unavailable. */
async function audited<T>(work: () => Promise<T>, context: Awaited<ReturnType<typeof ready>>["context"], modelId: string): Promise<T> {
  try { return await runTool(context, "answer.structured_draft", work, { modelId }); }
  catch (error) {
    if (error instanceof PolicyAnalysisError) throw error;
    if (error instanceof ToolDenied) throw new PolicyAnalysisError("unavailable");
    throw new PolicyAnalysisError("provider_failed");
  }
}

/** Pass 1: the equity analysis, validated against the case's sources. */
export async function draftPolicyAnalysis(value: PolicyCase, fetcher: typeof fetch = fetch): Promise<PolicyAnalysis> {
  const { context, model, credential } = await ready();
  const draft = await audited(() => privateStructuredCall(analysisDraftSchema, "policy_equity_analysis", model.provider_model_ref, analysisSystemPrompt(), analysisUserMessage(value), credential, fetcher), context, model.model_id);
  return sanitizeAnalysis(draft, value.sources, new Date().toISOString());
}

/** Pass 2: recommended changes drafted from the analysis. Validation happens when they are applied to the case. */
export async function draftPolicyRecommendations(value: PolicyCase, fetcher: typeof fetch = fetch): Promise<RecommendationDraft> {
  if (!value.analysis) throw new PolicyAnalysisError("transition", "Run or write the analysis before drafting recommended changes.");
  const { context, model, credential } = await ready();
  return audited(() => privateStructuredCall(recommendationDraftSchema, "policy_recommended_changes", model.provider_model_ref, recommendationsSystemPrompt(), recommendationsUserMessage(value), credential, fetcher), context, model.model_id);
}
