import "server-only";

/** These credentials stay on Railway; the browser only calls the same-origin voice route. */
export function hostedVoiceConfiguration() {
  const endpoint = process.env.PAC_HOSTED_VOICE_URL?.trim();
  const key = process.env.PAC_HOSTED_VOICE_KEY?.trim();
  const secret = process.env.PAC_HOSTED_VOICE_SECRET?.trim();
  if (!endpoint || !key || !secret) return null;
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".modal.run") || url.username || url.password || url.port || url.search || url.hash) return null;
    return { endpoint: url.toString(), key, secret };
  } catch { return null; }
}

export function hostedVoiceSelected() {
  return Boolean(process.env.PAC_HOSTED_VOICE_URL || process.env.PAC_HOSTED_VOICE_KEY || process.env.PAC_HOSTED_VOICE_SECRET);
}

/** Modal flushes SSE immediately; translate its JSON events to the existing browser protocol. */
export function voiceEventsToLines() {
  const decoder = new TextDecoder(); const encoder = new TextEncoder(); let pending = "";
  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      pending += decoder.decode(chunk, { stream: true });
      if (pending.length > 12_000_000) throw new Error("hosted_voice_packet_too_large");
      let boundary: number;
      while ((boundary = pending.indexOf("\n")) >= 0) {
        const line = pending.slice(0, boundary).replace(/\r$/, ""); pending = pending.slice(boundary + 1);
        if (line.startsWith("data:")) {
          const value = JSON.parse(line.slice(5).trim());
          controller.enqueue(encoder.encode(JSON.stringify(value) + "\n"));
        }
      }
    },
    flush() { if ((pending + decoder.decode()).trim()) throw new Error("hosted_voice_stream_incomplete"); },
  });
}

export async function requestHostedVoice(text: string, signal: AbortSignal): Promise<ReadableStream<Uint8Array>> {
  const configuration = hostedVoiceConfiguration();
  if (!configuration) throw new Error("hosted_voice_not_configured");
  const response = await fetch(configuration.endpoint, {
    method: "POST", redirect: "error", cache: "no-store",
    headers: { "content-type": "application/json", "Modal-Key": configuration.key, "Modal-Secret": configuration.secret },
    body: JSON.stringify({ text }), signal: AbortSignal.any([signal, AbortSignal.timeout(580_000)]),
  });
  if (!response.ok || !response.body || !response.headers.get("content-type")?.startsWith("text/event-stream")) {
    await response.body?.cancel();
    throw new Error("hosted_voice_unavailable");
  }
  return response.body.pipeThrough(voiceEventsToLines());
}
