/** Client-only timing data: no question text, transcript, audio, or identity. */
export const VOICE_END_PAUSE_MS = 650;
export const VOICE_NO_SPEECH_MS = 12_000;
export const VOICE_MAX_RECORDING_MS = 30_000;
export const VOICE_TURN_MEASURE = "ask.voice.turn";

export type VoiceAvailability = { transcription: boolean; speech: boolean; paused: boolean };
export type VoiceHealth = "checking" | "ready" | "failed";
export function voiceAvailabilityNotice(health: VoiceHealth, available: VoiceAvailability): string {
  if (health === "checking") return "Checking whether you can speak and listen…";
  if (health === "failed") return "We could not confirm whether you can speak and listen right now. You can still type your question.";
  if (available.paused) return "Ask is paused for now. You can still browse resources.";
  if (!available.speech && !available.transcription) return "Speaking and listening are not available right now. You can type your question and read the answer.";
  if (!available.speech) return "Listening to the answer is not available right now. You can still speak or type your question.";
  if (!available.transcription) return "Speaking your question is not available right now. You can type it and still listen to the answer.";
  return "";
}

export type VoiceActivity = { beganAt: number; lastSpeechAt: number; heardSpeech: boolean };
export function observeVoiceActivity(activity: VoiceActivity, now: number, rms: number): VoiceActivity {
  return rms > 0.025 ? { ...activity, heardSpeech: true, lastSpeechAt: now } : activity;
}

export function voiceCaptureAction(activity: VoiceActivity, now: number, continuous: boolean): "continue" | "finish" | "no-speech" {
  if (!activity.heardSpeech && now - activity.beganAt >= VOICE_NO_SPEECH_MS) return "no-speech";
  if (now - activity.beganAt >= VOICE_MAX_RECORDING_MS) return "finish";
  if (continuous && activity.heardSpeech && now - activity.lastSpeechAt >= VOICE_END_PAUSE_MS) return "finish";
  return "continue";
}

export type VoiceTurnTiming = {
  lastSpeechAt: number;
  captureEndedAt: number;
  transcriptionStartedAt: number;
  transcriptionEndedAt?: number;
  askStartedAt?: number;
  askEndedAt?: number;
  speechStartedAt?: number;
  firstAudioAt?: number;
};

export function summarizeVoiceTurn(timing: VoiceTurnTiming) {
  if (timing.transcriptionEndedAt === undefined || timing.askStartedAt === undefined || timing.askEndedAt === undefined
    || timing.speechStartedAt === undefined || timing.firstAudioAt === undefined) return undefined;
  const elapsed = (start: number, end: number) => Math.max(0, Math.round(end - start));
  return {
    silenceMs: elapsed(timing.lastSpeechAt, timing.captureEndedAt),
    transcriptionMs: elapsed(timing.transcriptionStartedAt, timing.transcriptionEndedAt),
    askMs: elapsed(timing.askStartedAt, timing.askEndedAt),
    speechToFirstAudioMs: elapsed(timing.speechStartedAt, timing.firstAudioAt),
    endOfSpeechToFirstAudioMs: elapsed(timing.lastSpeechAt, timing.firstAudioAt),
  };
}

/** Keep only the latest completed turn in the in-memory browser Performance timeline. */
export function recordVoiceTurnTiming(timing: VoiceTurnTiming) {
  const detail = summarizeVoiceTurn(timing);
  if (!detail) return;
  try {
    performance.clearMeasures(VOICE_TURN_MEASURE);
    performance.measure(VOICE_TURN_MEASURE, { start: timing.lastSpeechAt, end: timing.firstAudioAt, detail });
  } catch { /* Optional measurement must never prevent voice playback. */ }
}
