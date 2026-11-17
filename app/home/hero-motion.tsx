"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function HeroMotion({ children, src }: { children: ReactNode; src: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (motion.matches) {
        video.current?.pause();
        setVisible(false);
        setPlaying(false);
        setEnded(false);
      }
      setEnabled(!motion.matches);
    };
    sync();
    motion.addEventListener("change", sync);
    return () => motion.removeEventListener("change", sync);
  }, []);

  function toggle() {
    const player = video.current;
    if (!player) return;
    if (!player.paused) player.pause();
    else { if (player.ended) player.currentTime = 0; setEnded(false); void player.play().catch(() => setPlaying(false)); }
  }

  return (
    <div className="home-hero-motion">
      <div className="home-hero-frame">
        {children}
        {enabled && !failed && (
          <video ref={video} className="home-hero-video" data-visible={visible}
            src={src} muted playsInline preload="none" aria-hidden="true"
            onPlaying={() => { setVisible(true); setPlaying(true); }}
            onPause={() => setPlaying(false)}
            onEnded={() => { setPlaying(false); setEnded(true); }}
            onError={() => { setVisible(false); setPlaying(false); setFailed(true); }}
          />
        )}
      </div>
      {enabled && !failed && (
        <button className="home-hero-motion-control" type="button"
          aria-label={playing ? "Pause animation" : ended ? "Replay animation" : "Play animation"} onClick={toggle}>
          {playing ? "Pause animation" : ended ? "Replay animation" : "Play animation"}
        </button>
      )}
    </div>
  );
}
