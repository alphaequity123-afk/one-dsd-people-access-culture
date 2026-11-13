import { z, type ZodType } from "zod";
import type { ModelRecord } from "../types";
import type { CompleteRequest, CompleteResult, ProviderAdapter } from "./index";
import { logProviderFailure } from "./log";
import { sseEvents } from "./sse";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

/** Minimal shape of a responses-interface reply. Anything else is ignored. */
const OpenAIResponseSchema = z
  .object({
    id: z.string().optional(),
    status: z.string().optional(),
    incomplete_details: z.object({ reason: z.string().optional() }).passthrough().optional().nullable(),
    output: z
      .array(
        z
          .object({
            type: z.string(),
            content: z
              .array(
                z
                  .object({
                    type: z.string(),
                    text: z.string().optional(),
                    refusal: z.string().optional(),
                  })
                  .passthrough(),
              )
              .optional(),
          })
          .passthrough(),
      )
      .optional(),
    usage: z.object({ input_tokens: z.number().optional(), output_tokens: z.number().optional() }).passthrough().optional(),
  })
  .passthrough();

type JsonSchema = Record<string, unknown>;

function isSchemaObject(value: unknown): value is JsonSchema {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Widen one property schema so the vendor may emit null where the source schema allowed omission. */
function withNull(node: JsonSchema): JsonSchema {
  if (Array.isArray(node.anyOf)) return { ...node, anyOf: [...node.anyOf, { type: "null" }] };
  if (typeof node.type === "string") return { ...node, type: [node.type, "null"] };
  if (Array.isArray(node.type)) return node.type.includes("null") ? node : { ...node, type: [...node.type, "null"] };
  return { anyOf: [node, { type: "null" }] };
}

function mapSchemaRecord(record: JsonSchema, injected: WeakSet<object>): JsonSchema {
  const out: JsonSchema = {};
  for (const [name, node] of Object.entries(record)) out[name] = strictify(node, injected);
  return out;
}

/**
 * Vendor strict mode rejects a schema (HTTP 400) unless every object lists every
 * property in `required` and sets additionalProperties:false. Zod leaves `.optional()`
 * properties out of `required`, so those are made nullable and required instead. Each
 * widened property node is remembered so a null the vendor emits there is dropped again
 * before the original Zod schema validates the reply.
 */
function strictify(node: unknown, injected: WeakSet<object>): unknown {
  if (Array.isArray(node)) return node.map((entry) => strictify(entry, injected));
  if (!isSchemaObject(node)) return node;
  const out: JsonSchema = {};
  for (const [key, value] of Object.entries(node)) {
    out[key] = (key === "properties" || key === "$defs") && isSchemaObject(value) ? mapSchemaRecord(value, injected) : strictify(value, injected);
  }
  const isObjectNode = out.type === "object" || (Array.isArray(out.type) && out.type.includes("object"));
  if (isObjectNode && isSchemaObject(out.properties)) {
    const required = new Set(Array.isArray(out.required) ? out.required.filter((name): name is string => typeof name === "string") : []);
    const properties: JsonSchema = {};
    for (const [name, property] of Object.entries(out.properties)) {
      if (required.has(name) || !isSchemaObject(property)) {
        properties[name] = property;
        continue;
      }
      const widened = withNull(property);
      injected.add(widened);
      properties[name] = widened;
    }
    out.properties = properties;
    out.required = Object.keys(properties);
    out.additionalProperties = false;
  }
  return out;
}

function resolveRef(node: JsonSchema, root: JsonSchema): JsonSchema {
  const ref = node.$ref;
  if (typeof ref !== "string" || !ref.startsWith("#/")) return node;
  let current: unknown = root;
  for (const segment of ref.slice(2).split("/")) {
    if (!isSchemaObject(current)) return node;
    current = current[segment.replace(/~1/g, "/").replace(/~0/g, "~")];
  }
  return isSchemaObject(current) ? current : node;
}

/** Remove nulls the vendor emitted only because strict mode widened an optional property. */
export function stripInjectedNulls(value: unknown, schema: unknown, root: JsonSchema, injected: WeakSet<object>, depth = 0): unknown {
  if (depth > 64 || !isSchemaObject(schema)) return value;
  const node = resolveRef(schema, root);
  if (Array.isArray(value)) {
    return isSchemaObject(node.items) ? value.map((entry) => stripInjectedNulls(entry, node.items, root, injected, depth + 1)) : value;
  }
  if (isSchemaObject(value) && isSchemaObject(node.properties)) {
    for (const [name, property] of Object.entries(node.properties)) {
      if (!(name in value)) continue;
      if (value[name] === null && isSchemaObject(property) && injected.has(property)) {
        delete value[name];
        continue;
      }
      value[name] = stripInjectedNulls(value[name], property, root, injected, depth + 1);
    }
    return value;
  }
  if (Array.isArray(node.anyOf)) {
    for (const branch of node.anyOf) value = stripInjectedNulls(value, branch, root, injected, depth + 1);
  }
  return value;
}

export type StrictSchema = { schema: JsonSchema; injected: WeakSet<object> };

/**
 * JSON schema for the vendor's strict structured-output mode. Zod 4 emits draft 2020-12 with
 * additionalProperties:false for z.object; optional properties become required nullable
 * properties (see strictify). The "$schema" marker is dropped because the vendor rejects
 * unknown top-level keywords.
 */
export function strictSchemaForOpenAI(schema: ZodType): StrictSchema {
  const raw = z.toJSONSchema(schema) as JsonSchema;
  const { $schema: _marker, ...rest } = raw;
  void _marker;
  const injected = new WeakSet<object>();
  return { schema: strictify(rest, injected) as JsonSchema, injected };
}

export function jsonSchemaForOpenAI(schema: ZodType): Record<string, unknown> {
  return strictSchemaForOpenAI(schema).schema;
}

/** Message is a finite code (openai_http_400, openai_timeout, ...); status and body are for logs only. */
export class OpenAIRequestError extends Error {
  constructor(code: string, readonly status?: number, readonly body?: string) {
    super(code);
    this.name = "OpenAIRequestError";
  }
}

/**
 * Read a streamed reply. Text is passed on as it arrives, and the service's own finished
 * reply is returned so it is checked exactly like one that was not streamed.
 */
async function streamedReply(response: Response, onText: (textSoFar: string) => void): Promise<unknown> {
  if (!response.body) throw new Error("openai_stream_error");
  let text = "";
  let finished: unknown;
  for await (const { event, data } of sseEvents(response.body)) {
    if (data === "[DONE]") break;
    let payload: { type?: string; delta?: unknown; response?: unknown };
    try { payload = JSON.parse(data); } catch { continue; }
    const type = payload.type ?? event;
    if (type === "response.output_text.delta" && typeof payload.delta === "string") {
      text += payload.delta;
      try { onText(text); } catch { /* Showing progress never interrupts the reply. */ }
    } else if (type === "response.completed" || type === "response.incomplete" || type === "response.failed") {
      finished = payload.response;
    } else if (type === "error") {
      throw new Error("openai_stream_error");
    }
  }
  if (finished) return finished;
  // A syntactically complete fragment is not proof that the provider finished the reply.
  throw new Error("openai_stream_error");
}

export type OpenAIAdapterOptions = {
  fetcher?: typeof fetch;
  /** Read at call time so a test can stub the environment. */
  credential?: () => string | undefined;
  timeoutMs?: number;
};

export class OpenAIAdapter implements ProviderAdapter {
  readonly id = "openai" as const;
  readonly generative = true;
  private readonly opts: OpenAIAdapterOptions;
  constructor(opts: OpenAIAdapterOptions = {}) {
    this.opts = opts;
  }
  private credential(): string | undefined {
    return (this.opts.credential ?? (() => process.env.OPENAI_API_KEY))()?.trim() || undefined;
  }
  async complete(req: CompleteRequest, record: ModelRecord): Promise<CompleteResult> {
    const model = record.provider_model_ref;
    const fail = (reason: string, extra: { status?: number; body?: string; detail?: Record<string, unknown> } = {}): never => {
      logProviderFailure({ provider: "openai", model, reason, trace_id: req.trace_id, ...extra });
      throw new OpenAIRequestError(reason, extra.status, extra.body);
    };
    const key = this.credential();
    if (!key) return fail("openai_credential_missing");
    const fetcher = this.opts.fetcher ?? globalThis.fetch;
    const remaining = (req.deadlineAt ?? Infinity) - Date.now();
    if (remaining <= 0) return fail("provider_deadline_exceeded");
    const timeoutMs = Math.max(1, Math.min(this.opts.timeoutMs ?? req.timeoutMs ?? (record.purpose === "eval_judge" ? 120_000 : 60_000), remaining));
    if (process.env.PAC_CLONE_AGENTS === "on" && Buffer.byteLength(req.system + req.user, "utf8") > 220_000) return fail("clone_prompt_limit");
    const strict = strictSchemaForOpenAI(req.schema);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const signal = AbortSignal.any([controller.signal, ...(req.signal ? [req.signal] : [])]);

    const body: Record<string, unknown> = {
      model,
      input: [
        { role: "developer", content: req.system },
        { role: "user", content: req.user },
      ],
      text: { format: { type: "json_schema", name: "pac_structured_output", schema: strict.schema, strict: true } },
      // Reasoning tokens count toward this cap on the Responses API; 4000 left
      // medium-effort answers incomplete.
      max_output_tokens: process.env.PAC_CLONE_AGENTS === "on" ? Math.min(req.maxTokens ?? 8000, 8000) : req.maxTokens ?? 12_000,
      // Disable API response storage. Provider abuse-monitoring terms still apply.
      store: false,
    };
    // Streaming changes only how the reply arrives. The finished reply passes the same checks below.
    if (req.onText) body.stream = true;

    let response: Response;
    try {
      response = await fetcher(OPENAI_RESPONSES_URL, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify(body),
        signal,
      });
    } catch (error) {
      clearTimeout(timer);
      const timedOut = signal.aborted || (error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name));
      return fail(timedOut ? "openai_timeout" : "openai_network", { detail: { timeout_ms: timeoutMs } });
    }
    if (!response.ok) {
      clearTimeout(timer);
      void response.body?.cancel().catch(() => undefined);
      return fail(`openai_http_${response.status}`, { status: response.status });
    }

    let json: unknown;
    try {
      json = req.onText ? await streamedReply(response, req.onText) : await response.json();
    } catch (error) {
      const timedOut = signal.aborted || (error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name));
      return fail(timedOut ? "openai_timeout" : req.onText ? "openai_stream_error" : "openai_bad_json", { status: response.status });
    } finally {
      clearTimeout(timer);
    }
    const parsedEnvelope = OpenAIResponseSchema.safeParse(json);
    if (!parsedEnvelope.success) return fail("openai_bad_envelope", { status: response.status });
    const env = parsedEnvelope.data;
    if (env.status === "failed") return fail("openai_service_error", { status: response.status });
    if (env.status === "incomplete") {
      return fail("openai_incomplete", { status: response.status, detail: { incomplete_reason: env.incomplete_details?.reason ?? "unknown" } });
    }

    let text: string | undefined;
    for (const item of env.output ?? []) {
      if (item.type !== "message") continue;
      for (const part of item.content ?? []) {
        if (part.type === "refusal") return fail("provider_refusal", { status: response.status });
        if (part.type === "output_text" && typeof part.text === "string") text = (text ?? "") + part.text;
      }
    }
    if (!text) return fail("openai_no_output", { status: response.status, detail: { output_types: (env.output ?? []).map((item) => item.type).slice(0, 8) } });

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return fail("openai_output_not_json", { status: response.status });
    }
    parsed = stripInjectedNulls(parsed, strict.schema, strict.schema, strict.injected);
    const checked = req.schema.safeParse(parsed);
    if (!checked.success) {
      // Issue paths and codes only: generated text never reaches the log.
      const issues = checked.error.issues.slice(0, 6).map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.code}`);
      return fail("openai_invalid_structured_output", { status: response.status, detail: { issues } });
    }
    return {
      parsed: checked.data,
      model_id: req.model_id,
      provider_trace_id: env.id,
      usage: env.usage ? { input_tokens: env.usage.input_tokens ?? 0, output_tokens: env.usage.output_tokens ?? 0 } : undefined,
    };
  }
  async health() {
    return { ok: Boolean(this.credential()), latency_ms: 0 };
  }
}
