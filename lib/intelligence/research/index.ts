/**
 * governedResearch: the only entry point Ask (or any agent) may use to reach current external
 * sources. Admission -> provider route -> call -> usage ledger -> typed external evidence.
 * Every call is a governed research tool invocation so the
 * allowlist, autonomy ceiling, owner stop, and audit apply.
 */
import { runTool } from "../tools/runtime";
import type { ToolContext } from "../types";
import { errorStatus, providerErrorExcerpt } from "../providers/log";
import { admitResearch, getResearchPolicy, recordUsage, type Admission } from "./governance";
import { withResearchSlot } from "./slots";
import { asksToAvoidWebResearch } from "../research-preference";
import { asksForScholarlyResearch, CONSENSUS_EVIDENCE_NOTE, consensusQuery, consensusResearchProvider } from "./consensus";
import { researchIdentityInstruction, type ResearchSourceContext } from "./source-context";
import {
  resolveResearchProvider,
  researchFailureUsage,
  searchWithPerplexity,
  UnresolvedCitationError,
  type ExternalSource,
  type ResearchDepth,
  type ResearchOutput,
  type ResearchProviderId,
} from "./providers";

export type GovernedResearchResult =
  | { status: "used"; output: ResearchOutput; provider: ResearchProviderId; note: string }
  | { status: "not_admitted"; reason: Admission extends { ok: false } ? Admission["reason"] : string; message: string }
  | { status: "failed"; message: string; error_code: string };

/**
 * Providers throw finite codes (research_http_401, research_timeout, research_model_not_allowed, ...).
 * Keep that code for the usage ledger and the log; anything else collapses to the generic code.
 */
function researchFailure(error: unknown, context: { trace_id: string; provider: string; model: string; depth: string }): string {
  const message = error instanceof Error ? error.message : "";
  const code = /^[a-z][a-z0-9_]{0,79}$/.test(message) ? message
    : error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError") ? "research_timeout"
    : "research_execution_failed";
  const status = errorStatus(error);
  // Finite rule names from the citation joiner only (see UnresolvedCitationError); never answer text.
  const finite = (value: unknown) => typeof value === "string" && /^[a-z][a-z_]{0,39}$/i.test(value) ? value : undefined;
  const reason = error instanceof UnresolvedCitationError ? finite(error.reason) : undefined;
  const detail = error instanceof UnresolvedCitationError ? finite(error.detail) : undefined;
  console.error("research_failed", {
    ...context, code,
    ...(reason ? { reason } : {}),
    ...(detail ? { detail } : {}),
    ...(status ? { status } : {}),
    ...(code === "research_execution_failed" ? { error: providerErrorExcerpt(error, 200) } : {}),
  });
  return code;
}

export const EXTERNAL_EVIDENCE_NOTE =
  "These sources come from the public web, not from this program. They are not DHS guidance. Check the original source and confirm anything important with the appropriate policy or content owner before you act.";

export type GovernedResearchAvailability = {
  configured: boolean;
  enabled: boolean;
  stopped: boolean;
  provider: ResearchProviderId | null;
  fastDepth: "current_web";
  deepDepth: "deep_research";
  rawSearchAvailable: boolean;
};

/** Server-only status summary. It never returns a credential or secret-bearing value. */
export async function governedResearchAvailability(role: "staff" | "owner" = "staff"): Promise<GovernedResearchAvailability> {
  const [policy, autonomy] = await Promise.all([getResearchPolicy(), (await import("../policy")).getPolicy()]);
  const provider = resolveResearchProvider(policy.provider_order);
  const stopped = autonomy.killed || process.env.PAC_RESEARCH_KILL_SWITCH === "on";
  const configured = Boolean(provider);
  // Owner directive: every staff member may use external research for any question; no audience gate.
  const audienceAllowed = true;
  void role;
  return {
    configured,
    enabled: configured && policy.enabled && policy.mode !== "off" && !stopped && audienceAllowed,
    stopped,
    provider: provider?.id ?? null,
    fastDepth: "current_web",
    deepDepth: "deep_research",
    rawSearchAvailable: configured && policy.enabled && policy.mode !== "off" && !stopped,
  };
}

