"use client";
import { useState } from "react";

export function ProgramWorkSummary({ text }: { text: string }) {
  const [message, setMessage] = useState("");
  const [fallback, setFallback] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(text); setMessage("Working summary copied. Review what is appropriate to share before using it elsewhere."); }
    catch { setFallback(true); setMessage("Copy is unavailable. Your summary is shown below so you can select and copy it."); }
  }
  function download() {
    let url: string | undefined;
    try {
      url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
      const link = document.createElement("a"); link.href = url; link.download = "one-dhs-working-summary.txt"; link.click();
      setMessage("Working summary prepared for download. Check the saved file and share only with the appropriate people.");
    } catch { setFallback(true); setMessage("Download is unavailable. Your summary is shown below so you can save it manually."); }
    finally { if (url) setTimeout(() => URL.revokeObjectURL(url!), 1000); }
  }
  return <details className="mt-4"><summary className="cursor-pointer font-semibold">Prepare a summary for review or report-back</summary><p className="mt-3">Keep the question, recommendation, sources and reported next steps together. This file is a working summary; use existing agency channels for official decisions and records.</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" className="btn" onClick={() => setFallback(value=>!value)}>{fallback?"Hide working summary":"Read working summary"}</button><button type="button" className="btn" onClick={() => void copy()}>Copy working summary</button><button type="button" className="btn" onClick={download}>Download working summary</button></div><p role="status" className="mt-2">{message}</p>{fallback && <label className="mt-3 block">Working summary<textarea className="input mt-2 block w-full" value={text} readOnly rows={14}/></label>}</details>;
}
