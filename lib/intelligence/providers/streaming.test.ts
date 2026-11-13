import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { OpenAIAdapter } from "./openai";
import { OpenRouterAdapter } from "./openrouter";
import type { ModelRecord } from "../types";

const schema = z.object({ shortAnswer: z.string().min(1), whyItMatters: z.string() });
const answer = { shortAnswer: "Start with one small step.", whyItMatters: "It keeps the choice with the person." };
const record = { provider_model_ref: "test-model", purpose: "chat_reason" } as ModelRecord;
const request = { model_id: "mdl_test", system: "s", user: "u", schema, trace_id: "trace-1" };

function sse(events: string[], chunkSize = 23): Response {
  const bytes = new TextEncoder().encode(events.join(""));
  const body = new ReadableStream<Uint8Array>({ start(controller) {
    for (let at = 0; at < bytes.length; at += chunkSize) controller.enqueue(bytes.slice(at, at + chunkSize));
    controller.close();
  } });
  return new Response(body, { headers: { "content-type": "text/event-stream" } });
}
const pieces = (text: string, size = 9) => text.match(new RegExp(`[\\s\\S]{1,${size}}`, "g")) ?? [];

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("streamed replies from OpenAI", () => {
  const json = JSON.stringify(answer);
  const deltas = pieces(json).map(delta => `event: response.output_text.delta\ndata: ${JSON.stringify({ type: "response.output_text.delta", delta })}\n\n`);
  const completed = `event: response.completed\ndata: ${JSON.stringify({ type: "response.completed", response: { id: "resp_1", status: "completed",
    output: [{ type: "message", content: [{ type: "output_text", text: json }] }], usage: { input_tokens: 10, output_tokens: 20 } } })}\n\n`;

  it("passes text on as it arrives and returns the same checked reply", async () => {
    let sent: Record<string, unknown> = {};
    const fetcher = (async (_url: unknown, init: RequestInit) => { sent = JSON.parse(String(init.body)); return sse([...deltas, completed]); }) as unknown as typeof fetch;
    const seen: string[] = [];
    const result = await new OpenAIAdapter({ fetcher, credential: () => "test-key" }).complete({ ...request, onText: text => seen.push(text) }, record);
    expect(sent.stream).toBe(true);
    expect(result.parsed).toEqual(answer);
    expect(result.usage).toEqual({ input_tokens: 10, output_tokens: 20 });
    expect(seen.length).toBe(deltas.length);
    expect(seen.at(-1)).toBe(json);
    for (let index = 1; index < seen.length; index++) expect(seen[index].startsWith(seen[index - 1])).toBe(true);
  });

  it("does not ask for a stream unless progress is wanted", async () => {
    let sent: Record<string, unknown> = {};
    const fetcher = (async (_url: unknown, init: RequestInit) => { sent = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ id: "resp_2", status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: json }] }] })); }) as unknown as typeof fetch;
    const result = await new OpenAIAdapter({ fetcher, credential: () => "test-key" }).complete(request, record);
    expect(sent.stream).toBeUndefined();
    expect(result.parsed).toEqual(answer);
  });

  it("does not report a syntactically complete fragment as finished without its closing event", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetcher = (async () => sse(deltas)) as unknown as typeof fetch;
    await expect(new OpenAIAdapter({ fetcher, credential: () => "test-key" }).complete({ ...request, onText: () => undefined }, record)).rejects.toThrow("openai_stream_error");
  });

  it("reports a refusal, a cut-off reply and a stream error as failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const adapter = (events: string[]) => new OpenAIAdapter({ fetcher: (async () => sse(events)) as unknown as typeof fetch, credential: () => "test-key" });
    const refusal = `data: ${JSON.stringify({ type: "response.completed", response: { status: "completed", output: [{ type: "message", content: [{ type: "refusal", refusal: "no" }] }] } })}\n\n`;
    await expect(adapter([refusal]).complete({ ...request, onText: () => undefined }, record)).rejects.toThrow("provider_refusal");
    const incomplete = `data: ${JSON.stringify({ type: "response.incomplete", response: { status: "incomplete", incomplete_details: { reason: "max_output_tokens" } } })}\n\n`;
    await expect(adapter([deltas[0], incomplete]).complete({ ...request, onText: () => undefined }, record)).rejects.toThrow("openai_incomplete");
    await expect(adapter([`data: ${JSON.stringify({ type: "error", message: "boom" })}\n\n`]).complete({ ...request, onText: () => undefined }, record)).rejects.toThrow("openai_stream_error");
    await expect(adapter([]).complete({ ...request, onText: () => undefined }, record)).rejects.toThrow("openai_stream_error");
  });

  it("keeps going when showing progress fails", async () => {
    const fetcher = (async () => sse([...deltas, completed])) as unknown as typeof fetch;
    const result = await new OpenAIAdapter({ fetcher, credential: () => "test-key" }).complete({ ...request, onText: () => { throw new Error("page closed"); } }, record);
    expect(result.parsed).toEqual(answer);
  });
});

describe("streamed replies through OpenRouter", () => {
  const json = JSON.stringify(answer);
  const chunks = [": OPENROUTER PROCESSING\n\n", ...pieces(json).map(content => `data: ${JSON.stringify({ id: "or-1", choices: [{ delta: { content } }] })}\n\n`),
    `data: ${JSON.stringify({ id: "or-1", choices: [{ delta: {}, finish_reason: "stop" }] })}\n\n`,
    `data: ${JSON.stringify({ id: "or-1", choices: [], usage: { prompt_tokens: 7, completion_tokens: 9 } })}\n\n`, "data: [DONE]\n\n"];

  it("passes text on as it arrives and returns the same checked reply", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    let sent: Record<string, unknown> = {};
    const fetcher = (async (_url: unknown, init: RequestInit) => { sent = JSON.parse(String(init.body)); return sse(chunks); }) as unknown as typeof fetch;
    const seen: string[] = [];
    const result = await new OpenRouterAdapter(fetcher).complete({ ...request, onText: text => seen.push(text) }, record);
    expect(sent.stream).toBe(true);
    // Nothing else is added to the request, so the same providers stay eligible.
    expect(Object.keys(sent).sort()).toEqual(["max_tokens", "messages", "model", "provider", "response_format", "stream"]);
    expect(result.parsed).toEqual(answer);
    expect(result.usage).toEqual({ input_tokens: 7, output_tokens: 9 });
    expect(seen.at(-1)).toBe(json);
  });

  it("treats a reply that stops early as incomplete", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    const fetcher = (async () => sse(chunks.slice(0, 3))) as unknown as typeof fetch;
    await expect(new OpenRouterAdapter(fetcher).complete({ ...request, onText: () => undefined }, record)).rejects.toThrow("openrouter_incomplete");
  });
});
