"use client";
import { useEffect, useState } from "react";
type Line = { start: number; end: number; text: string };
function stamp(seconds: number) {
  const ms = Math.round(seconds * 1000);
  return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor(ms / 60000) % 60).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}.${String(ms % 1000).padStart(3, "0")}`;
}
export function captionsFromScript(script: Line[]) {
  if (!script.length || script.some((line, i) => !Number.isFinite(line.start) || !Number.isFinite(line.end) || line.start < 0 || line.end <= line.start || (i > 0 && line.start < script[i - 1].start) || !line.text.trim())) return null;
  return "WEBVTT\n\n" + script.map(line => `${stamp(line.start)} --> ${stamp(line.end)}\n${line.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n\s*\n/g, "\n")}\n`).join("\n");
}
export function ResourceVideo({ src, title, script }: { src: string; title: string; script: Line[] }) {
  const [captions, setCaptions] = useState<string>();
  const [message, setMessage] = useState("");
  useEffect(() => {
    const text = captionsFromScript(script);
    if (!text) return;
    const url = URL.createObjectURL(new Blob([text], { type: "text/vtt" }));
    // The URL belongs to this mounted recording and is released when it changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCaptions(url);
    return () => { URL.revokeObjectURL(url); setCaptions(undefined); };
  }, [script]);
  return <><video controls preload="none" src={src} style={{ width: "100%", borderRadius: 12, background: "#000" }} aria-label={title} onError={() => setMessage("This video could not be loaded. If available, read its transcript below.")}>
    {captions ? <track kind="captions" src={captions} srcLang="en" label="English" /> : null}
  </video><p role="status">{message}</p></>;
}
