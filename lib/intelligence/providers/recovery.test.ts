import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { CompleteRequest, CompleteResult, ProviderAdapter } from "./index";
import type { ModelRecord } from "../types";
import { ProviderUnavailableError, RecoveringProvider, providerFailureKind } from "./recovery";

let counter = 0;
const schema = z.object({ answer: z.string() });
const request = (): CompleteRequest => ({ model_id: "preferred", system: "s", user: "u", schema, trace_id: "test", timeoutMs: 60_000 });
function candidate(provider: ModelRecord["provider_id"], run: (req: CompleteRequest) => Promise<CompleteResult>) {
  const model = { model_id: `mdl_${provider}_${++counter}`, provider_id: provider, provider_model_ref: `model-${counter}` } as ModelRecord;
  const complete = vi.fn(run);
  const adapter: ProviderAdapter = { id: provider, generative: true, complete, health: async () => ({ ok: true, latency_ms: 0 }) };
  return { model, adapter, complete };
}
const success = async () => ({ parsed: { answer: "supported answer" }, model_id: "ignored" });
const reject = (code: string, status?: number) => async () => { throw Object.assign(new Error(code), { status }); };
beforeEach(() => { vi.spyOn(console, "warn").mockImplementation(() => undefined); });
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

describe("bounded recovery through an approved existing provider", () => {
  it.each([[402, "billing"], [401, "authentication"], [429, "rate_limit"], [503, "service"]] as const)("recovers once from HTTP%s and cools down the failing service", async (status, kind) => {
    const primary = candidate("openrouter", reject(`openrouter_http_${status}`, status));
    const backup = candidate("openai", success);
    const adapter = new RecoveringProvider([primary, backup]);
    const budget = { switchesRemaining: 1 };
    const result = await adapter.complete({ ...request(), recoveryBudget: budget });
    expect(result.model_id).toBe(backup.model.model_id);
    expect(primary.complete).toHaveBeenCalledOnce();
    expect(backup.complete).toHaveBeenCalledOnce();
    expect(budget.switchesRemaining).toBe(0);
    await adapter.complete(request());
    expect(primary.complete).toHaveBeenCalledOnce();
    expect(backup.complete).toHaveBeenCalledTimes(2);
    expect(providerFailureKind(Object.assign(new Error(`openrouter_http_${status}`), { status }))).toBe(kind);
  });

  it.each(["provider_refusal", "openrouter_http_403", "openai_invalid_structured_output", "clone_prompt_limit"])("does not route around %s", async code => {
    const primary = candidate("openrouter", reject(code));
    const backup = candidate("openai", success);
    await expect(new RecoveringProvider([primary, backup]).complete(request())).rejects.toThrow(code);
    expect(backup.complete).not.toHaveBeenCalled();
  });

  it("never dispatches a third provider when both first attempts fail", async () => {
    const primary = candidate("openrouter", reject("openrouter_http_402", 402));
    const backup = candidate("openai", reject("openai_http_429", 429));
    const third = candidate("anthropic", success);
    await expect(new RecoveringProvider([primary, backup, third]).complete(request())).rejects.toMatchObject({ name: "ProviderUnavailableError", attempts: 2, failureKind: "rate_limit" });
    expect(third.complete).not.toHaveBeenCalled();
  });

  it("shares a switch budget across writing and review", async () => {
    const first = new RecoveringProvider([candidate("openrouter", reject("openrouter_http_402")), candidate("openai", success)]);
    const budget = { switchesRemaining: 1 };
    await first.complete({ ...request(), recoveryBudget: budget });
    const anotherBackup = candidate("anthropic", success);
    const review = new RecoveringProvider([candidate("openai", reject("openai_http_503")), anotherBackup]);
    await expect(review.complete({ ...request(), recoveryBudget: budget })).rejects.toMatchObject({ attempts: 1 });
    expect(anotherBackup.complete).not.toHaveBeenCalled();
  });

  it("cannot silently change to a third service at the start of a later stage", async () => {
    const primary = candidate("openrouter", reject("openrouter_http_402"));
    const backup = candidate("openai", success);
    const third = candidate("anthropic", success);
    const adapter = new RecoveringProvider([primary, backup, third]);
    const budget = { switchesRemaining: 1 };
    await adapter.complete({ ...request(), recoveryBudget: budget });
    backup.complete.mockImplementationOnce(reject("openai_http_429"));
    await expect(adapter.complete({ ...request(), recoveryBudget: budget })).rejects.toBeInstanceOf(ProviderUnavailableError);
    await expect(adapter.complete({ ...request(), recoveryBudget: budget })).rejects.toBeInstanceOf(ProviderUnavailableError);
    expect(third.complete).not.toHaveBeenCalled();
  });

  it("reserves time for recovery and preserves the shared absolute deadline", async () => {
    vi.useFakeTimers();
    const start = Date.now();
    const primary = candidate("openrouter", async req => {
      expect(req.timeoutMs).toBe(30_000);
      vi.setSystemTime(start + req.timeoutMs!);
      throw new Error("openrouter_timeout");
    });
    const backup = candidate("openai", async req => {
      expect(req.deadlineAt).toBe(start + 50_000);
      expect(req.timeoutMs).toBe(20_000);
      return success();
    });
    await new RecoveringProvider([primary, backup]).complete({ ...request(), deadlineAt: start + 50_000 });
    expect(backup.complete).toHaveBeenCalledOnce();
  });

  it("does not begin recovery after the shared deadline", async () => {
    vi.useFakeTimers();
    const start = Date.now();
    const primary = candidate("openrouter", async () => { vi.setSystemTime(start + 10_001); throw new Error("openrouter_timeout"); });
    const backup = candidate("openai", success);
    await expect(new RecoveringProvider([primary, backup]).complete({ ...request(), deadlineAt: start + 10_000 })).rejects.toMatchObject({ failureKind: "deadline" });
    expect(backup.complete).not.toHaveBeenCalled();
  });

  it("restarts partial visible output before the fallback begins", async () => {
    const seen: string[] = [];
    const primary = candidate("openrouter", async req => { req.onText!("old partial"); throw new Error("openrouter_stream_error"); });
    const backup = candidate("openai", async req => { req.onText!("fresh complete"); return success(); });
    await new RecoveringProvider([primary, backup]).complete({ ...request(), onText: text => seen.push(text), onRestart: () => seen.push("RESET") });
    expect(seen).toEqual(["old partial", "RESET", "fresh complete"]);
  });

  it("does not mix streamed answers when the caller cannot reset them", async () => {
    const primary = candidate("openrouter", async req => { req.onText!("old partial"); throw new Error("openrouter_stream_error"); });
    const backup = candidate("openai", success);
    await expect(new RecoveringProvider([primary, backup]).complete({ ...request(), onText: () => undefined })).rejects.toBeInstanceOf(ProviderUnavailableError);
    expect(backup.complete).not.toHaveBeenCalled();
  });

  it("checks admission before each dispatch and never recovers from denial", async () => {
    const primary = candidate("openrouter", reject("openrouter_http_402"));
    const backup = candidate("openai", success);
    const beforeAttempt = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("owner_stopped"));
    await expect(new RecoveringProvider([primary, backup]).complete({ ...request(), beforeAttempt })).rejects.toThrow("owner_stopped");
    expect(beforeAttempt).toHaveBeenCalledTimes(2);
    expect(backup.complete).not.toHaveBeenCalled();
  });

  it("honors cancellation instead of trying another service", async () => {
    const controller = new AbortController();
    const primary = candidate("openrouter", async () => { controller.abort(); throw new Error("openrouter_timeout"); });
    const backup = candidate("openai", success);
    await expect(new RecoveringProvider([primary, backup]).complete({ ...request(), signal: controller.signal })).rejects.toMatchObject({ failureKind: "cancelled" });
    expect(backup.complete).not.toHaveBeenCalled();
  });
});
