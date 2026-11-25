import "server-only";
import { voiceWorkerReady } from "./voice-queue";
import { recordVoiceUse } from "./ledger";
import { hostedVoiceConfiguration, hostedVoiceSelected } from "./hosted-voice";

/** Record voice use before network work. Nothing is refused for volume. */
export function reserveVoice(kind: "speech" | "transcribe", units: number, now = new Date()): Promise<boolean> {
  // Listening and speaking carry no site-wide allowance. Use is still recorded as counts.
  return recordVoiceUse(kind, units, now);
}

export function voiceStatus() {
  return { transcription: Boolean(process.env.OPENAI_API_KEY?.trim()), speech: hostedVoiceSelected() ? Boolean(hostedVoiceConfiguration()) : voiceWorkerReady(), voice: "Approved program voice" };
}
