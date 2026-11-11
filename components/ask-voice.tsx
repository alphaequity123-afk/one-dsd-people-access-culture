"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CloseIcon, MicIcon, SpeakerIcon, StopIcon, WaveIcon } from "@/components/ask-icons";
import { observeVoiceActivity, recordVoiceTurnTiming, voiceAvailabilityNotice, voiceCaptureAction, type VoiceActivity, type VoiceAvailability, type VoiceHealth, type VoiceTurnTiming } from "@/lib/voice/turn";

/** The microphone for this site, as the browser reports it. */
type MicState = "unknown" | "granted" | "prompt" | "denied";

/** What happens to speech, shown in the small print under the Ask window. */
export const VOICE_PRIVACY_NOTE = "When you speak, your browser or an outside service writes down your words. No audio is saved on this site.";

/** The browser's own speech recognition, where it has one. Words arrive while the person is still speaking. */
type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: { results: ArrayLike<{ isFinal: boolean; [n: number]: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null; onerror: ((event: { error: string }) => void) | null;
  start(): void; stop(): void; abort(): void;
};
function recognitionConstructor() {
  const browser = window as typeof window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}

/**
 * The voice controls of the Ask window, shown as small icons; each keeps its name as hidden text and a tooltip.
 * Each voice turn goes through the same Ask route as a typed question.
 * mode "dictate" offers dictation only (the landing page). `listenSlot` is the element under the latest
 * answer where the read-aloud control appears (null while there is none); when it is not passed at all the
 * control sits in the icon row. `busyLabel` is shown while a typed question is being answered.
 */
export function AskVoice({ busy, onDictation, onQuestion, latestAnswer, mode = "full", busyLabel, listenSlot }: {
  busy: boolean; onDictation: (text: string) => void;
  onQuestion: (text: string) => Promise<string | undefined>; latestAnswer?: string;
  mode?: "full" | "dictate"; busyLabel?: string; listenSlot?: HTMLElement | null;
}) {
  const [status, setStatus] = useState("Microphone off");
  const [recording, setRecording] = useState(false);
  const [live, setLive] = useState(false);
  const [working, setWorking] = useState(false);
  const [reading, setReading] = useState(false);
  // The microphone for this site: unknown until read, granted, not yet asked (prompt), or blocked (denied).
  const [mic, setMic] = useState<MicState>("unknown");
  const [available, setAvailable] = useState<VoiceAvailability>({ transcription: false, speech: false, paused: false });
  const [health, setHealth] = useState<VoiceHealth>("checking");
  const [error, setError] = useState("");
  // What this browser can do by itself: write down speech as it is spoken, and read text aloud.
  const [browserVoice, setBrowserVoice] = useState({ transcription: false, speech: false });
  const recognition = useRef<Recognition | null>(null);
  const recognitionLimit = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishBrowserSpeech = useRef<(() => void) | null>(null);
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
    if (recognitionLimit.current) clearTimeout(recognitionLimit.current); recognitionLimit.current = null;
    const recognizer = recognition.current; recognition.current = null;
    if (recognizer) { recognizer.onend = null; recognizer.onresult = null; recognizer.onerror = null; recognizer.abort(); }
    window.speechSynthesis?.cancel(); finishBrowserSpeech.current?.(); finishBrowserSpeech.current = null;
    abort.current?.abort(); abort.current = null;
    if (capture.current?.state === "recording") capture.current.stop();
    capture.current = null; releaseMicrophone();
    audio.current?.pause(); audio.current = null;
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current); audioUrl.current = null;
    setRecording(false); setWorking(false); setReading(false); setStatus("Microphone off");
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
        setBrowserVoice({ transcription: Boolean(recognitionConstructor()), speech: Boolean(window.speechSynthesis && typeof SpeechSynthesisUtterance !== "undefined") });
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
    // The landing page checks once; the Ask page keeps checking while it is open.
    void refresh(); const poll = mode === "dictate" ? undefined : setInterval(() => void refresh(), 15000);
    return () => { active = false; pending?.abort(); if (poll) clearInterval(poll); stop(); };
    // Capture resources are held in refs and always released on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Read the microphone setting the browser already has for this site, and follow changes to it.
  useEffect(() => {
    const holder: { status: PermissionStatus | null } = { status: null };
    let alive = true;
    navigator.permissions?.query({ name: "microphone" as PermissionName }).then(result => {
      if (!alive) return;
      holder.status = result;
      setMic(result.state);
      result.onchange = () => { if (alive) setMic(result.state); };
    }).catch(() => { if (alive) setMic("unknown"); });
    return () => { alive = false; if (holder.status) holder.status.onchange = null; };
  }, []);

  /** Ask the browser for the microphone. Called from a press, so the browser can show its own Allow prompt. */
  async function allowMicrophone(): Promise<boolean> {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser cannot use the microphone. You can type your question.");
      return false;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      media.getTracks().forEach(track => track.stop());
      setMic("granted"); setError("");
      return true;
    } catch (failure) {
      const name = failure instanceof DOMException ? failure.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setMic("denied");
      } else {
        setMic("prompt");
        setError("The microphone could not be opened. Check that one is connected, then select Allow microphone again.");
      }
      return false;
    }
  }

  async function speak(text: string, token: number, timing?: VoiceTurnTiming) {
    // The program voice reads the answer when it is connected; otherwise the browser's own voice does.
    if (!available.speech && browserVoice.speech) {
      if (text.length > 10000) throw new Error("That answer is too long to read aloud. The written answer is still here.");
      for (const chunk of text.match(/[\s\S]{1,220}(?:\s|$)|\S{1,220}/g) ?? []) {
        if (token !== generation.current) return;
        setStatus("Reading the answer. You can stop or interrupt at any time.");
        await new Promise<void>((resolve, reject) => {
          const utterance = new SpeechSynthesisUtterance(chunk); utterance.lang = "en-US";
          const timeout = setTimeout(() => { window.speechSynthesis.cancel(); reject(new Error("Reading aloud stopped responding. The written answer is still here.")); }, 45000);
          const finish = () => { clearTimeout(timeout); finishBrowserSpeech.current = null; resolve(); };
          finishBrowserSpeech.current = finish;
          utterance.onend = finish;
          utterance.onerror = () => { clearTimeout(timeout); finishBrowserSpeech.current = null; if (token === generation.current) reject(new Error("This browser could not read the answer aloud. The written answer is still here.")); else resolve(); };
          window.speechSynthesis.speak(utterance);
        });
      }
      return;
    }
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
    // Ask for the microphone from this press when it is not allowed yet, so the browser's prompt appears where the person can answer it.
    if (mic !== "granted" && !(await allowMicrophone())) { liveRef.current = false; setLive(false); return; }
    if (token !== generation.current) return;
    await record(token);
  }
  async function record(token: number) {
    try {
      const Constructor = recognitionConstructor();
      if (Constructor) {
        // The browser writes the words down while the person speaks, so they appear in the box as they are said.
        const recognizer = new Constructor(); recognition.current = recognizer;
        let finished = ""; let heard = "";
        recognizer.lang = "en-US"; recognizer.continuous = false; recognizer.interimResults = true;
        recognizer.onresult = event => {
          const parts = Array.from(event.results);
          finished = parts.filter(part => part.isFinal).map(part => part[0].transcript).join(" ").trim();
          heard = parts.map(part => part[0].transcript).join(" ").trim().slice(0, 4000);
          if (heard && token === generation.current) callbacks.current.onDictation(heard);
        };
        recognizer.onerror = event => {
          if (token !== generation.current) return;
          stop(); setError(event.error === "not-allowed" ? "Microphone permission was declined. You can type your question." : event.error === "no-speech" ? "Nothing was heard, so the microphone is off." : "Listening did not finish. Please try again or type your question.");
        };
        recognizer.onend = async () => {
          if (recognitionLimit.current) clearTimeout(recognitionLimit.current); recognitionLimit.current = null;
          if (token !== generation.current) return;
          recognition.current = null; setRecording(false);
          const text = (finished || heard).slice(0, 4000);
          try {
            if (!text) throw new Error("No words were caught. Please try again.");
            callbacks.current.onDictation(text);
            if (liveRef.current) {
              setStatus("Finding an answer…");
              const answer = await callbacks.current.onQuestion(text);
              if (token !== generation.current) return;
              if (!answer) throw new Error("Please read the written response before going on.");
              await speak(answer, token);
              if (token === generation.current && liveRef.current) { await record(token); return; }
            }
            setWorking(false); setStatus("Microphone off. Your words are in the question box.");
          } catch (failure) {
            if (token === generation.current) { stop(); setError(failure instanceof Error ? failure.message : "The voice conversation stopped before it finished."); }
          }
        };
        setWorking(true); setRecording(true); setStatus(liveRef.current
          ? "Listening. Your words appear as you speak; pause to send (30 seconds maximum)"
          : "Listening. Your words appear as you speak; pause when you finish (30 seconds maximum)");
        recognizer.start();
        recognitionLimit.current = setTimeout(() => {
          if (token === generation.current) { stop(); setError("The listening time limit was reached. Please try a shorter question."); }
        }, 30000);
        return;
      }
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

  async function listen() {
    if (!latestAnswer) return;
    stop(); setError(""); setWorking(true); setReading(true); const token = generation.current;
    try { await speak(latestAnswer, token); if (token === generation.current) { setWorking(false); setReading(false); setStatus("Microphone off"); } }
    catch (failure) { if (token === generation.current) { stop(); setError(failure instanceof Error ? failure.message : "The answer could not be played."); } }
  }

  const unavailable = health !== "ready" || available.paused;
  // What can be used right now: the connected services, or this browser's own speech.
  const usable = { ...available, transcription: available.transcription || browserVoice.transcription, speech: available.speech || browserVoice.speech };
  const dictateOnly = mode === "dictate";
  const voiceActive = recording || working || live;
  // The landing page simply leaves the microphone out when dictation cannot work; the Ask page says why.
  const availabilityNotice = dictateOnly || health === "checking" ? "" : voiceAvailabilityNotice(health, usable);
  const shownStatus = voiceActive ? status : busy && busyLabel ? busyLabel : "";
  const dictate = dictateOnly && (unavailable || !usable.transcription) ? null
    : <button type="button" className="ask-icon" title="Dictate question" disabled={unavailable || busy || working || !usable.transcription} onClick={() => void start(false)}><MicIcon /><span className="sr-only">Dictate question</span></button>;
  const listenControl = dictateOnly || !latestAnswer ? null : reading
    ? <button type="button" className="ask-icon ask-icon--on" title="Stop reading aloud" onClick={stop}><StopIcon /><span className="sr-only">Stop reading aloud</span></button>
    : <button type="button" className="ask-icon" title="Listen to answer" disabled={unavailable || busy || working || !usable.speech} onClick={() => void listen()}><SpeakerIcon /><span className="sr-only">Listen to answer</span></button>;
  return <>
    <p role="status" className={shownStatus ? "ask-voice-status" : "sr-only"}>{shownStatus || status}</p>
    <div className="ask-voice-icons" role="group" aria-label={dictateOnly ? "Dictation" : "Voice conversation"}>
      {voiceActive ? null : dictate}
      {voiceActive || dictateOnly ? null : <button type="button" className="ask-icon" title="Talk with Ask" disabled={unavailable || busy || working || !usable.transcription || !usable.speech} onClick={() => void start(true)}><WaveIcon /><span className="sr-only">Talk with Ask</span></button>}
      {recording ? <button type="button" className="ask-icon ask-icon--on" title="Finish speaking" onClick={() => { if (recognition.current) recognition.current.stop(); else capture.current?.stop(); }}><StopIcon /><span className="sr-only">Finish speaking</span></button> : null}
      {live && !recording && !busy ? <button type="button" className="ask-icon" title="Interrupt and speak" onClick={() => void start(true)}><MicIcon /><span className="sr-only">Interrupt and speak</span></button> : null}
      {working || live ? <button type="button" className="ask-icon" title="Stop and turn off the microphone" onClick={stop}><CloseIcon /><span className="sr-only">Stop and turn off the microphone</span></button> : null}
      {listenSlot === undefined ? listenControl : null}
    </div>
    {availabilityNotice ? <p role="status" className="ask-voice-note">{availabilityNotice}</p> : null}
    {mic !== "granted" && usable.transcription && !recording && !working ? <div className="ask-voice-allow-row">
      <p className="ask-voice-note">{mic === "denied"
        ? "Microphone access is not allowed for this site. Turn it on in your browser's site settings for this page, then select Allow microphone."
        : "Ask needs your microphone to hear you. Select Allow microphone, then choose Allow when your browser asks."}</p>
      <button type="button" className="ask-voice-allow" disabled={busy} onClick={() => void allowMicrophone()}>Allow microphone</button>
    </div> : null}
    {error ? <p role="alert" className="ask-voice-note error">{error}</p> : null}
    {listenSlot && listenControl ? createPortal(listenControl, listenSlot) : null}
  </>;
}
