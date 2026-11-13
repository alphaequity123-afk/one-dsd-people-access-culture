"use client";
import { SourceLink } from "@/components/app-link";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, PDFDocumentLoadingTask } from "pdfjs-dist";

/** Keep original diagrams and tables intact, with one document page in view. */
export function SourceDocument({ src, title }: { src: string; title: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [text, setText] = useState("");
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    let disposed = false;
    let task: PDFDocumentLoadingTask | undefined;
    void import("pdfjs-dist").then(async pdf => {
      pdf.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
      task = pdf.getDocument({ url: src });
      const loaded = await task.promise;
      if (!disposed) setDocument(loaded);
      else await task.destroy();
    }).catch(() => { if (!disposed) setFallback(true); });
    return () => { disposed = true; void task?.destroy(); };
  }, [src]);
  useEffect(() => {
    if (!document) return;
    let cancelled = false;
    let render: { cancel(): void } | undefined;
    void document.getPage(page).then(async pdfPage => {
      if (cancelled || !canvas.current) return;
      const viewport = pdfPage.getViewport({ scale: 1.6 });
      const element = canvas.current;
      element.width = viewport.width;
      element.height = viewport.height;
      const task = pdfPage.render({ canvas: element, viewport });
      render = task;
      const content = await pdfPage.getTextContent();
      if (!cancelled) setText(content.items.map(item => "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "").join(""));
      await task.promise;
      if (!cancelled) setReady(true);
    }).catch(error => { if (!cancelled && error?.name !== "RenderingCancelledException") setFallback(true); });
    return () => { cancelled = true; render?.cancel(); };
  }, [document, page]);
  const turn = (n: number) => { setReady(false); setPage(n); };
  const navigation = <nav className="source-reading-pagination" aria-label="Document pages">
    <button type="button" disabled={page <= 1 || !document} onClick={() => turn(page - 1)}>Previous</button>
    <span aria-live="polite">{document ? `${page} of ${document.numPages}` : "Loading"}</span>
    <button type="button" disabled={!document || page >= document.numPages} onClick={() => turn(page + 1)}>Next</button>
  </nav>;
  return <div className="source-document">
    <p><SourceLink href={src} target="_blank" rel="noopener">Open document</SourceLink></p>
    {!fallback ? <>{navigation}<div className="source-document-sheet" aria-busy={!ready}><canvas ref={canvas} role="img" aria-label={`${title}, page ${page}`} /></div>
      <details className="pilot-supporting"><summary>Page text</summary><div className="pilot-supporting-body source-document-text">{text}</div></details>
      {document && document.numPages > 1 ? navigation : null}</> : null}
  </div>;
}
