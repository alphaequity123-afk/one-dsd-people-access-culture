import { afterEach, expect, it, vi } from "vitest";
import { hostedVoiceConfiguration, hostedVoiceSelected, requestHostedVoice, voiceEventsToLines } from "./hosted-voice";
vi.mock("server-only", () => ({}));
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
function configure(url = "https://example--approved-voice.modal.run/") {
  vi.stubEnv("PAC_HOSTED_VOICE_URL", url); vi.stubEnv("PAC_HOSTED_VOICE_KEY", "test-key"); vi.stubEnv("PAC_HOSTED_VOICE_SECRET", "test-secret");
}
it("rejects invalid endpoints and partial configuration without falling back to a local voice", () => {
  for (const url of ["http://example.modal.run", "https://modal.run.attacker.test", "https://user:pass@example.modal.run", "https://example.modal.run?secret=1", "https://example.modal.run:8443"]) {
    configure(url); expect(hostedVoiceSelected()).toBe(true); expect(hostedVoiceConfiguration()).toBeNull();
  }
  configure(); vi.stubEnv("PAC_HOSTED_VOICE_SECRET", ""); expect(hostedVoiceConfiguration()).toBeNull();
});
it("streams the approved service response with server-only credentials and cancellation", async () => {
  configure(); const response = new Response('data: {"audio":"test"}\n\ndata: {"done":true}\n\n', { headers: { "content-type": "text/event-stream" } });
  const fetcher = vi.fn().mockResolvedValue(response); vi.stubGlobal("fetch", fetcher);
  const controller = new AbortController(); const stream = await requestHostedVoice("Test answer", controller.signal);
  expect(await new Response(stream).text()).toContain('"done":true');
  const options = fetcher.mock.calls[0][1]; expect(options.redirect).toBe("manual"); expect(options.headers["Modal-Secret"]).toBe("test-secret");
  controller.abort(); expect(options.signal.aborted).toBe(true);
});
it("handles split SSE frames and rejects truncated events", async () => {
  const encoder = new TextEncoder();
  const source = new ReadableStream<Uint8Array>({ start(controller) {
    for (const part of [': heartbeat\r\ndata: {"audio":', '"test"}\r\n\r\ndata: {"done":true}', '\n\n']) controller.enqueue(encoder.encode(part));
    controller.close();
  } });
  expect(await new Response(source.pipeThrough(voiceEventsToLines())).text()).toBe('{"audio":"test"}\n{"done":true}\n');
  await expect(new Response(new Response('data: {"done":').body!.pipeThrough(voiceEventsToLines())).text()).rejects.toThrow("hosted_voice_stream_incomplete");
});
it("rejects provider errors and unexpected response formats", async () => {
  configure(); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private provider error", { status: 503 })));
  await expect(requestHostedVoice("Test", new AbortController().signal)).rejects.toThrow("hosted_voice_unavailable");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>login</html>", { headers: { "content-type": "text/html" } })));
  await expect(requestHostedVoice("Test", new AbortController().signal)).rejects.toThrow("hosted_voice_unavailable");
});
function redirect(location: string | null, status = 303) {
  return new Response(null, { status, headers: location === null ? {} : { location } });
}
it("follows Modal's checked result redirects with GET and the same credentials", async () => {
  configure("https://example--approved-voice.modal.run/speech");
  const endpoint = "https://example--approved-voice.modal.run/speech";
  const fetcher = vi.fn<typeof fetch>()
    .mockResolvedValueOnce(redirect("?__modal_function_call_id=fc-first"))
    .mockResolvedValueOnce(redirect(`${endpoint}?__modal_function_call_id=fc-second`))
    .mockResolvedValueOnce(new Response('data: {"done":true}\n\n', { headers: { "content-type": "text/event-stream" } }));
  vi.stubGlobal("fetch", fetcher);
  const stream = await requestHostedVoice("Test answer", new AbortController().signal);
  expect(await new Response(stream).text()).toBe('{"done":true}\n');
  const [[, initial], ...continuations] = fetcher.mock.calls;
  expect(initial).toMatchObject({ method: "POST", redirect: "manual", body: '{"text":"Test answer"}' });
  expect(continuations.map(([target]) => String(target))).toEqual(
    ["first", "second"].map(id => `${endpoint}?__modal_function_call_id=fc-${id}`),
  );
  for (const [, options] of continuations) {
    expect(options).toMatchObject({ method: "GET", redirect: "manual", headers: { "Modal-Key": "test-key", "Modal-Secret": "test-secret" } });
    expect(options?.body).toBeUndefined();
  }
});
it.each([
  null,
  "https://elsewhere.modal.run/speech?__modal_function_call_id=fc-test",
  "/health?__modal_function_call_id=fc-test",
  "?__modal_function_call_id=fc-test&other=value",
])("refuses an unsafe Modal redirect (%s)", async location => {
  configure("https://example--approved-voice.modal.run/speech");
  const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(redirect(location));
  vi.stubGlobal("fetch", fetcher);
  await expect(requestHostedVoice("Test", new AbortController().signal)).rejects.toThrow("hosted_voice_unavailable");
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("stops after three Modal redirects", async () => {
  configure("https://example--approved-voice.modal.run/speech");
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => redirect("?__modal_function_call_id=fc-test"));
  vi.stubGlobal("fetch", fetcher);
  await expect(requestHostedVoice("Test", new AbortController().signal)).rejects.toThrow("hosted_voice_unavailable");
  expect(fetcher).toHaveBeenCalledTimes(4);
});
