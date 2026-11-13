"use client";
import { SourceLink } from "@/components/app-link";


import type { SyntheticEvent } from "react";

type Props = { className: string; src: string; poster: string; title: string };

export default function SequenceVideo({ className, src, poster, title }: Props) {
  function captionsInPicture(event: SyntheticEvent<HTMLVideoElement>) {
    // Captions are already visible in the video; avoid an automatic second set.
    Array.from(event.currentTarget.textTracks).forEach(track => { track.mode = "disabled"; });
  }
  function playOne(event: SyntheticEvent<HTMLVideoElement>) {
    const current = event.currentTarget;
    current.ownerDocument.querySelectorAll<HTMLMediaElement>("audio, video").forEach(media => {
      if (media !== current) media.pause();
    });
  }
  return <video data-equity-sequence className={className} controls playsInline preload="metadata" poster={poster} aria-label={`${title} video with captions`} onPlay={playOne} onLoadedMetadata={captionsInPicture}>
    <source src={src} type="video/mp4" />Your browser does not support video. <SourceLink href={src}>Open {title}</SourceLink>.
  </video>;
}
