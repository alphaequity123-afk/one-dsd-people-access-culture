import type { CompleteRequest, CompleteResult, ProviderAdapter } from "./index";
import type { ModelRecord } from "../types";

export type ProviderFailureKind = "billing" | "authentication" | "forbidden" | "rate_limit" | "timeout" | "network" | "service" | "refusal" | "invalid_output" | "configuration" | "deadline" | "cancelled" | "unknown";

/** Finite operational categories only. Neither prompts nor vendor error bodies enter this contract. */
export function providerFailureKind(error: unknown): ProviderFailureKind {
  if (error instanceof ProviderUnavailableError) return error.failureKind;
  const message = error instanceof Error ? error.message : "";
  if (/provider_refusal|content_filter|moderation/.test(message)) return "refusal";
  if (message === "provider_deadline_exceeded") return "deadline";
  if (message === "provider_cancelled") return "cancelled";
  const status = error && typeof error === "object" && "status" in error && typeof error.status === "number"
    ? error.status : Number(message.match(/_http_(\d{3})\b/)?.[1]);
  if (status === 402) return "billing";
  if (status === 401) return "authentication";
  // 403 also covers moderation and owner guardrails. Never route around it.
  if (status === 403) return "forbidden";
  if (status === 429) return "rate_limit";
  if (status === 408 || status === 504 || /timeout/.test(message) || (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name))) return "timeout";
  if ((status >= 500 && status <= 599) || /_service_error/.test(message)) return "service";
  if (/network|fetch failed|stream_error/.test(message)) return "network";
  if (/credential_missing/.test(message)) return "configuration";
  if (/incomplete|invalid_structured|bad_json|bad_envelope|no_output|output_not_json/.test(message) || (error instanceof Error && error.name.includes("ZodError"))) return "invalid_output";
  return "unknown";
}

export class ProviderUnavailableError extends Error {
  constructor(readonly failureKind: ProviderFailureKind, readonly attempts: number, readonly status?: number) {
    super(failureKind === "deadline" ? "provider_deadline_exceeded" : failureKind === "cancelled" ? "provider_cancelled" : "provider_unavailable");
    this.name = "ProviderUnavailableError";
  }
}

const RECOVERABLE = new Set<ProviderFailureKind>(["billing", "authentication", "rate_limit", "timeout", "network", "service", "configuration"]);
const cooldowns = new Map<string, { until: number; kind: ProviderFailureKind }>();
const keyFor = (model: ModelRecord) => `${model.provider_id}:${model.provider_model_ref}`;
const cooldownMs = (kind: ProviderFailureKind) => kind === "billing" || kind === "authentication" || kind === "configuration" ? 300_000 : kind === "rate_limit" ? 30_000 : 15_000;

export type RecoveryCandidate = { model: ModelRecord; adapter: ProviderAdapter; available?: () => boolean };

/**
 * Only wraps an explicitly permitted public-corpus Ask binding. At most two dispatches,
 * one shared deadline and one request-scoped provider switch. No same-provider retry,
 * no recovery from refusal/forbidden/invalid content, and no new model or credential.
 * Cooldowns are deliberately process-local; persistent financial admission stays upstream.
 */
export class RecoveringProvider implements ProviderAdapter {
  readonly generative = true;
  readonly id: ModelRecord["provider_id"];
  constructor(private readonly candidates: RecoveryCandidate[]) {
    if (!candidates.length) throw new Error("provider_candidates_missing");
    this.id = candidates[0].adapter.id;
  }

