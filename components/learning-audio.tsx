"use client";

import { useState } from "react";

export function LearningAudio({ src, title }: { src: string; title: string }) {
  const [unavailable, setUnavailable] = useState(false);
  return <>
    <audio
      controls
      preload="none"
      src={src}
      aria-label={title}
      style={{ width: "100%", maxWidth: "36rem" }}
      onError={() => setUnavailable(true)}
      onLoadedMetadata={() => setUnavailable(false)}
      onPlay={event => {
        document.querySelectorAll<HTMLMediaElement>("audio, video").forEach(media => {
          if (media !== event.currentTarget) media.pause();
        });
      }}
    />
    {unavailable ? <p role="status">This recording isn’t playing right now. You can read the words below or try again later.</p> : null}
  </>;
}
