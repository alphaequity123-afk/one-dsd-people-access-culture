"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Shows a video's captions in a plain panel under the picture instead of over it, so the words never cover the
 * film and stay a readable size however small the player is. The caption track still loads (it is set to
 * "hidden", which keeps its timing events) and the panel follows it. Turning captions off hides the panel;
 * choosing captions in the browser's own player menu is folded back into this panel so they never show twice.
 */
export function CaptionsBelow({ media, label }: { media: RefObject<HTMLVideoElement | null>; label: string }) {
  const [on, setOn] = useState(true);
  const [speaker, setSpeaker] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    const video = media.current;
    if (!video || !video.textTracks || typeof video.textTracks.addEventListener !== "function") return;
    let track: TextTrack | null = null;
    const update = () => {
      const cue = track?.activeCues?.[0] as VTTCue | undefined;
      if (!cue) { setText(""); return; }
      const raw = cue.text;
      const voice = /<v\s+([^>]+)>/.exec(raw)?.[1]?.trim() ?? "";
      setSpeaker(voice);
      setText(raw.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
    };
    const attach = () => {
      const next = video.textTracks[0] ?? null;
      if (next === track) { if (track && track.mode === "showing") { track.mode = "hidden"; setOn(true); } return; }
      track?.removeEventListener("cuechange", update);
      track = next;
      if (!track) return;
      track.mode = "hidden";
      track.addEventListener("cuechange", update);
    };
    attach();
    video.textTracks.addEventListener("addtrack", attach);
    video.textTracks.addEventListener("change", attach);
    return () => {
      video.textTracks.removeEventListener("addtrack", attach);
      video.textTracks.removeEventListener("change", attach);
      track?.removeEventListener("cuechange", update);
    };
  }, [media]);

  return (
    <div style={{ maxWidth: "960px" }}>
      <div
        aria-hidden="true"
        style={{
          display: on ? "block" : "none", minHeight: "4.6em", marginTop: "6px", padding: "10px 16px",
          background: "#ffffff", color: "#16212c", border: "1px solid #cfd7df", borderRadius: "8px",
          fontSize: "1.2rem", lineHeight: 1.45,
        }}
      >
        {text ? <>
          {speaker ? <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#3d4f60", letterSpacing: ".02em" }}>{speaker}</span> : null}
          <span>{text}</span>
        </> : null}
      </div>
      <button
        type="button"
        aria-pressed={on}
        aria-label={`${on ? "Hide" : "Show"} captions for ${label}`}
        onClick={() => setOn(value => !value)}
        style={{ marginTop: "6px", minHeight: "44px", padding: "6px 14px", borderRadius: "6px", border: "1px solid #6b7c8c", background: "#fff", color: "#16212c", fontSize: "1rem", cursor: "pointer" }}
      >
        {on ? "Hide captions" : "Show captions"}
      </button>
    </div>
  );
}
