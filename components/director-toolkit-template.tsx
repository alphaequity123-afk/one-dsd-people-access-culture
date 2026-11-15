"use client";
import { SourceLink } from "@/components/app-link";

import { useState } from "react";
import { CHECKLIST_ANSWERS, TEMPLATE_KEEP_OUT, cellKey, checkKey, sectionHref, templateAnchor, templateText, type DirectorTemplate } from "@/lib/content/director-toolkit";
import styles from "./director-toolkit.module.css";

/** One printable fill-in template with transient entries and explicit copy, download and print actions. */
export function DirectorToolkitTemplate({ template, sectionTitle }: { template: DirectorTemplate; sectionTitle: string }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [rowCounts, setRowCounts] = useState<Record<string, number>>({});
  const [printing, setPrinting] = useState(false);
  const [notice, setNotice] = useState("");
  const [manual, setManual] = useState(false);
  const anchor = templateAnchor(template.id);
  const text = templateText(template, values, rowCounts);
  const set = (key: string, value: string) => setValues(current => ({ ...current, [key]: value }));

  function print() {
    document.body.dataset.directorPrint = template.id;
    setPrinting(true);
    const done = () => { delete document.body.dataset.directorPrint; setPrinting(false); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    // Let the print-only marker render before the dialog opens.
    window.setTimeout(() => { try { window.print(); } finally { if (!("onafterprint" in window)) done(); } }, 0);
  }
  async function copy() {
    try { await navigator.clipboard.writeText(text); setNotice("Copied. Paste it where you keep your working records."); setManual(false); }
    catch { setNotice("Copy was not available. Select and copy the text below."); setManual(true); }
  }
  function download() {
    let url: string | undefined;
    try {
      url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
      const link = document.createElement("a"); link.href = url; link.download = `${template.id}.txt`;
      document.body.appendChild(link); link.click(); link.remove();
      setNotice("Your download is ready.");
    } catch { setNotice("The download could not start. Select and copy the text below."); setManual(true); }
    finally { if (url) { const pending = url; window.setTimeout(() => URL.revokeObjectURL(pending), 1000); } }
  }
  function clear() { setValues({}); setRowCounts({}); setNotice("The template is clear."); setManual(false); }

  return <section id={anchor} className={styles.template} data-printing={printing ? "true" : undefined} aria-labelledby={`${anchor}-title`}>
    <h2 id={`${anchor}-title`} className="text-2xl font-bold">{template.title}</h2>
    <p>{template.purpose}</p>
    <p>{template.howToUse}</p>
    <p className={`${styles.help} ${styles.noPrint}`}>Part of <SourceLink href={sectionHref(template.sectionId)}>{sectionTitle}</SourceLink> in the toolkit.</p>
    <form onSubmit={event => event.preventDefault()} aria-describedby={`${anchor}-keep-out`}>
      {template.fields.map(field => {
        const id = `${anchor}-${field.id}`;
        const help = field.help ? <p id={`${id}-help`} className={styles.help}>{field.help}</p> : null;
        const describedBy = field.help ? `${id}-help` : undefined;
        if (field.kind === "text") return <div key={field.id} className={styles.field}><label htmlFor={id}>{field.label}</label>{help}<input id={id} type="text" maxLength={500} aria-describedby={describedBy} value={values[field.id] ?? ""} onChange={event => set(field.id, event.target.value)} /></div>;
        if (field.kind === "long") return <div key={field.id} className={styles.field}><label htmlFor={id}>{field.label}</label>{help}<textarea id={id} rows={3} maxLength={4000} aria-describedby={describedBy} value={values[field.id] ?? ""} onChange={event => set(field.id, event.target.value)} /></div>;
        if (field.kind === "choice") return <fieldset key={field.id} className={styles.fieldset} aria-describedby={describedBy}><legend className={styles.fieldLabel}>{field.label}</legend>{help}{field.options.map((option, index) => <label key={option} className="block"><input type="radio" name={id} checked={values[field.id] === option} onChange={() => set(field.id, option)} id={`${id}-${index}`} /> {option}</label>)}</fieldset>;
        if (field.kind === "checklist") return <fieldset key={field.id} className={styles.fieldset} aria-describedby={describedBy}><legend className={styles.fieldLabel}>{field.label}</legend>{help}
          {field.items.map((item, index) => { const key = checkKey(field.id, index); const name = `${id}-${index}`; return <div key={item} className={styles.checkRow}>
            <span id={`${name}-q`}>{item}</span>
            <fieldset aria-labelledby={`${name}-q`}>{CHECKLIST_ANSWERS.map(answer => <label key={answer}><input type="radio" name={name} checked={values[key] === answer} onChange={() => set(key, answer)} /> {answer}</label>)}</fieldset>
          </div>; })}
        </fieldset>;
        const rows = Math.max(field.rows, rowCounts[field.id] ?? field.rows);
        return <div key={field.id} className={styles.field}><p className={styles.fieldLabel} id={`${id}-label`}>{field.label}</p>{help}
          <div className={styles.tableWrap}><table className={styles.grid} aria-labelledby={`${id}-label`}><thead><tr><th scope="col">Row</th>{field.columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead>
            <tbody>{Array.from({ length: rows }, (_, row) => <tr key={row}><th scope="row">{row + 1}</th>{field.columns.map((column, columnIndex) => { const key = cellKey(field.id, row, columnIndex); return <td key={column}><textarea rows={2} maxLength={1500} aria-label={`${column}, row ${row + 1}`} value={values[key] ?? ""} onChange={event => set(key, event.target.value)} /></td>; })}</tr>)}</tbody>
          </table></div>
          <button type="button" className={`btn btn--light mt-2 ${styles.noPrint}`} onClick={() => setRowCounts(current => ({ ...current, [field.id]: rows + 1 }))} disabled={rows >= 30}>Add a row</button>
        </div>;
      })}
    </form>
    <p id={`${anchor}-keep-out`} className={`notice ${styles.keepOut}`}>{TEMPLATE_KEEP_OUT} The app does not autosave or submit your entries. Copy, download or print if you need a record before leaving this page.</p>
    <div className={styles.actions}>
      <button type="button" className="btn btn--primary" onClick={print}>Print this template</button>
      <button type="button" className="btn btn--light" onClick={copy}>Copy as text</button>
      <button type="button" className="btn btn--light" onClick={download}>Download as text</button>
      <button type="button" className="btn btn--light" onClick={clear}>Clear</button>
    </div>
    <p role="status" className={styles.noPrint}>{notice}</p>
    {manual ? <label className={`block ${styles.noPrint}`}>Your template as text<textarea className="mt-2 w-full rounded-lg border border-line p-3" rows={12} readOnly value={text} onFocus={event => event.target.select()} /></label> : null}
  </section>;
}
