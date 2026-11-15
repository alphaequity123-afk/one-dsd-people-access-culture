import "server-only";

import { hostedVoiceConfiguration, postToModal, voiceEventsToLines } from "./hosted-voice";

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

/** Only the private creation worker can ask for an approved host. Ask read-aloud has its own endpoint. */
export async function requestOverviewVoice(text: string, voice: OverviewVoice, signal: AbortSignal) {
  const configuration = overviewConfiguration();
  if (!configuration || !overviewVoiceAvailable(voice)) throw new Error("overview_voice_unavailable");
  const response = await postToModal(
    configuration.endpoint,
    { "Modal-Key": configuration.key, "Modal-Secret": configuration.secret },
    JSON.stringify({ text, voice }),
    AbortSignal.any([signal, AbortSignal.timeout(580_000)]),
  );
  if (!response?.ok || !response.body || !response.headers.get("content-type")?.startsWith("text/event-stream")) {
    await response?.body?.cancel();
    throw new Error("overview_voice_unavailable");
  }
  return response.body.pipeThrough(voiceEventsToLines());
}
