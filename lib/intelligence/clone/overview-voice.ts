import "server-only";

import { hostedVoiceConfiguration, voiceEventsToLines } from "./hosted-voice";

export type OverviewVoice = "geffen" | "host1" | "host2";

function overviewConfiguration() {
  const hosted = hostedVoiceConfiguration();
  const configured = process.env.PAC_OVERVIEW_VOICE_URL?.trim();
  if (!hosted || !configured) return null;
  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".modal.run") ||
      url.port || url.username || url.password || url.search || url.hash) return null;
    return { endpoint: url, key: hosted.key, secret: hosted.secret };
  } catch {
    return null;
  }
}

export function overviewVoiceAvailable(voice: OverviewVoice) {
  return (voice === "geffen" || voice === "host1" || voice === "host2") && !!overviewConfiguration();
}

function continuationEndpoint(endpoint: URL, location: string | null) {
  if (!location || location.length > 2048 || !/^[!-~]+$/.test(location) || location.includes("\\") || location.includes("#")) return null;
  try {
    const next = new URL(location, endpoint);
    // Modal documents one opaque result parameter on the original web endpoint.
    if (next.origin !== endpoint.origin || next.pathname !== endpoint.pathname || next.username || next.password ||
      !/^\?[A-Za-z0-9_-]{1,64}=[A-Za-z0-9._~-]{1,1024}$/.test(next.search)) return null;
    return next;
  } catch {
    return null;
  }
}

/** Only the private creation worker can ask for an approved host. Ask read-aloud has its own endpoint. */
export async function requestOverviewVoice(text: string, voice: OverviewVoice, signal: AbortSignal) {
  const configuration = overviewConfiguration();
  if (!configuration || !overviewVoiceAvailable(voice)) throw new Error("overview_voice_unavailable");
  const credentials = { "Modal-Key": configuration.key, "Modal-Secret": configuration.secret };
  const request = {
    cache: "no-store", redirect: "manual", signal: AbortSignal.any([signal, AbortSignal.timeout(580_000)]),
  } satisfies RequestInit;
  let response = await fetch(configuration.endpoint, {
    ...request, method: "POST", headers: { ...credentials, "content-type": "application/json" },
    body: JSON.stringify({ text, voice }),
  });
  for (let followed = 0; response.status === 303; followed++) {
    const next = followed < 3 ? continuationEndpoint(configuration.endpoint, response.headers.get("location")) : null;
    await response.body?.cancel();
    if (!next) throw new Error("overview_voice_unavailable");
    request.signal.throwIfAborted();
    response = await fetch(next, { ...request, method: "GET", headers: credentials });
  }
  if (!response.ok || !response.body || !response.headers.get("content-type")?.startsWith("text/event-stream")) {
    await response.body?.cancel();
    throw new Error("overview_voice_unavailable");
  }
  return response.body.pipeThrough(voiceEventsToLines());
}
