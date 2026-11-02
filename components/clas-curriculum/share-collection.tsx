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
    <h2 id="share-collection">Share the collection</h2>
    <button type="button" onClick={copyLink}>Copy collection link</button>
    <a className="clas-study-primary text-white" href="/downloads/clas-curriculum-collection.zip" download>Download the complete collection (ZIP, about 200 MB)</a>
    <p>To use the download, extract the ZIP and open <strong>index.html</strong>.</p>
    <p role="status" aria-live="polite">{message}</p>
  </section>;
}
