'use client';

import { useState } from 'react';

export function ShareClasCollection() {
  const [message, setMessage] = useState('');
  async function copyLink() {
    const url = new URL('/learn/clas/collection', window.location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Collection link copied.');
    } catch {
      setMessage(`Copy this collection link: ${url}`);
    }
  }
  return <section aria-labelledby="share-collection">
    <h2 id="share-collection">Share or take the collection with you</h2>
    <p>Share one link to all nine lessons, or download the complete collection for offline use. The ZIP includes lesson videos, discussion audio, transcripts, captions, practice activities with feedback, job aids and blank working notes.</p>
    <button type="button" onClick={copyLink}>Copy collection link</button>
    <a className="clas-study-primary text-white" href="/downloads/clas-curriculum-collection.zip" download>Download the complete collection (ZIP, about 200 MB)</a>
    <p>After downloading, extract the ZIP and open <strong>index.html</strong>. Online links to the wider app and original standards need an internet connection. Your personal notes and progress are not included in the shared collection.</p>
    <p role="status" aria-live="polite">{message}</p>
  </section>;
}
