"use client";
import { useId, useRef, useState } from "react";
import { ANALYSIS_LIMITS, type AnalysisSource } from "@/lib/analysis/contract";
import styles from "./source-intake.module.css";

export type SourceIntakeProps = {
  sources: AnalysisSource[];
  onChange: (sources: AnalysisSource[]) => void;
  disabled?: boolean;
  uploadUrl?: string;
  maxSources?: number;
};

const ACCEPT = ".pdf,.docx,.pptx,.txt,.csv,.tsv,.xlsx";
const EXTENSION = /\.(pdf|docx|pptx|txt|csv|tsv|xlsx)$/i;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const INTAKE_HELP = "PDF with selectable text, Word, PowerPoint, Excel, CSV, TSV, or text, up to 20 MB each. Scanned pages and images need their text added separately. Files are read into text in this session only and are not stored.";

function newId(prefix: string) {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
  return `${prefix}-${random}`;
}

function describeFailure(cause: unknown, fallback: string) {
  const message = cause instanceof Error ? cause.message.trim() : "";
  return message && message.length <= 300 ? message : fallback;
}

export function SourceIntake({ sources, onChange, disabled = false, uploadUrl = "/api/analyze/upload", maxSources = ANALYSIS_LIMITS.sources }: SourceIntakeProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const helpId = `${baseId}-help`;
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const full = sources.length >= maxSources;
  const locked = disabled || busy;

  function replace(next: AnalysisSource[]) { onChange(next); }
  function edit(index: number, patch: Partial<AnalysisSource>) {
    replace(sources.map((source, at) => at === index ? { ...source, ...patch } : source));
  }
  function remove(index: number) {
    const removed = sources[index];
    replace(sources.filter((_, at) => at !== index));
    setError("");
    setStatus(`Removed ${removed?.title.trim() || `source ${index + 1}`}.`);
  }
  function paste() {
    setError("");
    setStatus("Added a blank source. Give it a title and paste the text.");
    replace([...sources, { id: newId("paste"), title: "", text: "" }]);
  }

  async function upload(files: FileList | null) {
    if (!files || !files.length) return;
    setError("");
    setStatus("Reading your documents…");
    setBusy(true);
    const added: AnalysisSource[] = [];
    const problems: string[] = [];
    try {
      for (const file of Array.from(files)) {
        if (sources.length + added.length >= maxSources) { problems.push(`Use up to ${maxSources} sources at a time.`); break; }
        if (!EXTENSION.test(file.name)) { problems.push(`${file.name}: choose a PDF, Word, PowerPoint, Excel, CSV, TSV, or text file.`); continue; }
        if (!file.size || file.size > MAX_FILE_BYTES) { problems.push(`${file.name}: choose a nonempty file no larger than 20 MB.`); continue; }
        try {
          const form = new FormData();
          form.append("file", file);
          const response = await fetch(uploadUrl, { method: "POST", body: form });
          const body = await response.json().catch(() => ({})) as { error?: string; note?: string; source?: Partial<AnalysisSource> };
          if (!response.ok) throw new Error(body.error || `${file.name} could not be read.`);
          const source = body.source;
          if (!source || typeof source.text !== "string" || typeof source.title !== "string" || typeof source.id !== "string") throw new Error(`${file.name} could not be read.`);
          const note = typeof body.note === "string" && body.note ? body.note : typeof source.note === "string" && source.note ? source.note : undefined;
          added.push({ id: /^[a-z0-9][a-z0-9-]{0,79}$/.test(source.id) ? source.id : newId("upload"), title: source.title.slice(0, ANALYSIS_LIMITS.titleCharacters) || file.name.slice(0, ANALYSIS_LIMITS.titleCharacters), text: source.text, ...(note ? { note: note.slice(0, 2000) } : {}) });
        } catch (cause) {
          problems.push(describeFailure(cause, `${file.name} could not be read.`));
        }
      }
    } finally {
      if (added.length) replace([...sources, ...added]);
      setStatus(added.length ? `${added.length} ${added.length === 1 ? "document" : "documents"} added. Review the extracted text before you continue.` : "");
      setError(problems.join(" "));
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className={styles.intake}>
      <div className={styles.header}>
        <span className={styles.heading} id={`${baseId}-label`}>Documents</span>
        <span className={styles.muted}>{sources.length} of {maxSources} sources</span>
      </div>
      <div className={styles.actions}>
        <input ref={fileInput} type="file" multiple accept={ACCEPT} className={styles.hidden} tabIndex={-1} aria-hidden="true" onChange={event => void upload(event.target.files)} />
        <button type="button" className={`${styles.button} ${styles.attach}`} disabled={locked || full} aria-describedby={helpId} onClick={() => fileInput.current?.click()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m8 12 7-7a4 4 0 0 1 6 6L10 22a6 6 0 0 1-8-8L13 3a2 2 0 0 1 3 3L5 17" /></svg>
          Attach documents
        </button>
        <button type="button" className={`${styles.button} ${styles.textButton}`} disabled={locked || full} aria-describedby={helpId} onClick={paste}>Paste a document</button>
      </div>
      <p id={helpId} className={styles.help}>{INTAKE_HELP}</p>
      <p role="status" aria-live="polite" className={status ? styles.status : styles.silent}>{status}</p>
      <p role="alert" className={error ? styles.error : styles.silent}>{error}</p>
      {sources.length > 0 && (
        <ul className={styles.list} aria-labelledby={`${baseId}-label`}>
          {sources.map((source, index) => {
            const id = `${baseId}-${index}`;
            const over = source.text.length - ANALYSIS_LIMITS.sourceCharacters;
            const count = over > 0
              ? `${source.text.length.toLocaleString()} characters. The limit is ${ANALYSIS_LIMITS.sourceCharacters.toLocaleString()}; shorten this text by ${over.toLocaleString()}.`
              : `${source.text.length.toLocaleString()} of ${ANALYSIS_LIMITS.sourceCharacters.toLocaleString()} characters.`;
            const name = source.title.trim() || `Source ${index + 1}`;
            return (
              <li key={source.id} className={styles.source}>
                <div className={styles.sourceHeader}>
                  <span className={styles.sourceName}>{name}</span>
                  <button type="button" className={`${styles.button} ${styles.remove}`} disabled={locked} aria-label={`Remove ${name}`} onClick={() => remove(index)}>Remove</button>
                </div>
                <label className={styles.field} htmlFor={`${id}-title`}>Title</label>
                <input id={`${id}-title`} className={styles.input} type="text" value={source.title} maxLength={ANALYSIS_LIMITS.titleCharacters} disabled={locked} autoComplete="off" aria-required="true" onChange={event => edit(index, { title: event.target.value })} />
                <label className={styles.field} htmlFor={`${id}-text`}>Text</label>
                <textarea id={`${id}-text`} className={over > 0 ? `${styles.textarea} ${styles.overLimit}` : styles.textarea} rows={8} value={source.text} disabled={locked} aria-describedby={source.note ? `${id}-count ${id}-note` : `${id}-count`} aria-invalid={over > 0 || undefined} onChange={event => edit(index, { text: event.target.value })} />
                <p id={`${id}-count`} className={over > 0 ? styles.countOver : styles.count}>{count}</p>
                {source.note && <p id={`${id}-note`} className={styles.note}>{source.note}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default SourceIntake;
