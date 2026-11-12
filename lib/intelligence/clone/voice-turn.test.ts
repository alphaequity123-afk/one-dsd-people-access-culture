import { afterEach, describe, expect, it, vi } from "vitest";
import { observeVoiceActivity, recordVoiceTurnTiming, summarizeVoiceTurn, voiceAvailabilityNotice, voiceCaptureAction, VOICE_TURN_MEASURE, type VoiceActivity, type VoiceTurnTiming } from "@/lib/voice/turn";
afterEach(() => vi.unstubAllGlobals());

describe("voice turn endpoint", () => {
  const initial: VoiceActivity = { beganAt: 0, lastSpeechAt: 0, heardSpeech: false };
  it("waits through short pauses and resets the quiet interval when speech resumes", () => {
    let activity = observeVoiceActivity(initial, 1000, 0.04);
    expect(voiceCaptureAction(activity, 1600, true)).toBe("continue");
    activity = observeVoiceActivity(activity, 1600, 0.04);
    expect(voiceCaptureAction(activity, 2599, true)).toBe("continue");
    expect(voiceCaptureAction(activity, 2600, true)).toBe("finish");
  });
  it("does not treat low noise or initial silence as a completed question", () => {
    const activity = observeVoiceActivity(initial, 1000, 0.01);
    expect(activity.heardSpeech).toBe(false);
    expect(voiceCaptureAction(activity, 11_999, true)).toBe("continue");
    expect(voiceCaptureAction(activity, 12_000, true)).toBe("no-speech");
  });
  it("leaves dictation under manual control and retains the recording limit", () => {
    const activity = observeVoiceActivity(initial, 1000, 0.04);
    expect(voiceCaptureAction(activity, 2000, false)).toBe("continue");
    expect(voiceCaptureAction(activity, 30_000, false)).toBe("finish");
    const talking = observeVoiceActivity(activity, 29_999, 0.04);
    expect(voiceCaptureAction(talking, 30_000, true)).toBe("finish");
  });
});

describe("voice availability explanations", () => {
  it("gives owner pause precedence over connected voice services", () => {
    expect(voiceAvailabilityNotice("ready", { transcription: true, speech: true, paused: true })).toContain("Ask is paused for now");
  });
  it("distinguishes unavailable voice, unavailable input, and failed status checks", () => {
    expect(voiceAvailabilityNotice("ready", { transcription: true, speech: false, paused: false })).toContain("still speak or type");
    expect(voiceAvailabilityNotice("ready", { transcription: false, speech: true, paused: false })).toContain("type it and still listen");
    expect(voiceAvailabilityNotice("ready", { transcription: false, speech: false, paused: false })).toContain("Speaking and listening are not available");
    expect(voiceAvailabilityNotice("failed", { transcription: true, speech: true, paused: false })).toContain("could not confirm");
    expect(voiceAvailabilityNotice("ready", { transcription: true, speech: true, paused: false })).toBe("");
  });
});

describe("conversation turnaround measurement", () => {
  const complete: VoiceTurnTiming = { lastSpeechAt: 1000, captureEndedAt: 1700, transcriptionStartedAt: 1710,
    transcriptionEndedAt: 2410, askStartedAt: 2420, askEndedAt: 8420, speechStartedAt: 8430, firstAudioAt: 10430 };
  it("separates silence, transcription, ASK and first playback instead of reporting TTS as the whole turn", () => {
    expect(summarizeVoiceTurn(complete)).toEqual({ silenceMs: 700, transcriptionMs: 700, askMs: 6000,
      speechToFirstAudioMs: 2000, endOfSpeechToFirstAudioMs: 9430 });
    expect(summarizeVoiceTurn({ ...complete, firstAudioAt: undefined })).toBeUndefined();
  });
  it("keeps only the latest numeric measurement and tolerates unsupported timing APIs", () => {
    const measure = vi.fn(); const clearMeasures = vi.fn();
    vi.stubGlobal("performance", { clearMeasures, measure });
    recordVoiceTurnTiming(complete);
    expect(clearMeasures).toHaveBeenCalledWith(VOICE_TURN_MEASURE);
    expect(measure).toHaveBeenCalledWith(VOICE_TURN_MEASURE, { start: 1000, end: 10430, detail: summarizeVoiceTurn(complete) });
    expect(Object.values(measure.mock.calls[0][1].detail).every(value => typeof value === "number")).toBe(true);
    measure.mockImplementation(() => { throw new Error("unsupported"); });
    expect(() => recordVoiceTurnTiming(complete)).not.toThrow();
  });
});
