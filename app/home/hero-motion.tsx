"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** The hero animation plays once for five seconds when the page opens, then holds on its last frame. */
const PLAY_SECONDS = 5;

/** One encoding of the same animation, and the widest display, in device pixels, it is meant for. */
export type HeroSource = { src: string; width: number };

/**
 * The smallest encoding that still covers the frame at the screen's pixel density, so a phone does
 * not download the 4K original. The widest source is the fallback for anything larger.
 */
export function chooseHeroSource(sources: readonly HeroSource[], frameWidth: number, pixelRatio: number) {
  const ordered = [...sources].sort((a, b) => a.width - b.width);
  const needed = Math.max(1, frameWidth) * (Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1);
  return (ordered.find(source => source.width >= needed) ?? ordered[ordered.length - 1]).src;
}

export function HeroMotion({ children, sources }: { children: ReactNode; sources: readonly HeroSource[] }) {
  const video = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (motion.matches) {
        video.current?.pause();
        setVisible(false);
      }
      setEnabled(!motion.matches);
    };
    sync();
    motion.addEventListener("change", sync);
    return () => motion.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    // Chosen once, when the page opens: the animation plays a single time, so a later resize does
    // not start a second download.
    const width = frame.current?.getBoundingClientRect().width || window.innerWidth;
    setSrc(chooseHeroSource(sources, width, window.devicePixelRatio));
  }, [sources]);

  useEffect(() => {
    const player = video.current;
    if (!enabled || !src || !player) return;
    void player.play().catch(() => setVisible(false));
  }, [enabled, src]);

  return (
    <div className="home-hero-motion">
      <div className="home-hero-frame" ref={frame}>
        {children}
        {enabled && src && !failed && (
          <video ref={video} className="home-hero-video" data-visible={visible}
            src={src} muted playsInline autoPlay preload="auto" aria-hidden="true"
            onPlaying={() => setVisible(true)}
            onTimeUpdate={(e) => { if (e.currentTarget.currentTime >= PLAY_SECONDS) e.currentTarget.pause(); }}
            onError={() => { setVisible(false); setFailed(true); }}
          />
        )}
      </div>
    </div>
  );
}
