"use client";
import { SourceLink } from "@/components/app-link";
import { useState, type SyntheticEvent } from "react";

type Props = { className: string; src: string; poster: string; title: string; captions?: string; transcript?: string };

export default function SequenceVideo({ className, src, poster, title, captions, transcript }: Props) {
  const [error, setError] = useState("");
  function playOne(event: SyntheticEvent<HTMLVideoElement>) {
    const current = event.currentTarget;
    current.ownerDocument.querySelectorAll<HTMLMediaElement>("audio, video").forEach(media => {
      if (media !== current) media.pause();
    });
  }
  return <>
    <video data-equity-sequence className={className} controls playsInline preload="metadata" poster={poster} aria-label={`${title} video with captions`} onPlay={playOne} onError={() => setError("The video could not be loaded. Read its transcript below or try loading the page again.")}>
      <source src={src} type="video/mp4" />
      {captions ? <track kind="captions" src={captions} srcLang="en" label="English" /> : null}
      Your browser does not support video. {transcript ? <SourceLink href={transcript}>Read the transcript for {title}</SourceLink> : <SourceLink href={src}>Open {title}</SourceLink>}.
    </video>
    <p role="status" className="text-sm">{error}</p>
  </>;
}
