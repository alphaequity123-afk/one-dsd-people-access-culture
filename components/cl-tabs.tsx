'use client';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import './cl-tabs.css';

/** One tab: `id` is the panel's address (`#id`), `label` is the tab's visible name. */
export type ClTab = { id: string; label: string; content: ReactNode };

/**
 * Accessible tabs on one address. Every panel is rendered on the server, so the whole page reads
 * without JavaScript (with an "On this page" list of links). After hydration only the selected
 * panel shows; the first tab is open by default. A URL hash that names a panel, or any element
 * inside one, opens that panel, so older deep links keep working.
 */
export function ClTabs({ label, tabs }: { label: string; tabs: ClTab[] }) {
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState(0);
  const panels = useRef<(HTMLDivElement | null)[]>([]);

  const panelForHash = useCallback((hash: string) => {
    const id = decodeURIComponent(hash.replace(/^#/, ''));
    if (!id) return -1;
    const target = document.getElementById(id);
    if (!target) return -1;
    return panels.current.findIndex(panel => panel === target || (panel?.contains(target) ?? false));
  }, []);

  useEffect(() => {
    function openFromHash(scroll: boolean) {
      const found = panelForHash(window.location.hash);
      if (found < 0) return;
      setSelected(found);
      if (scroll) window.requestAnimationFrame(() => document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView?.());
    }
    // Panels hide only after hydration, so readers without JavaScript always see every panel.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
    openFromHash(true);
    const onHash = () => openFromHash(true);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [panelForHash]);

  function choose(next: number, focus: boolean) {
    if (next !== selected) panels.current[selected]?.querySelectorAll<HTMLMediaElement>('audio,video').forEach(media => { try { media.pause(); } catch { /* not playing */ } });
    setSelected(next);
    try { window.history.replaceState(null, '', `#${tabs[next].id}`); } catch { /* address cannot change here */ }
    if (focus) document.getElementById(`${tabs[next].id}-tab`)?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const count = tabs.length;
    const next = event.key === 'ArrowRight' ? (index + 1) % count : event.key === 'ArrowLeft' ? (index + count - 1) % count : event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : undefined;
    if (next === undefined) return;
    event.preventDefault();
    choose(next, true);
  }

  return <div className="cl-tabs">
    {ready
      ? <div role="tablist" aria-label={label}>{tabs.map((tab, index) => <button key={tab.id} type="button" role="tab" id={`${tab.id}-tab`} aria-controls={tab.id} aria-selected={selected === index} tabIndex={selected === index ? 0 : -1} onKeyDown={event => onKeyDown(event, index)} onClick={() => choose(index, false)}>{tab.label}</button>)}</div>
      : <nav aria-label={`${label}: on this page`} className="cl-tabs-contents"><ul>{tabs.map(tab => <li key={tab.id}><a href={`#${tab.id}`}>{tab.label}</a></li>)}</ul></nav>}
    {tabs.map((tab, index) => <div key={tab.id} ref={element => { panels.current[index] = element; }} className="cl-tabs-panel" id={tab.id} role={ready ? 'tabpanel' : undefined} aria-labelledby={ready ? `${tab.id}-tab` : undefined} tabIndex={ready ? 0 : undefined} hidden={ready && selected !== index}>{tab.content}</div>)}
  </div>;
}
