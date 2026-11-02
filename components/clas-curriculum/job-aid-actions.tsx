'use client';
import { downloadText } from './download';

/** Print and .txt download for a job aid; the text is prepared on the server and passed in. */
export function JobAidActions({ fileName, text }: { fileName: string; text: string }) {
  return (
    <div className="clas-job-aid-actions">
      <button type="button" onClick={() => downloadText(fileName, text)}>Download as .txt</button>
      <button type="button" className="clas-study-secondary" onClick={() => window.print()}>Print this page</button>
    </div>
  );
}
