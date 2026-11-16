"use client";
import { useRef, useState } from "react";
import { emptyCrosswalk, emptyRequirement, readRequirementsCrosswalk, requirementsSummary, REQUIREMENT_FIELDS, REQUIREMENT_STATUSES, type RequirementEntry, type RequirementsCrosswalk } from "@/lib/content/requirements-crosswalk";

export function RequirementsCrosswalkWorksheet() {
  const [work, setWork] = useState<RequirementsCrosswalk>(emptyCrosswalk);
  const [notice, setNotice] = useState("");
  const [fallback, setFallback] = useState<"text" | "json" | null>(null);
  const [pending, setPending] = useState<RequirementsCrosswalk | null>(null);
  const entryRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const text = requirementsSummary(work);
  function update(id: string, changes: Partial<RequirementEntry>) { setWork(current => ({ ...current, entries: current.entries.map(entry => entry.id === id ? { ...entry, ...changes } : entry) })); }
  function add() {
    if (work.entries.length >= 20) return;
    let number = work.entries.length + 1;
    while (work.entries.some(entry => entry.id === `R${number}`)) number++;
    const id = `R${number}`;
    setWork(current => ({ ...current, entries: [...current.entries, emptyRequirement(id)] }));
    setNotice("A new requirement entry is ready.");
    requestAnimationFrame(() => entryRefs.current[id]?.focus());
  }
  async function openFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 600_000) throw new Error("This working file is too large.");
      const candidate = readRequirementsCrosswalk(await file.text());
      setPending(candidate); setNotice("The file is ready to open. Keep a copy of your current notes before replacing them.");
    } catch (error) { setPending(null); setNotice(error instanceof Error ? error.message : "The file could not be opened. Your current notes are unchanged."); }
  }
  function download(kind: "text" | "json") {
    let url: string | undefined;
    try {
      url = URL.createObjectURL(new Blob([kind === "text" ? text : JSON.stringify(work, null, 2)], { type: kind === "text" ? "text/plain;charset=utf-8" : "application/json" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = kind === "text" ? "one-dhs-requirements-review.txt" : "one-dhs-requirements-working-file.json"; document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setNotice(kind === "text" ? "Your review summary is ready to download. Check the saved file before sharing." : "Your editable working file is ready to download. Open it here later to continue."); setFallback(null);
    } catch { setFallback(kind); setNotice("The download could not start. Your complete file is shown below to copy and save manually."); }
    finally { if (url) { const created = url; setTimeout(() => URL.revokeObjectURL(created), 1000); } }
  }
  return <section className="space-y-6" aria-labelledby="requirements-working-title">
    <h2 id="requirements-working-title" className="text-2xl font-semibold">Connect each requirement with its evidence</h2>
    <p id="requirements-privacy" className="notice">Download a working file before leaving or reloading. Use general descriptions, roles and references; keep confidential case, health and personnel information in approved systems.</p>
    <details><summary className="cursor-pointer font-semibold">Continue from a saved working file</summary><label className="mt-3 block">Choose your requirements working file<input className="mt-2 block" type="file" accept=".json,application/json" onChange={event => { void openFile(event.target.files?.[0]); event.target.value = ""; }}/></label>{pending && <div className="notice mt-3"><p>Ready to open: {pending.title || "Untitled work"}, revision {pending.revision}, {pending.entries.length} entries. Opening replaces the notes currently on this page.</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" className="btn" onClick={() => { setWork(pending); setPending(null); setFallback(null); setNotice("Working file opened. Changes are not saved until you download again."); }}>Replace current notes with this file</button><button type="button" className="btn btn--light" onClick={() => { setPending(null); setNotice("Current notes kept."); }}>Keep current notes</button></div></div>}</details>
    <label className="block font-semibold">Name of the work<input className="mt-2 block w-full rounded-lg border border-line p-3 font-normal" maxLength={300} value={work.title} onChange={event => setWork(current => ({ ...current, title: event.target.value }))}/></label>
    <label className="block font-semibold">Working revision<input className="mt-2 block w-full rounded-lg border border-line p-3 font-normal" maxLength={80} value={work.revision} onChange={event => setWork(current => ({ ...current, revision: event.target.value }))}/></label>
    {work.entries.map((entry, index) => <fieldset key={entry.id} className="rounded-xl border border-line p-5 space-y-5"><legend className="px-2 text-xl font-semibold">Requirement {index + 1}</legend>{REQUIREMENT_FIELDS.map(field => <div key={field.id}><label className="block font-semibold" htmlFor={`${entry.id}-${field.id}`}>{field.label}</label><p id={`${entry.id}-${field.id}-help`} className="my-2 text-muted">{field.help}</p><textarea ref={field.id === "requirement" ? element => { entryRefs.current[entry.id] = element; } : undefined} id={`${entry.id}-${field.id}`} aria-describedby={`${entry.id}-${field.id}-help requirements-privacy`} className="w-full rounded-lg border border-line p-3" rows={3} maxLength={4000} value={entry[field.id]} onChange={event => update(entry.id, { [field.id]: event.target.value })}/></div>)}<label className="block font-semibold">Current review position<select className="mt-2 block w-full rounded-lg border border-line p-3 font-normal" value={entry.status} onChange={event => update(entry.id, { status: event.target.value as RequirementEntry["status"] })}>{REQUIREMENT_STATUSES.map(status => <option key={status}>{status}</option>)}</select></label><p className="text-sm text-muted">This records the preparer&apos;s account. It does not establish compliance or verify a review. If work or sources change, revisit the affected requirement and update its position.</p></fieldset>)}
    <div className="flex flex-wrap gap-3"><button type="button" className="btn btn--light" onClick={add} disabled={work.entries.length >= 20}>Add another requirement</button><button type="button" className="btn btn--primary" onClick={() => download("json")}>Save editable working file</button><button type="button" className="btn btn--light" onClick={() => download("text")}>Download review summary</button></div>
    <p role="status" aria-live="polite">{notice}</p>
    {fallback && <label className="block font-semibold">Complete {fallback === "json" ? "working file" : "review summary"}<textarea className="mt-2 w-full rounded-lg border border-line p-3 font-normal" rows={16} readOnly value={fallback === "json" ? JSON.stringify(work, null, 2) : text} onFocus={event => event.target.select()}/></label>}
  </section>;
}
