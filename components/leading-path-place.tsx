"use client";
import Link from "@/components/app-link";
import { useEffect, useState } from "react";
import { BROWSER_STORAGE_KEYS } from "@/lib/client/storage-keys";
import styles from "./collections.module.css";

export type LeadingPathRow = { id: string; title: string; href?: string; minutes?: number; required?: string };

/** "Keep my place" for a suggested path. Self-marked, kept in this browser, never sent anywhere. */
export function LeadingPathPlace({ pathId, rows }: { pathId: string; rows: readonly LeadingPathRow[] }) {
  const key = BROWSER_STORAGE_KEYS.pathProgress(`leading-${pathId}`);
  const [done, setDone] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const saved: unknown = JSON.parse(window.localStorage.getItem(key) ?? "null");
        if (saved && typeof saved === "object" && (saved as { version?: unknown }).version === 1 && Array.isArray((saved as { done?: unknown }).done)) setDone((saved as { done: unknown[] }).done.filter((id): id is string => typeof id === "string"));
      } catch { setMessage("Your place could not be opened. You can still use this path."); }
    });
    return () => { active = false; };
  }, [key]);
  function save(next: string[]) {
    setDone(next);
    try {
      if (next.length) window.localStorage.setItem(key, JSON.stringify({ version: 1, done: next }));
      else window.localStorage.removeItem(key);
      setMessage("Saved in this browser.");
    } catch { setMessage("Your place could not be saved in this browser."); }
  }
  return <>
    <ol className={styles.pathList}>
      {rows.map(row => <li key={row.id}>
        <div className={styles.pathRow}>
          <span>{row.href ? <Link href={row.href} prefetch={false}>{row.title}</Link> : <span>{row.title}</span>}{row.required ? <span className={styles.required}>{row.required}</span> : null}{row.href ? null : <span className={styles.unavailable}> This course is not available right now.</span>}</span>
          {row.minutes ? <span className={styles.pathMinutes}>About {row.minutes} minutes</span> : null}
        </div>
        <label className={styles.pathCheck}><input type="checkbox" checked={done.includes(row.id)} onChange={event => save(event.target.checked ? [...done, row.id] : done.filter(id => id !== row.id))} />I have finished with this one</label>
      </li>)}
    </ol>
    <div className={styles.pathActions}><button type="button" onClick={() => save([])}>Clear my place</button><p role="status" className="m-0">{message}</p></div>
  </>;
}
