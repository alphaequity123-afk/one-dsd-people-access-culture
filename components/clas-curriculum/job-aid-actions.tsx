'use client';
import { downloadText } from './download';

/** Print and .txt download for a job aid; the text is prepared on the server and passed in. */
export function JobAidActions({ fileName, text, downloadLabel = "Download as .txt" }: { fileName: string; text: string; downloadLabel?: string }) {
  return (
    <div className="clas-job-aid-actions">
      <button type="button" onClick={() => downloadText(fileName, text)}>{downloadLabel}</button>
      <button type="button" className="clas-study-secondary" onClick={() => window.print()}>Print this page</button>
    </div>
  );
}
