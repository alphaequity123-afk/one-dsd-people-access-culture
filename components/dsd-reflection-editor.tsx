"use client";
import { useState } from "react";
const KEY = "one-dsd-logic-model-reflection-v1";
const fields = [
  { key: "purpose", label: "What did you hope to change?", rows: 3 },
  { key: "action", label: "What did you or your team do?", rows: 3 },
  { key: "evidence", label: "What did you observe, and what supports that observation?", rows: 4 },
  { key: "limits", label: "What remains uncertain or needs another perspective?", rows: 3 },
  { key: "next", label: "What would you retain, revise, or explore next?", rows: 3 },
] as const;
type Notes = Record<(typeof fields)[number]["key"], string>;
const empty: Notes = { purpose: "", action: "", evidence: "", limits: "", next: "" };
function openNote(): { notes: Notes; status: string; unreadable: boolean } {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed) ||
        !fields.every(field => typeof (parsed as Record<string, unknown>)[field.key] === "string")) throw new Error("Invalid note");
      const notes = Object.fromEntries(fields.map(field => [field.key,
        typeof (parsed as Record<string, unknown>)[field.key] === "string" ? (parsed as Notes)[field.key] : "",
      ])) as Notes;
      return { notes, status: "Your saved note is open.", unreadable: false };
    }
    return { notes: { ...empty }, status: "Your note saves automatically.", unreadable: false };
  } catch { return { notes: { ...empty }, status: "Your saved note could not be opened. It has not been replaced. You can write and download a new copy; clear the saved note explicitly before saving a replacement.", unreadable: true }; }
}
export default function ReflectionEditor() {
  const [{ notes, status, unreadable }, setState] = useState(openNote);
  const [confirmClear, setConfirmClear] = useState(false);
  const [manualCopy, setManualCopy] = useState(false);
  const text = "One DSD — Practice reflection\n\n" + fields.map(field => `${field.label}\n${notes[field.key] || "—"}`).join("\n\n");
  function update(notes: Notes) {
    if (unreadable) {
      setState({ notes, status: "Your new note stays on this page. The unreadable saved note has not been replaced; download this copy before leaving.", unreadable: true });
      return;
    }
    let status = "Saved.";
    try {
      if (Object.values(notes).some(Boolean)) localStorage.setItem(KEY, JSON.stringify(notes));
      else { localStorage.removeItem(KEY); status = "Your note saves automatically."; }
    } catch { status = "This device could not save your change. Download a copy to keep your work."; }
    setState({ notes, status, unreadable: false });
  }
  function clearNote() {
    try {
      localStorage.removeItem(KEY);
      setState({ notes: { ...empty }, status: "Your note was cleared.", unreadable: false });
      setConfirmClear(false);
      setManualCopy(false);
    } catch {
      setState(current => ({ ...current, status: "This device could not clear your saved note. Your text is still here. Try again when saving is available." }));
    }
  }
  function download() {
    let url: string | undefined;
    let anchor: HTMLAnchorElement | undefined;
    try {
      url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
      anchor = document.createElement("a");
      anchor.href = url; anchor.download = "One-DHS-practice-reflection.txt";
      document.body.appendChild(anchor); anchor.click();
      setManualCopy(false);
      setState(current => ({ ...current, status: "Download requested. Check your downloads for the text file." }));
    } catch {
      setManualCopy(true);
      setState(current => ({ ...current, status: "The download could not start. Copy your complete note below to keep it." }));
    } finally {
      anchor?.remove();
      if (url) { const pending = url; window.setTimeout(() => URL.revokeObjectURL(pending), 1000); }
    }
  }
  return <div className="dsd-reflection-form">
    <p>Keep names and private client, case, health, or personnel information out of your reflection.</p>
    <p className="dsd-save-status" role="status" aria-live="polite">{status}</p>
    {fields.map(field => <div key={field.key}><label htmlFor={`reflection-${field.key}`}>{field.label}</label><textarea id={`reflection-${field.key}`} rows={field.rows} value={notes[field.key]} onChange={event => update({ ...notes, [field.key]: event.target.value })} /></div>)}
    <div className="dsd-form-actions"><button type="button" onClick={download}>Download your note</button><button type="button" onClick={() => setConfirmClear(true)}>Clear this note</button></div>
    {confirmClear ? <div role="group" aria-label="Confirm clearing your note"><p>Remove the saved note?</p><div className="dsd-form-actions"><button type="button" onClick={clearNote}>Yes, clear the note</button><button type="button" onClick={() => setConfirmClear(false)}>Keep my note</button></div></div> : null}
    {manualCopy ? <div><label htmlFor="reflection-copy">Copy your complete note</label><textarea id="reflection-copy" readOnly rows={12} value={text} onFocus={event => event.currentTarget.select()} /></div> : null}
  </div>;
}
