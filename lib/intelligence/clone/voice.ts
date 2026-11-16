import "server-only";
import { voiceWorkerReady } from "./voice-queue";
import { hostedVoiceConfiguration, hostedVoiceSelected } from "./hosted-voice";

/** Admit voice work before network work. Nothing is refused for volume, and nothing about the use is recorded. */
export function reserveVoice(_kind: "speech" | "transcribe", units: number): boolean {
  return units > 0;
}

export function voiceStatus() {
  return { transcription: Boolean(process.env.OPENAI_API_KEY?.trim()), speech: hostedVoiceSelected() ? Boolean(hostedVoiceConfiguration()) : voiceWorkerReady(), voice: "Approved program voice" };
}
