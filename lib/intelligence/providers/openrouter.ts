import type { CompleteRequest, CompleteResult, ProviderAdapter } from "./index";
import type { ModelRecord } from "../types";
import { strictSchemaForOpenAI, stripInjectedNulls } from "./openai";

/** Server-only model routing; search evidence is supplied separately by research. */
export class OpenRouterAdapter implements ProviderAdapter {
  readonly id = "openrouter" as const;
  readonly generative = true;
  constructor(private readonly fetcher: typeof fetch = fetch) {}
  async complete(req: CompleteRequest, record: ModelRecord): Promise<CompleteResult> {
    const key = process.env.OPENROUTER_API_KEY?.trim();
    if (!key) throw new Error("openrouter_credential_missing");
    if (Buffer.byteLength(req.system + req.user, "utf8") > 80_000) throw new Error("clone_prompt_limit");
    const strict = strictSchemaForOpenAI(req.schema);
    const response = await this.fetcher("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", signal: AbortSignal.timeout(Math.min(req.timeoutMs ?? 60_000, 90_000)),
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json", "X-Title": "People, Access and Culture ASK" },
      body: JSON.stringify({ model: record.provider_model_ref,
        messages: [{ role: "system", content: req.system }, { role: "user", content: req.user }],
        max_tokens: Math.min(req.maxTokens ?? 4000, 4000),
        provider: { require_parameters: true, data_collection: "deny" },
        response_format: { type: "json_schema", json_schema: { name: "ask_answer", strict: true, schema: strict.schema } },
      }), cache: "no-store",
    });
    if (!response.ok) throw new Error(`openrouter_http_${response.status}`);
    const data = await response.json();
    const choice = data.choices?.[0];
    if (choice?.finish_reason !== "stop" || choice.message?.refusal || typeof choice.message?.content !== "string") throw new Error("openrouter_incomplete");
    const value = stripInjectedNulls(JSON.parse(choice.message.content), strict.schema, strict.schema, strict.injected);
    return { parsed: req.schema.parse(value), model_id: req.model_id, provider_trace_id: data.id,
      usage: data.usage ? { input_tokens: data.usage.prompt_tokens ?? 0, output_tokens: data.usage.completion_tokens ?? 0 } : undefined };
  }
  async health() { return { ok: Boolean(process.env.OPENROUTER_API_KEY?.trim()), latency_ms: 0 }; }
}
