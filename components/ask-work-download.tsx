"use client";
import { useState } from "react";
import type { AskWorkProduct } from "@/lib/ask/work-product";
import { downloadFileName } from "@/lib/downloads/model";

export function AskWorkDownload({ work }: { work: AskWorkProduct }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function download() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/ask/export", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(work) });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(typeof result.error === "string" ? result.error : "The download could not finish. Please try again.");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url; link.download = downloadFileName(work.title, work.format);
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (error) { setError(error instanceof Error ? error.message : "Please try downloading again."); }
    finally { setBusy(false); }
  }
  return <section className="my-6 border-y border-slate-300 py-5" aria-label="Your draft">
    <h3 className="text-lg font-medium">{work.title}</h3>
    <button type="button" className="btn btn--primary mt-3" disabled={busy} onClick={() => { void download(); }}>
      {busy ? "Preparing download…" : `Download ${work.format === "xlsx" ? "Excel" : "Word"}`}
    </button>
    {error ? <p role="alert" className="mt-2">{error}</p> : null}
    <details className="mt-4"><summary>Preview draft</summary>
      {work.sections.map((section, index) => <div key={index} className="mt-5">
        {section.heading ? <h4 className="font-medium">{section.heading}</h4> : null}
        {section.paragraphs.map((text, index) => <p key={index} className="whitespace-pre-wrap">{text}</p>)}
        {section.headers.length ? <div className="overflow-x-auto" role="region" aria-label={section.heading || "Draft table"} tabIndex={0}>
          <table className="w-full text-sm"><thead><tr>{section.headers.map((text, index) => <th scope="col" key={index} className="p-3 text-left font-medium">{text}</th>)}</tr></thead>
            <tbody>{section.rows.map((row, index) => <tr key={index}>{row.map((text, index) => <td key={index} className="border-t border-slate-200 p-3 align-top">{text}</td>)}</tr>)}</tbody>
          </table>
        </div> : null}
      </div>)}
    </details>
  </section>;
}
