'use client';
import { useState } from 'react';
import styles from '@/app/welcome.module.css';

export function WelcomeClasShare() {
  const [message, setMessage] = useState('');
  async function copyLink() {
    const url = new URL('/', window.location.origin).href;
    try { await navigator.clipboard.writeText(url); setMessage('Collection link copied.'); }
    catch { setMessage(`Copy this link: ${url}`); }
  }
  return <section className={styles.clasShare} aria-label="Share National CLAS Standards">
    <a href="/home"><img src="/images/welcome/one-dsd-home-qr.svg" width="320" height="320" alt="Scan to open the One DSD app" /></a>
    <span>Scan to open One DSD</span>
    <button type="button" onClick={copyLink}>Copy collection link</button>
    <p role="status" aria-live="polite">{message}</p>
  </section>;
}
