import type { CompleteRequest, CompleteResult, ProviderAdapter } from "./index";
import type { ModelRecord } from "../types";
import { strictSchemaForOpenAI, stripInjectedNulls } from "./openai";
import { logProviderFailure } from "./log";
import { sseEvents } from "./sse";

/** Read a streamed reply into the same shape as one that was not streamed, passing text on as it arrives. */
async function streamedChat(response: Response, onText: (textSoFar: string) => void) {
  if (!response.body) throw new Error("openrouter_incomplete");
  let content = "", refusal: unknown, finish: unknown, id: unknown, usage: { prompt_tokens?: number; completion_tokens?: number } | undefined;
  for await (const { data } of sseEvents(response.body)) {
    if (data === "[DONE]") break;
    let chunk: { id?: unknown; error?: unknown; usage?: typeof usage; choices?: Array<{ finish_reason?: unknown; delta?: { content?: unknown; refusal?: unknown } }> };
    try { chunk = JSON.parse(data); } catch { continue; }
    if (chunk.error) throw new Error("openrouter_incomplete");
    id ??= chunk.id;
    if (chunk.usage) usage = chunk.usage;
    const choice = chunk.choices?.[0];
    if (!choice) continue;
    if (choice.delta?.refusal) refusal = choice.delta.refusal;
    if (choice.finish_reason) finish = choice.finish_reason;
    if (typeof choice.delta?.content === "string" && choice.delta.content) {
      content += choice.delta.content;
      try { onText(content); } catch { /* Showing progress never interrupts the reply. */ }
    }
  }
  return { id, usage, choices: [{ finish_reason: finish, message: { content, refusal } }] };
}

/** Server-only model routing; search evidence is supplied separately by research. */
export class OpenRouterAdapter implements ProviderAdapter {
  readonly id = "openrouter" as const;
  readonly generative = true;
  constructor(private readonly fetcher: typeof fetch = fetch) {}
  async complete(req: CompleteRequest, record: ModelRecord): Promise<CompleteResult> {
    const key = process.env.OPENROUTER_API_KEY?.trim();
    if (!key) throw new Error("openrouter_credential_missing");
    if (Buffer.byteLength(req.system + req.user, "utf8") > 220_000) throw new Error("clone_prompt_limit");
    const strict = strictSchemaForOpenAI(req.schema);
    const response = await this.fetcher("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", signal: AbortSignal.timeout(Math.min(req.timeoutMs ?? 60_000, 90_000)),
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json", "X-Title": "People, Access and Culture ASK" },
      body: JSON.stringify({ model: record.provider_model_ref,
        messages: [{ role: "system", content: req.system }, { role: "user", content: req.user }],
        max_tokens: Math.min(req.maxTokens ?? 8000, 8000),
        provider: { require_parameters: true, data_collection: "deny" },
        response_format: { type: "json_schema", json_schema: { name: "ask_answer", strict: true, schema: strict.schema } },
        // Only the stream switch is added: with require_parameters, any extra option could rule out a provider.
        ...(req.onText ? { stream: true } : {}),
      }), cache: "no-store",
    });
    if (!response.ok) throw new Error(`openrouter_http_${response.status}`);
    const data = req.onText ? await streamedChat(response, req.onText) : await response.json();
    const choice = data.choices?.[0];
    if (choice?.finish_reason !== "stop" || choice.message?.refusal || typeof choice.message?.content !== "string") throw new Error("openrouter_incomplete");
    const value = stripInjectedNulls(JSON.parse(choice.message.content), strict.schema, strict.schema, strict.injected);
    const checked = req.schema.safeParse(value);
    if (!checked.success) {
      // Issue paths and codes only: generated text never reaches the log. The ZodError is
      // rethrown unchanged so the caller's one format retry still applies.
      const issues = checked.error.issues.slice(0, 6).map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.code}`);
      logProviderFailure({ provider: "openrouter", model: record.provider_model_ref, reason: "openrouter_invalid_structured_output", trace_id: req.trace_id, detail: { issues } });
      throw checked.error;
    }
    return { parsed: checked.data, model_id: req.model_id, provider_trace_id: data.id,
      usage: data.usage ? { input_tokens: data.usage.prompt_tokens ?? 0, output_tokens: data.usage.completion_tokens ?? 0 } : undefined };
  }
  async health() { return { ok: Boolean(process.env.OPENROUTER_API_KEY?.trim()), latency_ms: 0 }; }
}
