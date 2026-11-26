"use client";

import { useState } from "react";

const FORMATS = [["docx", "Word"], ["xlsx", "Excel"], ["pptx", "PowerPoint"], ["pdf", "PDF"]] as const;

/**
 * Small Word, Excel, PowerPoint and PDF buttons for one page, plus ways to share its link.
 * The files are made from the page's published wording; nothing personal is attached or recorded.
 */
export function ResourceDownloads({ slug, title, noun = "course", download, share }: {
  slug: string; title: string; noun?: string;
  /** Download address without the format, when the page is not a /r/ page (for example a training version). */
  download?: string;
  /** Page path to share instead of /r/<slug>. */
  share?: string;
}) {
  const base = download ?? `/api/downloads/r/${encodeURIComponent(slug)}`;
  const [message, setMessage] = useState("");
  const link = () => new URL(share ?? `/r/${slug}`, window.location.origin).toString();
  const copy = async () => {
    try { await navigator.clipboard.writeText(link()); setMessage(`Link copied. It opens this ${noun}.`); }
    catch { setMessage(link()); }
  };
  const email = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`I thought you might find this useful:\n\n${title}\n${link()}`)}`;
  };
  return <div className="downloads" role="group" aria-label={`Download or share this ${noun}`}>
    <span className="downloads-label">Download:</span>
    {FORMATS.map(([format, label]) => <a key={format} className="chip-button" href={`${base}${base.includes("?") ? "&" : "?"}format=${format}`} download aria-label={`Download ${title} as ${label}`}>{label}</a>)}
    <span className="downloads-label">Share:</span>
    <button type="button" className="chip-button" onClick={() => void copy()}>Copy link</button>
    <button type="button" className="chip-button" onClick={email}>Email link</button>
    {message ? <span role="status" className="meta" style={{ wordBreak: "break-all" }}>{message}</span> : null}
  </div>;
}
