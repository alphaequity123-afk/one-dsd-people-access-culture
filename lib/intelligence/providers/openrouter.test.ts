import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { OpenRouterAdapter } from "./openrouter";
import type { ModelRecord } from "../types";

const record = { provider_model_ref: "openai/gpt-4.1" } as ModelRecord;
const schema = z.object({ shortAnswer: z.string().min(1), kind: z.enum(["source_excerpt", "inference"]) });
const reply = (content: unknown) => (async () => new Response(JSON.stringify({ id: "or-1", choices: [{ finish_reason: "stop", message: { content: JSON.stringify(content) } }] }))) as unknown as typeof fetch;
const request = { model_id: "mdl_openrouter_ask", system: "s", user: "u", schema, trace_id: "trace-1" };

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("OpenRouter structured replies", () => {
  it("returns a reply that fits the format", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    const result = await new OpenRouterAdapter(reply({ shortAnswer: "Yes.", kind: "inference" })).complete(request, record);
    expect(result.parsed).toEqual({ shortAnswer: "Yes.", kind: "inference" });
  });

  it("logs which fields did not fit, without the text, and keeps the format error for the retry", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const error = await new OpenRouterAdapter(reply({ shortAnswer: "A private sentence.", kind: "quote" })).complete(request, record).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(z.ZodError);
    const [, fields] = logged.mock.calls.find(([label]) => label === "provider_request_failed")!;
    expect(fields).toMatchObject({ provider: "openrouter", reason: "openrouter_invalid_structured_output", issues: ["kind: invalid_value"], trace_id: "trace-1" });
    expect(JSON.stringify(logged.mock.calls)).not.toContain("private sentence");
  });
});
