"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A recording married to its script. As the audio plays, the sentence being
 * spoken is highlighted and kept in view. Clicking a sentence moves the audio
 * to that point.
 */
export type ScriptLine = { start: number; end: number; text: string; p?: number };

export function SyncedAudio({ src, title, script }: { src: string; title: string; script: ScriptLine[] }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState(-1);
  const [follow, setFollow] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const pendingSeek = useRef<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const tick = () => {
      const t = audio.currentTime;
      let index = -1;
      for (let i = 0; i < script.length; i += 1) {
        if (t >= script[i].start - 0.15) index = i;
        else break;
      }
      setCurrent(index);
    };
    audio.addEventListener("timeupdate", tick);
    audio.addEventListener("seeked", tick);
    return () => {
      audio.removeEventListener("timeupdate", tick);
      audio.removeEventListener("seeked", tick);
    };
  }, [script]);

  useEffect(() => {
    if (!follow || current < 0) return;
    const el = transcriptRef.current?.querySelector<HTMLElement>(`[data-script-line="${current}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [current, follow]);

  const seekTo = (line: ScriptLine) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.readyState < 1) { pendingSeek.current = Math.max(0, line.start); audio.load(); }
    else audio.currentTime = Math.max(0, line.start);
    void audio.play().catch(() => setMessage("Use the player’s Play control to listen, or continue reading the transcript."));
  };

  const paragraphs: ScriptLine[][] = [];
  script.forEach((line, index) => {
    const p = line.p ?? Math.floor(index / 6);
    if (!paragraphs[p]) paragraphs[p] = [];
    paragraphs[p].push({ ...line, p: index });
  });

  return (
    <div data-synced-audio="true">
      <audio ref={audioRef} onLoadedMetadata={() => { if (audioRef.current && pendingSeek.current !== null) { audioRef.current.currentTime = pendingSeek.current; pendingSeek.current = null; } }} onError={() => setMessage("This recording could not be loaded. You can read its transcript below.")} controls preload="metadata" src={src} style={{ width: "100%" }} aria-label={title || "Read aloud"} />
      <p role="status">{message}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="text-sm"><input type="checkbox" checked={follow} onChange={(event) => setFollow(event.target.checked)} /> Follow along</label>
        <span className="text-sm text-muted">Select any sentence to hear it.</span>
      </div>
      <div ref={transcriptRef} className="mt-3" style={{ maxHeight: 420, overflowY: "auto", padding: "4px 8px", borderTop: "1px solid #d6dee6" }} aria-live="off">
        {paragraphs.map((lines, index) => (
          <p key={index} style={{ lineHeight: 1.7 }}>
            {lines.map((line) => {
              const active = line.p === current;
              return (
                <button
                  type="button"
                  key={line.p}
                  data-script-line={line.p}
                  onClick={() => seekTo(line)}
                  style={{
                    cursor: "pointer",
                    display: "inline", border: 0, color: "inherit", font: "inherit", textAlign: "left",
                    borderRadius: 4,
                    padding: "1px 2px",
                    background: active ? "#fff3c4" : "transparent",
                    boxShadow: active ? "0 0 0 2px #f2c94c" : "none",
                    fontWeight: active ? 600 : 400,
                    transition: "background 120ms",
                  }}
                >{line.text} </button>
              );
            })}
          </p>
        ))}
      </div>
    </div>
  );
}