/** Outside research reads the question in its program setting, so a "renewal notice" is a human-services notice, not a subscription. */
function inProgramContext(question: string, sourceContext?: ResearchSourceContext): string {
  return question + " (Answer the actual subject asked about. The reader may work in Minnesota public human services; use that context only when relevant. Research is not limited to that field. Prefer authoritative original sources, including a named organization's own publications when available. Distinguish documented facts from inference, compare plausible explanations where appropriate, and do not infer causation or agency authority from association alone. Check a source's date and scope before treating a pilot, contract, partnership or service as current. An agency's own accessibility or grievance policy does not establish its jurisdiction over other employers or organizations.)" + researchIdentityInstruction(sourceContext);
}

export async function governedResearch(question: string, depth: ResearchDepth, explicit: boolean, ctx: ToolContext, fetcher?: typeof fetch, sourceContext?: ResearchSourceContext): Promise<GovernedResearchResult> {
  if (asksToAvoidWebResearch(question)) return { status: "not_admitted", reason: "source_only", message: "The answer uses the requested source restriction." };
  const policy = await getResearchPolicy();
  const scholarly = asksForScholarlyResearch(question);
  const select = (order: typeof policy.provider_order) => scholarly
    ? (consensusResearchProvider.configured() ? consensusResearchProvider : null)
    : resolveResearchProvider(order);
  const preview = select(policy.provider_order);
  if (ctx.dry_run) {
    return {
      status: "not_admitted",
      reason: "dry_run",
      message: "This check does not look at current public sources.",
    };
  }
  const admission = await admitResearch(question, depth, explicit || scholarly, Boolean(preview), ctx.role);
  if (!admission.ok) return {
    status: "not_admitted",
    reason: admission.reason,
    message: scholarly && admission.reason === "no_provider_configured"
      ? "The paper search is unavailable. You can still use the program resources."
      : admission.message,
  };
  if (scholarly) {
    try {
      consensusQuery(question);
    } catch {
      return { status: "not_admitted", reason: "safety_refused", message: "Keep paper search questions general and remove any private details." };
    }
  }
  const provider = select(admission.policy.provider_order);
  if (!provider) return { status: "not_admitted", reason: "no_provider_configured", message: "Outside research is not available right now. You can still use the answer from program resources." };

  const started = Date.now();
  const toolName = depth === "deep_research" ? "research.deep_search" : "research.current_answer";
  const attempted = new Set<ResearchProviderId>();
  let selected = provider;
  let currentAdmission = admission;
  // One alternate, already configured provider may recover a failed search. Each
  // attempt still passes the owner's admission controls and the citation joiner.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const provider = selected;
    attempted.add(provider.id);
    try {
      const output = await withResearchSlot(() => runTool(
        ctx,
        toolName,
        () => provider.run({ question: scholarly ? question : inProgramContext(question, sourceContext), depth, allowed_domains: currentAdmission.policy.allowed_domains, recency: currentAdmission.policy.recency, trace_id: ctx.trace_id }, fetcher),
        { modelId: provider.modelFor(depth) },
      ));
      await recordUsage({
        at: new Date().toISOString(),
        provider: provider.id,
        model: output.model,
        depth,
        domains: Array.from(new Set(output.sources.map((s) => s.domain))).slice(0, 20),
        estimated_usd: output.estimated_usd,
        reported_usd: output.usage.reported_usd,
        input_tokens: output.usage.input_tokens,
        output_tokens: output.usage.output_tokens,
        search_queries: output.usage.search_queries,
        web_search_calls: output.usage.web_search_calls,
        fetch_url_calls: output.usage.fetch_url_calls,
        tool_calls: output.usage.tool_calls,
        ok: true,
        latency_ms: Date.now() - started,
        trace_id: ctx.trace_id,
        provider_trace_id: output.providerTraceId,
      });
      return { status: "used", output, provider: provider.id, note: scholarly ? CONSENSUS_EVIDENCE_NOTE : EXTERNAL_EVIDENCE_NOTE };
    } catch (error) {
      const code = researchFailure(error, { trace_id: ctx.trace_id, provider: provider.id, model: provider.modelFor(depth), depth });
      await recordUsage({
        at: new Date().toISOString(),
        provider: provider.id,
        model: provider.modelFor(depth),
        depth,
        domains: [],
        estimated_usd: 0,
        ...researchFailureUsage(error),
        ok: false,
        error_code: code,
        latency_ms: Date.now() - started,
        trace_id: ctx.trace_id,
      });
      const retryable = /^(?:research_(?:unresolved_citation|missing_citation|sources_missing|no_safe_sources|search_not_performed|empty_response|invalid_response|incomplete|timeout)|research_http_(?:408|429|5\d\d))$/.test(code);
      if (!scholarly && attempt === 0 && retryable && depth === "current_web") {
        const latest = await getResearchPolicy();
        const alternate = resolveResearchProvider(latest.provider_order.filter(id => !attempted.has(id) && id !== "fixture"));
        if (alternate) {
          const nextAdmission = await admitResearch(question, depth, explicit, true, ctx.role);
          if (!nextAdmission.ok) return { status: "not_admitted", reason: nextAdmission.reason, message: nextAdmission.message };
          // Re-check the provider order returned by admission in case it changed.
          const admittedAlternate = resolveResearchProvider(nextAdmission.policy.provider_order.filter(id => !attempted.has(id) && id !== "fixture"));
          if (admittedAlternate) {
            selected = admittedAlternate;
            currentAdmission = nextAdmission;
            continue;
          }
        }
      }
      if (scholarly) {
        const message = code === "research_consensus_quota"
          ? "The paper search allowance has been used. You can still use program resources."
          : code === "research_consensus_no_papers"
            ? "The paper search did not find papers within the current source filters. Try a more specific question."
            : "The paper search could not finish just now. You can still use program resources.";
        return { status: "failed", message, error_code: code };
      }
      return { status: "failed", message: "We couldn't complete the outside research just now. You can still use the answer from program resources below, including its sources and limits.", error_code: code };
    }
  }
  return { status: "failed", message: "We couldn't complete the outside research just now. Please use the available program sources or try again later.", error_code: "research_execution_failed" };
}

