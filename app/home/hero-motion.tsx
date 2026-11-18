"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** The hero animation plays once for five seconds when the page opens, then holds on its last frame. */
const PLAY_SECONDS = 5;

export function HeroMotion({ children, src }: { children: ReactNode; src: string }) {
  const video = useRef<HTMLVideoElement>(null);
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
    const player = video.current;
    if (!enabled || !player) return;
    void player.play().catch(() => setVisible(false));
  }, [enabled]);

  return (
    <div className="home-hero-motion">
      <div className="home-hero-frame">
        {children}
        {enabled && !failed && (
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