  async complete(req: CompleteRequest): Promise<CompleteResult> {
    const deadline = Math.min(req.deadlineAt ?? Infinity, Date.now() + Math.min(req.timeoutMs ?? 60_000, 90_000));
    const budget: NonNullable<CompleteRequest["recoveryBudget"]> = req.recoveryBudget ?? { switchesRemaining: 1 };
    let attempts = 0, lastKind: ProviderFailureKind = "configuration", lastStatus: number | undefined;
    let hasShownText = false;
    const candidates = this.candidates.filter((candidate, index, all) => all.findIndex(other => other.model.provider_id === candidate.model.provider_id) === index);

    for (let index = 0; index < candidates.length && attempts < 2; index++) {
      if (req.signal?.aborted) throw new ProviderUnavailableError("cancelled", attempts);
      if (Date.now() >= deadline) throw new ProviderUnavailableError("deadline", attempts);
      const candidate = candidates[index];
      if (candidate.available && !candidate.available()) continue;
      const key = keyFor(candidate.model), cooldown = cooldowns.get(key);
      if (cooldown && cooldown.until > Date.now()) { lastKind = cooldown.kind; continue; }
      if (cooldown) cooldowns.delete(key);
      const changesProvider = Boolean(budget.providerId && budget.providerId !== candidate.model.provider_id);
      if (changesProvider && budget.switchesRemaining <= 0) continue;
      // Admission and owner-stop checks happen outside recovery handling: a denial cannot
      // trigger another provider. Callers can reuse one budget across drafting and review.
      await req.beforeAttempt?.(candidate.model);
      if (req.signal?.aborted) throw new ProviderUnavailableError("cancelled", attempts);
      const remaining = deadline - Date.now();
      if (remaining < 1_000 && attempts) throw new ProviderUnavailableError("deadline", attempts);
      if (remaining <= 0) throw new ProviderUnavailableError("deadline", attempts);
      if (attempts) {
        if (hasShownText && !req.onRestart) throw new ProviderUnavailableError(lastKind, attempts, lastStatus);
        if (hasShownText) req.onRestart!();
        hasShownText = false;
      }
      if (changesProvider) budget.switchesRemaining -= 1;
      budget.providerId = candidate.model.provider_id;
      const hasAlternative = !attempts && budget.switchesRemaining > 0 && candidates.slice(index + 1).some(next => (!next.available || next.available()) && (cooldowns.get(keyFor(next.model))?.until ?? 0) <= Date.now());
      const timeoutMs = Math.max(1, Math.floor(hasAlternative && remaining >= 2_000 ? Math.min(45_000, remaining * 0.6) : remaining));
      const signal = AbortSignal.any([AbortSignal.timeout(timeoutMs), ...(req.signal ? [req.signal] : [])]);
      attempts += 1;
      try {
        const result = await candidate.adapter.complete({ ...req, model_id: candidate.model.model_id, timeoutMs, deadlineAt: deadline, signal,
          onText: req.onText ? text => { if (!signal.aborted) { hasShownText = true; req.onText!(text); } } : undefined,
        }, candidate.model);
        if (req.signal?.aborted) throw new ProviderUnavailableError("cancelled", attempts);
        if (Date.now() >= deadline) throw new ProviderUnavailableError("deadline", attempts);
        if (signal.aborted) throw new Error("provider_timeout");
        cooldowns.delete(key);
        return { ...result, model_id: candidate.model.model_id };
      } catch (error) {
        if (req.signal?.aborted) throw new ProviderUnavailableError("cancelled", attempts);
        lastKind = providerFailureKind(error);
        if (error instanceof ProviderUnavailableError) lastKind = error.failureKind;
        lastStatus = error && typeof error === "object" && "status" in error && typeof error.status === "number" ? error.status : undefined;
        if (!RECOVERABLE.has(lastKind)) throw error;
        cooldowns.set(key, { until: Date.now() + cooldownMs(lastKind), kind: lastKind });
        // The registry is small; keep dynamically configured model names bounded too.
        if (cooldowns.size > 32) cooldowns.delete(cooldowns.keys().next().value!);
        console.warn("ask_provider_attempt_failed", { traceId: req.trace_id, provider: candidate.model.provider_id, modelId: candidate.model.model_id, kind: lastKind, status: lastStatus, attempt: attempts });
      }
    }
    throw new ProviderUnavailableError(Date.now() >= deadline ? "deadline" : lastKind, attempts, lastStatus);
  }

  async health() { return { ok: this.candidates.some(candidate => (!candidate.available || candidate.available()) && (cooldowns.get(keyFor(candidate.model))?.until ?? 0) <= Date.now()), latency_ms: 0 }; }
}
