"use client";

import { useId, useRef, useState } from "react";
import { POLICY_LIMITS, type PolicySource } from "@/lib/policy-analysis/contract";
import { uploadDocument } from "./api";
import styles from "./policy-analysis.module.css";

const ORIGIN_LABELS: Record<PolicySource["origin"], string> = {
  user: "Attached or pasted",
  catalog: "Official text",
  program: "From this program",
};

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/** Keeps one source inside the per-source limit and says so when it had to shorten it. */
export function fitSource(source: PolicySource): { source: PolicySource; shortened: boolean } {
  if (source.text.length <= POLICY_LIMITS.sourceCharacters) return { source, shortened: false };
  return { source: { ...source, text: source.text.slice(0, POLICY_LIMITS.sourceCharacters) }, shortened: true };
}

/** Step 2: the policy text and supporting material, the question to answer, and the analysis title. */
export function SourcesEditor({ title, onTitle, sources, onSources, context, onContext, disabled, onError, onNotice, children }: {
  title: string;
  onTitle: (value: string) => void;
  sources: PolicySource[];
  onSources: (next: PolicySource[]) => void;
  context: string;
  onContext: (value: string) => void;
  disabled: boolean;
  onError: (error: unknown) => void;
  onNotice: (message: string) => void;
  children?: React.ReactNode;
}) {
  const ids = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteText, setPasteText] = useState("");
  const total = sources.reduce((sum, source) => sum + source.text.length, 0);
  const full = sources.length >= POLICY_LIMITS.sources;
  const locked = disabled || uploading;

  function add(source: PolicySource): boolean {
    if (sources.length >= POLICY_LIMITS.sources) {
      onError(new Error(`An analysis can hold up to ${POLICY_LIMITS.sources} sources. Remove one before adding another.`));
      return false;
    }
    const fitted = fitSource(source);
    if (total + fitted.source.text.length > POLICY_LIMITS.totalSourceCharacters) {
      onError(new Error("The sources together would hold too much text. Remove a source or add a shorter passage."));
      return false;
    }
    onSources([...sources.filter(item => item.id !== fitted.source.id), fitted.source]);
    onNotice(fitted.shortened ? `Added "${fitted.source.title}". It was long, so only the first part was kept.` : `Added "${fitted.source.title}".`);
    return true;
  }

  async function upload(files: FileList | null) {
    const file = files?.[0];
    if (fileInput.current) fileInput.current.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadDocument(file);
      const added = add({ id: result.source.id, title: result.source.title.slice(0, 500), text: result.source.text, origin: "user", ...(result.note ? { note: result.note.slice(0, 2_000) } : {}) });
      if (added && result.note) onNotice(`Added "${result.source.title}". ${result.note}`);
    } catch (error) {
      onError(error);
    } finally {
      setUploading(false);
    }
  }

  function addPasted() {
    const text = pasteText.trim();
    if (!text) { onError(new Error("Paste the text before adding it.")); return; }
    const name = pasteTitle.trim() || `Pasted text ${sources.length + 1}`;
    if (add({ id: `paste-${crypto.randomUUID()}`, title: name.slice(0, 500), text, origin: "user" })) {
      setPasteTitle("");
      setPasteText("");
    }
  }

  return (
    <section className={styles.step} aria-labelledby={`${ids}-title`}>
      <span className={styles.stepNumber}>Step 2</span>
      <h2 id={`${ids}-title`}>Add the policy text and supporting material</h2>
      <p className="mt-0">Attach the policy itself and anything that shows how it works in practice: data, complaints, meeting notes, letters or forms people receive. The analysis quotes only what is in these sources.</p>

      <div className={styles.row}>
        <input ref={fileInput} type="file" className="sr-only" tabIndex={-1} aria-hidden="true" accept=".pdf,.docx,.pptx,.txt,.csv,.tsv,.xlsx" onChange={event => void upload(event.target.files)} />
        <button type="button" className={`btn btn--light ${styles.attach}`} aria-label="Attach a document" disabled={locked || full} onClick={() => fileInput.current?.click()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m8 12 7-7a4 4 0 0 1 6 6L10 22a6 6 0 0 1-8-8L13 3a2 2 0 0 1 3 3L5 17" /></svg>
          {uploading ? "Reading the document…" : "Attach a document"}
        </button>
        <span className={styles.muted}>PDF with selectable text, Word, PowerPoint, Excel, comma-separated or plain text, up to 20 megabytes.</span>
      </div>

      <details className="mt-3">
        <summary className="font-bold">Paste text</summary>
        <div className="mt-2">
          <div className="field">
            <label htmlFor={`${ids}-paste-title`}>Title of the pasted text</label>
            <input id={`${ids}-paste-title`} type="text" maxLength={500} value={pasteTitle} disabled={locked} onChange={event => setPasteTitle(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor={`${ids}-paste-text`}>Text</label>
            <textarea id={`${ids}-paste-text`} rows={8} value={pasteText} disabled={locked} onChange={event => setPasteText(event.target.value)} />
          </div>
          <button type="button" className="btn btn--light" disabled={locked || full || !pasteText.trim()} onClick={addPasted}>Add the pasted text</button>
        </div>
      </details>

      <h3>Sources in this analysis</h3>
      {sources.length ? (
        <ul className={styles.list}>
          {sources.map(source => (
            <li key={source.id} className={styles.item}>
              <div className={styles.between}>
                <div style={{ minWidth: 0 }}>
                  <p className="m-0 font-bold" style={{ overflowWrap: "anywhere" }}>{source.title}</p>
                  <p className={`${styles.muted} m-0`}>{ORIGIN_LABELS[source.origin]} · about {wordCount(source.text).toLocaleString("en-US")} words{source.url ? <> · <a href={source.url}>Link</a></> : null}</p>
                </div>
                <button type="button" className={`${styles.linkButton} ${styles.danger}`} disabled={locked} aria-label={`Remove ${source.title}`} onClick={() => { onSources(sources.filter(item => item.id !== source.id)); onNotice(`Removed "${source.title}".`); }}>Remove</button>
              </div>
              {source.note ? <p className={`${styles.small} m-0 mt-1`}>{source.note}</p> : null}
              <details className="mt-1">
                <summary className={styles.small}>Show the text</summary>
                <p className={`${styles.pre} ${styles.small} mt-1 mb-0`} style={{ maxHeight: "16rem", overflowY: "auto" }}>{source.text.slice(0, 6_000)}{source.text.length > 6_000 ? "…" : ""}</p>
              </details>
            </li>
          ))}
        </ul>
      ) : <p className={styles.muted}>No sources yet. Without the policy text, the analysis can only work from the catalog summary.</p>}
      <p className={`${styles.muted} mt-2`}>{sources.length} of {POLICY_LIMITS.sources} sources.</p>

      <div className="field mt-4">
        <label htmlFor={`${ids}-context`}>What you want to know</label>
        <p className="help m-0" id={`${ids}-context-help`}>For example: who could be left out by the new assessment timeline, and what would make the notices easier to understand.</p>
        <textarea id={`${ids}-context`} rows={4} maxLength={POLICY_LIMITS.contextCharacters} aria-describedby={`${ids}-context-help`} value={context} disabled={disabled} onChange={event => onContext(event.target.value)} />
      </div>
      <div className="field">
        <label htmlFor={`${ids}-title-input`}>Name of this analysis</label>
        <input id={`${ids}-title-input`} type="text" maxLength={240} value={title} disabled={disabled} onChange={event => onTitle(event.target.value)} required />
      </div>
      {children}
    </section>
  );
}
