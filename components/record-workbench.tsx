"use client";

import { useEffect, useMemo, useState } from "react";
import { BROWSER_STORAGE_KEYS } from "@/lib/client/storage-keys";
import { FIELDS_FOR, RECORD_LABEL, emptyRecord, fileName, loadBook, lookBackDue, recordText, recordWordDocument, type LocalRecord, type RecordBook, type RecordKind } from "@/lib/implementation/records";

const STORAGE: Record<RecordKind, string> = { "action-plan": BROWSER_STORAGE_KEYS.actionPlans, "decision-record": BROWSER_STORAGE_KEYS.decisionRecords, reflection: BROWSER_STORAGE_KEYS.reflections };

function read(kind: RecordKind): RecordBook {
  try { return loadBook(window.localStorage.getItem(STORAGE[kind])); } catch { return { version: 1, records: [] }; }
}
function write(kind: RecordKind, book: RecordBook): boolean {
  try { window.localStorage.setItem(STORAGE[kind], JSON.stringify(book)); return true; } catch { return false; }
}
function download(name: string, type: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const link = document.createElement("a");
  link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function newId(): string { return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()); }

export function RecordWorkbench({ kind, prefill = {}, teamSpace = false }: { kind: RecordKind; prefill?: Record<string, string>; teamSpace?: boolean }) {
  const [book, setBook] = useState<RecordBook>({ version: 1, records: [] });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [ready, setReady] = useState(false);
  const fields = FIELDS_FOR[kind];
  const prefillKey = JSON.stringify(prefill);

  useEffect(() => {
    const loaded = read(kind);
    const wanted = JSON.parse(prefillKey) as Record<string, string>;
    if (Object.keys(wanted).length) {
      const record = emptyRecord(kind, newId(), new Date(), wanted);
      loaded.records.unshift(record);
      write(kind, loaded);
      setActiveId(record.id);
      // A reload must not start a second copy of the same plan.
      try { window.history.replaceState(null, "", window.location.pathname); } catch { /* keep going */ }
    } else setActiveId(loaded.records[0]?.id ?? null);
    setBook(loaded);
    setReady(true);
  }, [kind, prefillKey]);

  const active = useMemo(() => book.records.find(record => record.id === activeId) ?? null, [book, activeId]);
  // Anything whose look-back date has come, so a person who returns is shown what is ready to revisit. Nothing is sent as a reminder.
  const due = useMemo(() => { const today = new Date().toISOString().slice(0, 10); return book.records.filter(record => lookBackDue(record, today)); }, [book]);

  function commit(next: RecordBook, message: string) {
    setBook(next);
    setStatus(write(kind, next) ? message : "This browser would not save. Download a copy so you do not lose your work.");
  }
  function update(change: Partial<LocalRecord> & { fields?: Record<string, string> }) {
    if (!active) return;
    const record = { ...active, ...change, fields: { ...active.fields, ...(change.fields ?? {}) }, updatedAt: new Date().toISOString() };
    commit({ version: 1, records: book.records.map(item => item.id === record.id ? record : item) }, "Saved on this computer.");
  }
  function startNew() {
    const record = emptyRecord(kind, newId(), new Date());
    commit({ version: 1, records: [record, ...book.records] }, `New ${RECORD_LABEL[kind].toLowerCase()} started.`);
    setActiveId(record.id);
  }
  function remove() {
    if (!active || !window.confirm(`Remove "${active.title}" from this computer? This cannot be undone.`)) return;
    const records = book.records.filter(item => item.id !== active.id);
    commit({ version: 1, records }, "Removed from this computer.");
    setActiveId(records[0]?.id ?? null);
  }
  async function saveToTeam() {
    if (!active) return;
    setStatus("Saving to the team space...");
    const body = JSON.stringify(active.teamRecordId ? { id: active.teamRecordId.split("@")[0], version: Number(active.teamRecordId.split("@")[1]), title: active.title, fields: active.fields, savedBy: "" } : { title: active.title, fields: active.fields, savedBy: "" });
    try {
      const response = await fetch("/api/team-space/decision-records", { method: active.teamRecordId ? "PUT" : "POST", headers: { "content-type": "application/json" }, body });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setStatus(result.error ?? "The team space could not save this record. It is still on your computer."); return; }
      update({ teamRecordId: `${result.record.id}@${result.record.version}` });
      setStatus("Saved to the team space for the One DSD Team and the consultant. Your copy stays here too.");
    } catch { setStatus("The team space could not be reached. Your record is still on your computer."); }
  }

  if (!ready) return <p className="calm-muted">Opening your saved work...</p>;

  return <div>
    <div className="calm-actions calm-no-print">
      <button type="button" className="calm-button" onClick={startNew}>Start a new {RECORD_LABEL[kind].toLowerCase()}</button>
      {book.records.length > 1 ? <label className="calm-field" style={{ minWidth: "16rem" }}><span className="sr-only">Choose a saved {RECORD_LABEL[kind].toLowerCase()}</span>
        <select value={activeId ?? ""} onChange={event => setActiveId(event.target.value)}>{book.records.map(record => <option key={record.id} value={record.id}>{record.title}</option>)}</select>
      </label> : null}
    </div>
    {due.length ? <div className="calm-note" role="note">
      <p><strong>Ready to look back.</strong> The date you set has come for {due.length === 1 ? "this one" : "these"}. Open it and write what you notice now.</p>
      <ul>{due.slice(0, 6).map(record => <li key={record.id}><button type="button" className="calm-button calm-button--quiet" onClick={() => setActiveId(record.id)}>{record.title}</button></li>)}</ul>
    </div> : null}
    {!active ? <p className="calm-muted">Nothing saved yet. Start one when you are ready.</p> : <form className="calm-form" onSubmit={event => event.preventDefault()}>
      <p className="calm-note">Leave out client, case, health and personnel details. This stays on this computer unless you choose otherwise.</p>
      <div className="calm-field"><label htmlFor="record-title">Title</label><input id="record-title" value={active.title} maxLength={160} onChange={event => update({ title: event.target.value })} /></div>
      {fields.map(field => <div className="calm-field" key={field.key}>
        <label htmlFor={`field-${field.key}`}>{field.label}</label>
        <span className="calm-help" id={`help-${field.key}`}>{field.help}</span>
        {field.kind === "long" ? <textarea id={`field-${field.key}`} aria-describedby={`help-${field.key}`} maxLength={4000} value={active.fields[field.key] ?? ""} onChange={event => update({ fields: { [field.key]: event.target.value } })} />
          : field.kind === "choice" ? <select id={`field-${field.key}`} aria-describedby={`help-${field.key}`} value={active.fields[field.key] ?? ""} onChange={event => update({ fields: { [field.key]: event.target.value } })}>{field.choices!.map(choice => <option key={choice} value={choice}>{choice || "Choose one"}</option>)}</select>
          : <input id={`field-${field.key}`} type={field.kind === "date" ? "date" : "text"} aria-describedby={`help-${field.key}`} maxLength={4000} value={active.fields[field.key] ?? ""} onChange={event => update({ fields: { [field.key]: event.target.value } })} />}
      </div>)}
      <div className="calm-actions calm-no-print">
        <button type="button" className="calm-button calm-button--quiet" onClick={() => download(fileName(active, "doc"), "application/msword", recordWordDocument(active))}>Download for Word</button>
        <button type="button" className="calm-button calm-button--quiet" onClick={() => download(fileName(active, "txt"), "text/plain;charset=utf-8", recordText(active))}>Download as text</button>
        <button type="button" className="calm-button calm-button--quiet" onClick={() => window.print()}>Print</button>
        {teamSpace ? <button type="button" className="calm-button calm-button--quiet" onClick={saveToTeam}>{active.teamRecordId ? "Update the team space copy" : "Save to the team space"}</button> : null}
        <button type="button" className="calm-button calm-button--quiet" onClick={remove}>Remove</button>
      </div>
      {teamSpace ? <p className="calm-muted calm-small">Saving to the team space is your choice. It shares this one record with the One DSD Team and the Equity and Inclusion Operations Consultant, so leadership can follow the reasoning. Nothing else you do here is shared.</p> : null}
    </form>}
    <p role="status" aria-live="polite" className="calm-muted calm-small">{status}</p>
  </div>;
}
