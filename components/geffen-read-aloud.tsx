"use client";

import { useEffect, useRef, useState } from "react";

export function speechText(markdown: string) {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^:::[^\n]*$/gm, "")
    .replace(/[#*_`>]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .trim();
}

function chunks(text: string) {
  const result: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/)) {
    if (current && current.length + word.length > 1200) {
      result.push(current);
      current = "";
    }
    current += (current ? " " : "") + word;
  }
  if (current) result.push(current);
  return result;
}

export function GeffenReadAloud({ text, label, recordingSrc }: { text: string; label: string; recordingSrc?: string }) {
  const [busy, setBusy] = useState(false);
  const [needsPlay, setNeedsPlay] = useState(false);
  const [status, setStatus] = useState("");
  const activeRequest = useRef<AbortController | null>(null);
  const player = useRef<HTMLAudioElement>(null);

  function stop(message = "") {
    if (!activeRequest.current) return;
    activeRequest.current.abort();
    activeRequest.current = null;
    player.current?.pause();
    setNeedsPlay(false);
    setBusy(false);
    setStatus(message);
  }

  useEffect(() => {
    const audio = player.current;
    const halt = () => stop();
    const otherMediaStarted = (event: Event) => {
      if (event.target instanceof HTMLMediaElement && event.target !== audio) stop();
    };
    window.addEventListener("geffen-read-start", halt);
    document.addEventListener("play", otherMediaStarted, true);
    return () => {
      window.removeEventListener("geffen-read-start", halt);
      document.removeEventListener("play", otherMediaStarted, true);
      activeRequest.current?.abort();
      activeRequest.current = null;
      audio?.pause();
    };
  }, []);

  async function read() {
    const audio = player.current;
    if (!audio || activeRequest.current) return;
    window.dispatchEvent(new Event("geffen-read-start"));
    document.querySelectorAll<HTMLMediaElement>("audio, video").forEach(media => {
      if (media !== audio) media.pause();
    });
    const controller = new AbortController();
    activeRequest.current = controller;
    setBusy(true);
    setStatus("Getting the audio ready.");

    async function playSource(src: string, player: HTMLAudioElement, onStart?: () => void) {
      if (controller.signal.aborted) return;
      let finish: (() => void) | undefined;
      try {
        await new Promise<void>((resolve, reject) => {
          finish = () => resolve();
          controller.signal.addEventListener("abort", finish, { once: true });
          player.onended = finish;
          player.onerror = () => reject(new Error("The audio could not play. Please try again."));
          player.onplaying = () => {
            if (controller.signal.aborted) return;
            onStart?.();
            setNeedsPlay(false);
            setStatus("Playing audio.");
          };
          player.src = src;
          void player.play().catch(error => {
            if (controller.signal.aborted) return;
            if (error instanceof DOMException && error.name === "NotAllowedError") {
              setNeedsPlay(true);
              setStatus("The audio is ready. Select Play.");
              return;
            }
            reject(new Error("The audio could not play. Please try again."));
          });
        });
      } finally {
        if (finish) controller.signal.removeEventListener("abort", finish);
        if ((!activeRequest.current || activeRequest.current === controller) && player.getAttribute("src") === src) {
          player.onended = null;
          player.onerror = null;
          player.onplaying = null;
          player.removeAttribute("src");
        }
      }
    }

    async function playChunk(encoded: string, player: HTMLAudioElement) {
      const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
      try {
        await playSource(url, player);
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    try {
      if (recordingSrc) {
        let started = false;
        try {
          await playSource(recordingSrc, audio, () => { started = true; });
          if (!controller.signal.aborted) setStatus("Audio finished.");
          return;
        } catch (error) {
          if (controller.signal.aborted) return;
          if (started) throw error;
          setStatus("Getting the audio ready.");
        }
      }
      for (const part of chunks(speechText(text))) {
        if (controller.signal.aborted) return;
        const response = await fetch("/api/ask/voice", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: part }),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error("Audio is unavailable right now.");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let pending = "";
        let completed = false;
        let receivedAudio = false;
        let playback = Promise.resolve();
        let playbackError: Error | undefined;

        try {
          while (true) {
            const block = await reader.read();
            if (block.done) break;
            pending += decoder.decode(block.value, { stream: true });
            if (pending.length > 12_000_000) throw new Error("The audio could not play. Please try again.");
            const lines = pending.split("\n");
            pending = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.trim()) continue;
              const packet = JSON.parse(line) as { audio?: string; done?: boolean; error?: string };
              if (packet.error) throw new Error("The audio stopped early. Please try again.");
              if (packet.done) completed = true;
              if (packet.audio) {
                const encoded = packet.audio;
                receivedAudio = true;
                playback = playback.then(() => playChunk(encoded, audio)).catch(error => {
                  playbackError = error instanceof Error ? error : new Error("The audio could not play.");
                  controller.abort();
                });
              }
            }
          }
          if (!completed || !receivedAudio) throw new Error("The audio stopped early. Please try again.");
          await playback;
        } catch (error) {
          throw playbackError ?? error;
        } finally {
          reader.releaseLock();
        }
        if (playbackError) throw playbackError;
      }
      if (!controller.signal.aborted) setStatus("Audio finished.");
    } catch (error) {
      if (activeRequest.current === controller) {
        setStatus(error instanceof Error && error.message.startsWith("The audio ") ? error.message : "Audio is unavailable right now.");
      }
    } finally {
      controller.abort();
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        audio.pause();
        setNeedsPlay(false);
        setBusy(false);
      }
    }
  }

  return <div className="wc-read-aloud flex flex-wrap items-center gap-2">
    <audio ref={player} controls preload="none" aria-label={`Read aloud: ${label}`} className="w-full" />
    <button type="button" onClick={() => busy ? stop("Audio stopped.") : void read()} aria-label={`${busy ? "Stop" : "Listen"}: ${label}`}>
      {busy ? "Stop" : "Listen"}
    </button>
    {needsPlay && <button type="button" onClick={() => {
      const request = activeRequest.current;
      void player.current?.play().catch(() => {
        if (activeRequest.current === request) stop("The audio could not play. Please try again.");
      });
    }}>Play</button>}
    <span role="status">{status}</span>
  </div>;
}
