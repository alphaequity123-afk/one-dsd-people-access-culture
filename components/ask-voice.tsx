"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { observeVoiceActivity, recordVoiceTurnTiming, voiceAvailabilityNotice, voiceCaptureAction, type VoiceActivity, type VoiceAvailability, type VoiceHealth, type VoiceTurnTiming } from "@/lib/voice/turn";

/** Each voice turn goes through the same Ask route as a typed question. */
export function AskVoice({ busy, onDictation, onQuestion, latestAnswer }: {
  busy: boolean; onDictation: (text: string) => void;
  onQuestion: (text: string) => Promise<string | undefined>; latestAnswer?: string;
}) {
  const [status, setStatus] = useState("Microphone off");
  const [recording, setRecording] = useState(false);
  const [live, setLive] = useState(false);
  const [working, setWorking] = useState(false);
  const [available, setAvailable] = useState<VoiceAvailability>({ transcription: false, speech: false, paused: false });
  const [health, setHealth] = useState<VoiceHealth>("checking");
  const [error, setError] = useState("");
  const generation = useRef(0);
  const liveRef = useRef(false);
  const capture = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const context = useRef<AudioContext | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const audioUrl = useRef<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const callbacks = useRef({ onDictation, onQuestion });
  // Keep asynchronous recorder callbacks current after each committed render.
  useLayoutEffect(() => { callbacks.current = { onDictation, onQuestion }; }, [onDictation, onQuestion]);

  function releaseMicrophone() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach(track => track.stop()); stream.current = null;
    void context.current?.close(); context.current = null;
  }
  function stop() {
    generation.current++; liveRef.current = false; setLive(false);
    abort.current?.abort(); abort.current = null;
    if (capture.current?.state === "recording") capture.current.stop();
    capture.current = null; releaseMicrophone();
    audio.current?.pause(); audio.current = null;
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current); audioUrl.current = null;
    setRecording(false); setWorking(false); setStatus("Microphone off");
  }
  useEffect(() => {
    let active = true;
    let revision = 0;
    let pending: AbortController | undefined;
    const refresh = async () => {
      const current = ++revision;
      pending?.abort();
      const controller = new AbortController(); pending = controller;
      const timeout = setTimeout(() => controller.abort(), 10_000);
      try {
        const response = await fetch("/api/ask/voice", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("voice_health_unavailable");
        const value = await response.json();
        if (typeof value?.transcription !== "boolean" || typeof value?.speech !== "boolean" || typeof value?.paused !== "boolean") throw new Error("voice_health_invalid");
        if (!active || current !== revision) return;
        setAvailable({ transcription: value.transcription, speech: value.speech, paused: value.paused });
        setHealth("ready");
        if (value.paused) stop();
      } catch {
        if (active && current === revision) {
          setAvailable({ transcription: false, speech: false, paused: false });
          setHealth("failed");
        }
      } finally { clearTimeout(timeout); }
    };
    void refresh(); const poll = setInterval(() => void refresh(), 15000);
    return () => { active = false; pending?.abort(); clearInterval(poll); stop(); };
    // Capture resources are held in refs and always released on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function speak(text: string, token: number, timing?: VoiceTurnTiming) {
    setStatus("Preparing the answer…");
    if (timing) timing.speechStartedAt = performance.now();
    const controller = new AbortController(); abort.current = controller;
    const response = await fetch("/api/ask/voice", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }), signal: controller.signal });
    if (!response.ok) throw new Error((await response.json()).error || "Listening is not available right now. The written answer is still here.");
    if (!response.body) throw new Error("There was no audio to play. The written answer is still here.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder(); let pending = ""; let finished = false;
    let playback: Promise<void> = Promise.resolve(); let playbackFailure: Error | null = null;
    const enqueue = (encoded: string) => {
      playback = playback.then(async () => {
        if (token !== generation.current || playbackFailure) return;
        const binary = atob(encoded); const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
        const url = URL.createObjectURL(new Blob([bytes], { type: "audio/wav" })); audioUrl.current = url;
        const player = new Audio(url); audio.current = player;
        setStatus("Playing the answer. You can interrupt at any time.");
        try {
          await new Promise<void>((resolve, reject) => {
            player.onplaying = () => {
              if (timing && timing.firstAudioAt === undefined && token === generation.current) {
                timing.firstAudioAt = performance.now();
                recordVoiceTurnTiming(timing);
              }
            };
            player.onended = () => resolve();
            player.onpause = () => resolve();
            player.onerror = () => reject(new Error("The audio could not play, but the written answer is still here."));
            void player.play().catch(() => reject(new Error("Your browser held back the audio. Select Listen to answer to hear it.")));
          });
        } finally { URL.revokeObjectURL(url); if (audioUrl.current === url) audioUrl.current = null; }
      }).catch(failure => { playbackFailure = failure instanceof Error ? failure : new Error("The answer could not be played."); controller.abort(); });
    };
    try {
      while (true) {
        const part = await reader.read(); if (part.done) break;
        if (token !== generation.current) { await reader.cancel(); return; }
        pending += decoder.decode(part.value, { stream: true });
        if (pending.length > 12_000_000) throw new Error("That answer is too long to read aloud. The written answer is still here.");
        let newline: number;
        while ((newline = pending.indexOf("\n")) >= 0) {
          const packet = JSON.parse(pending.slice(0, newline)); pending = pending.slice(newline + 1);
          if (packet.error) throw new Error(packet.error);
          if (packet.audio) enqueue(packet.audio);
          if (packet.done) finished = true;
        }
      }
      await playback;
      if (playbackFailure) throw playbackFailure;
      if (!finished && token === generation.current) throw new Error("The voice connection ended early, but the written answer is still here.");
    } catch (failure) { controller.abort(); audio.current?.pause(); throw playbackFailure ?? failure; }
  }

  async function start(continuous: boolean) {
    stop(); setError("");
    liveRef.current = continuous; setLive(continuous);
    const token = generation.current;
    await record(token);
  }
  async function record(token: number) {
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("This browser cannot record from the microphone, so please type your question.");
      setWorking(true); setStatus("Opening microphone…");
      const media = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      if (token !== generation.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media;
      const type = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find(item => MediaRecorder.isTypeSupported(item));
      const recorder = new MediaRecorder(media, type ? { mimeType: type } : undefined);
      capture.current = recorder;
      const chunks: Blob[] = [];
      // The recorder is started by an event, after microphone permission resolves, never during render.
      // eslint-disable-next-line react-hooks/purity
      const began = performance.now();
      let activity: VoiceActivity = { beganAt: began, lastSpeechAt: began, heardSpeech: false };
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => { stop(); setError("The recording did not work. Please try again or type your question."); };
      recorder.onstop = async () => {
        const ended = performance.now();
        releaseMicrophone(); setRecording(false);
        if (token !== generation.current) return;
        try {
          setStatus("Writing down what you said…");
          const timing: VoiceTurnTiming = { lastSpeechAt: activity.heardSpeech ? activity.lastSpeechAt : ended,
            captureEndedAt: ended, transcriptionStartedAt: performance.now() };
          const controller = new AbortController(); abort.current = controller;
          const response = await fetch("/api/ask/transcribe", { method: "POST", headers: { "content-type": recorder.mimeType },
            body: new Blob(chunks, { type: recorder.mimeType }), signal: controller.signal });
          const value = await response.json();
          timing.transcriptionEndedAt = performance.now();
          if (token !== generation.current) return;
          if (!response.ok) throw new Error(value.error || "We could not make out the recording. Please try again or type your question.");
          if (!value.text?.trim()) throw new Error("We did not catch any words. Please try again.");
          callbacks.current.onDictation(value.text);
          if (liveRef.current) {
            setStatus("Finding an answer…");
            timing.askStartedAt = performance.now();
            const answer = await callbacks.current.onQuestion(value.text);
            timing.askEndedAt = performance.now();
            if (token !== generation.current) return;
            if (!answer) throw new Error("Please read the written response before going on.");
            await speak(answer, token, timing);
            if (token === generation.current && liveRef.current) { await record(token); return; }
          }
          setWorking(false); setStatus("Microphone off. Your words are in the question box.");
        } catch (failure) {
          if (token !== generation.current) return;
          stop(); setError(failure instanceof Error ? failure.message : "The voice conversation stopped before it finished.");
        }
      };
      recorder.start(); setRecording(true); setStatus(liveRef.current
        ? "Listening — pause to send, or select Finish speaking (30 seconds maximum)"
        : "Listening — select Finish speaking when ready (30 seconds maximum)");
      const analyserContext = new AudioContext(); context.current = analyserContext;
      const analyser = analyserContext.createAnalyser(); analyser.fftSize = 512;
      analyserContext.createMediaStreamSource(media).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      timer.current = setInterval(() => {
        analyser.getByteTimeDomainData(samples);
        const rms = Math.sqrt(samples.reduce((sum, value) => sum + ((value - 128) / 128) ** 2, 0) / samples.length);
        const now = performance.now();
        activity = observeVoiceActivity(activity, now, rms);
        const action = voiceCaptureAction(activity, now, liveRef.current);
        if (action === "no-speech") { stop(); setError("We did not hear anything, so the microphone is off."); return; }
        if (action === "finish") {
          if (recorder.state === "recording") recorder.stop();
        }
      }, 100);
    } catch (failure) {
      if (token !== generation.current) return;
      stop(); setError(failure instanceof Error ? failure.message : "The microphone is not available.");
    }
  }

  const unavailable = health !== "ready" || available.paused;
  const availabilityNotice = voiceAvailabilityNotice(health, available);
  return <section className="mt-4 rounded-lg border p-4" aria-label="Voice conversation">
    <div className="flex flex-wrap gap-2">
      <button type="button" className="btn btn--light" disabled={unavailable || busy || working || !available.transcription} onClick={() => void start(false)}>Dictate question</button>
      <button type="button" className="btn btn--light" disabled={unavailable || busy || working || !available.transcription || !available.speech} onClick={() => void start(true)}>Talk with Ask</button>
      <button type="button" className="btn btn--light" disabled={unavailable || busy || working || !available.speech || !latestAnswer} onClick={async () => {
        stop(); setError(""); setWorking(true); const token = generation.current;
        try { await speak(latestAnswer!, token); if (token === generation.current) { setWorking(false); setStatus("Microphone off"); } }
        catch (failure) { if (token === generation.current) { stop(); setError(failure instanceof Error ? failure.message : "The answer could not be played."); } }
      }}>Listen to answer</button>
      {recording ? <button type="button" className="btn btn--primary" onClick={() => capture.current?.stop()}>Finish speaking</button> : null}
      {working || live ? <button type="button" className="btn btn--light" onClick={stop}>Stop and turn off the microphone</button> : null}
      {live && !recording && !busy ? <button type="button" className="btn btn--light" onClick={() => void start(true)}>Interrupt and speak</button> : null}
    </div>
    <p role="status" className="text-sm mt-2">{status}</p>
    {availabilityNotice ? <p role="status" className="text-sm mt-2">{availabilityNotice}</p> : null}
    <p className="text-sm text-muted">You can read each answer or listen to it. When you speak, your recording goes to an outside service that writes down your words. No audio is saved on this site. Please keep to general examples and leave out anything confidential.</p>
    {error ? <p role="alert" className="error">{error}</p> : null}
  </section>;
}
