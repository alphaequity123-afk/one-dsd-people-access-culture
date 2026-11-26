"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

export default function Listen({
  src,
  captions,
  title,
  children,
  available = true,
}: {
  src: string;
  captions: string;
  title: string;
  children: ReactNode;
  available?: boolean;
}) {
  const ref = useRef<HTMLTrackElement>(null);
  const region = useId();
  const [show, setShow] = useState(false);
  const [cue, setCue] = useState("");
  const [failed, setFailed] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  useEffect(() => {
    const track = ref.current?.track;
    if (!track) return;
    track.mode = "hidden";
    function update() {
      const cues = track?.activeCues;
      setCue(
        cues
          ? Array.from(cues, (cue) => {
              const text = (cue as VTTCue).text;
              const speaker = /^<v ([^>]+)>/.exec(text)?.[1];
              const words = (cue as VTTCue).getCueAsHTML().textContent ?? "";
              return speaker ? speaker + " — " + words : words;
            }).join(" ")
          : "",
      );
    }
    update();
    track.addEventListener("cuechange", update);
    return () => track.removeEventListener("cuechange", update);
  }, [captions]);
  return (
    <div className="lo-listen">
      {!available || audioFailed ? <p role="status">Audio is unavailable. You can read the complete transcript below.</p> : null}
      {available && !audioFailed && <>
      <audio
        controls
        preload="none"
        aria-label={title}
        src={src}
        onError={() => setAudioFailed(true)}
        onPlay={(event) => {
          const current = event.currentTarget;
          current
            .closest("main")
            ?.querySelectorAll<HTMLMediaElement>("audio,video")
            .forEach((other) => {
              if (other !== current && !other.paused) other.pause();
            });
        }}
      >
        <track
          ref={ref}
          kind="captions"
          srcLang="en"
          label="English"
          src={captions}
          onError={() => setFailed(true)}
        />
      </audio>
      <button
        type="button"
        className="lo-quiet"
        aria-controls={region}
        aria-pressed={show}
        onClick={() => setShow(!show)}
      >
        {show ? "Hide captions" : "Show captions"}
      </button>
      <div id={region} hidden={!show} className="lo-caption">
        {failed
          ? "Captions could not load. The transcript is available below."
          : cue || "Captions appear here during playback."}
      </div>
      </>}
      <details open={!available || audioFailed ? true : undefined}>
        <summary>Read the transcript</summary>
        {children}
      </details>
    </div>
  );
}