export type GovernedSearchResult =
  | { status: "used"; sources: ExternalSource[]; note: string; providerTraceId?: string }
  | { status: "not_admitted"; reason: string; message: string }
  | { status: "failed"; message: string; error_code: string };

/** Governed raw ranked search for authorized reasoning workflows. */
export async function governedSearch(
  question: string,
  explicit: boolean,
  ctx: ToolContext,
  fetcher?: typeof fetch,
  sourceContext?: ResearchSourceContext,
): Promise<GovernedSearchResult> {
  const policy = await getResearchPolicy();
  const selected = resolveResearchProvider(policy.provider_order);
  if (asksToAvoidWebResearch(question) || asksForScholarlyResearch(question) || selected?.id !== "perplexity_agent") {
    const result = await governedResearch(question, "current_web", explicit, ctx, fetcher, sourceContext);
    return result.status === "used"
      ? { status: "used", sources: result.output.sources, note: result.note, providerTraceId: result.output.providerTraceId }
      : result;
  }
  if (ctx.dry_run) {
    return { status: "not_admitted", reason: "dry_run", message: "This check does not look at current public sources." };
  }
  const admission = await admitResearch(question, "current_web", explicit, Boolean(selected), ctx.role);
  if (!admission.ok) return { status: "not_admitted", reason: admission.reason, message: admission.message };
  const started = Date.now();
  try {
    const output = await withResearchSlot(() => runTool(
      ctx,
      "research.web_search",
      () => searchWithPerplexity({ question: inProgramContext(question, sourceContext), allowed_domains: admission.policy.allowed_domains, recency: admission.policy.recency }, fetcher),
      { modelId: "perplexity-search" },
    ));
    await recordUsage({
      at: new Date().toISOString(),
      provider: "perplexity_agent",
      model: "perplexity-search",
      depth: "current_web",
      domains: Array.from(new Set(output.sources.map((source) => source.domain))).slice(0, 20),
      estimated_usd: 0.005,
      search_queries: 1,
      ok: true,
      latency_ms: Date.now() - started,
      trace_id: ctx.trace_id,
      provider_trace_id: output.providerTraceId,
    });
    return {
      status: "used",
      sources: output.sources,
      note: EXTERNAL_EVIDENCE_NOTE,
      providerTraceId: output.providerTraceId,
    };
  } catch (error) {
    const code = researchFailure(error, { trace_id: ctx.trace_id, provider: "perplexity_agent", model: "perplexity-search", depth: "current_web" });
    await recordUsage({
      at: new Date().toISOString(),
      provider: "perplexity_agent",
      model: "perplexity-search",
      depth: "current_web",
      domains: [],
      estimated_usd: 0,
      ok: false,
      error_code: code,
      latency_ms: Date.now() - started,
      trace_id: ctx.trace_id,
    });
    return { status: "failed", message: "We couldn't find current public sources just now. Please try again later or use the program resources.", error_code: code };
  }
}

export { plainText } from "./providers";
export { asksForScholarlyResearch } from "./consensus";
export type { ExternalSource, ResearchDepth, ResearchOutput, ResearchProviderId } from "./providers";
