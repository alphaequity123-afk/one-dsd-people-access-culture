import { afterEach, expect, it, vi } from "vitest";
import { hostedVoiceConfiguration, hostedVoiceSelected, requestHostedVoice, voiceEventsToLines } from "./hosted-voice";
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
  const options = fetcher.mock.calls[0][1]; expect(options.redirect).toBe("error"); expect(options.headers["Modal-Secret"]).toBe("test-secret");
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
