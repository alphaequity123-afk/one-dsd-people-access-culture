"use client";
import { useEffect, useRef, useState } from "react";
/** Optional device speech. It is not presented as a recorded or approved narrator voice. */
export function LeadershipReadAloud({ text }: { text: string }) {
  const [available, setAvailable] = useState(false); const [state, setState] = useState("Stopped");
  const active = useRef(false); const remaining = useRef<string[]>([]); const generation = useRef(0);
  useEffect(() => { setAvailable("speechSynthesis" in window); return () => { active.current = false; generation.current++; if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }; }, []);
  function next(token: number) {
    if (token !== generation.current) return;
    const paragraph = remaining.current.shift();
    if (!paragraph || !active.current) { active.current = false; setState("Stopped"); return; }
    const utterance = new SpeechSynthesisUtterance(paragraph); utterance.lang = "en-US";
    utterance.onend = () => next(token); utterance.onerror = () => { if (token !== generation.current) return; active.current = false; setState("Reading unavailable. The full text is below."); };
    window.speechSynthesis.speak(utterance);
  }
  function play() {
    const token = ++generation.current;
    window.speechSynthesis.cancel(); document.querySelectorAll<HTMLMediaElement>("audio,video").forEach(media => media.pause()); active.current = true; remaining.current = text.split(/\n\n+/); setState("Reading"); next(token);
  }
  if (!available) return <p>The complete teaching is available as text below.</p>;
  return <div><p>Read the core teaching aloud using your device's voice. The text below is the same teaching.</p><div className="development-actions"><button type="button" onClick={play}>Read teaching aloud</button><button type="button" disabled={state !== "Reading" && state !== "Paused"} onClick={() => { if (state === "Paused") { window.speechSynthesis.resume(); setState("Reading"); } else { window.speechSynthesis.pause(); setState("Paused"); } }}>{state === "Paused" ? "Resume reading" : "Pause reading"}</button><button type="button" onClick={() => { active.current = false; generation.current++; remaining.current = []; window.speechSynthesis.cancel(); setState("Stopped"); }}>Stop reading</button></div><p role="status">{state}</p></div>;
}
