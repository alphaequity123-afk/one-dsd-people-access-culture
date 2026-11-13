"use client";

import { useEffect, useState, type ReactNode } from "react";

export function HeroMotion({ children }: { children: ReactNode }) {
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stopForReducedMotion = () => {
      if (preference.matches) setPlaying(false);
    };
    stopForReducedMotion();
    preference.addEventListener("change", stopForReducedMotion);
    return () => preference.removeEventListener("change", stopForReducedMotion);
  }, []);

  return (
    <div className="home-hero-motion" data-playing={playing}>
      <div className="home-hero-frame">{children}</div>
      <button className="home-hero-motion-control" type="button" aria-label={playing ? "Pause hero animation" : "Play hero animation"} onClick={() => setPlaying(current => !current)}>
        {playing ? "Pause" : "Play"}
      </button>
    </div>
  );
}
