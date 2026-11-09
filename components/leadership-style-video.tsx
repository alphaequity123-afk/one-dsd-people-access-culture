"use client";

import { useEffect, useState } from "react";

export type LeadershipStyleSlug = "democratic" | "authoritarian" | "laissez-faire" | "servant" | "charismatic" | "transformative" | "transformational";

type VerifiedLeadershipVideo = {
  format: "leadership-video-v1";
  style: LeadershipStyleSlug;
  video: string;
  captions: string;
  transcript: string;
};

/** Accept only the public route's hash-addressed media paths for this style. */
function verifiedManifest(value: unknown, style: LeadershipStyleSlug): value is VerifiedLeadershipVideo {
  if (!value || typeof value !== "object") return false;
  const manifest = value as Record<string, unknown>;
  return manifest.format === "leadership-video-v1" && manifest.style === style
    && typeof manifest.video === "string" && /^\/learning\/leadership-videos\/[a-f0-9]{64}\.mp4$/.test(manifest.video)
    && typeof manifest.captions === "string" && /^\/learning\/leadership-videos\/[a-f0-9]{64}\.vtt$/.test(manifest.captions)
    && typeof manifest.transcript === "string" && /^\/learning\/leadership-videos\/[a-f0-9]{64}\.txt$/.test(manifest.transcript);
}

/** Missing or invalid manifests are deliberately silent: the lesson stays readable. */
export function LeadershipStyleVideo({ style, title }: { style: LeadershipStyleSlug; title: string }) {
  const [media, setMedia] = useState<VerifiedLeadershipVideo | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/learning/leadership-videos/${style}.json`, { cache: "no-store", signal: controller.signal });
        if (!response.ok || response.status === 204) return;
        const body: unknown = await response.json();
        if (active && verifiedManifest(body, style)) setMedia(body);
      } catch { /* The written lesson remains available when media is unavailable. */ }
    }
    void load();
    return () => { active = false; controller.abort(); };
  }, [style]);

  if (!media || media.style !== style) return null;
  return <div className="mt-4 space-y-3">
    <video controls playsInline preload="none" aria-label={`${title} video`} className="h-auto w-full">
      <source src={media.video} type="video/mp4" />
      <track kind="captions" src={media.captions} srcLang="en" label="English" default />
      Your browser cannot play this video. You can read the transcript instead.
    </video>
    <p><a className="underline" href={media.transcript}>Read the transcript</a></p>
  </div>;
}
