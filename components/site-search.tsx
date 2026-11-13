"use client";
import { SourceLink } from "@/components/app-link";


import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "@/components/site-search.css";

type Result = { id: string; title: string; href: string; excerpt: string; area: string; external: boolean };

/** The search box at the top of every page: suggestions as you type, Enter for the full results page. */
export function SiteSearch({ embedded = false }: { embedded?: boolean } = {}) {
  const [q, setQ] = useState("");
  const [fetched, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // Fewer than two letters shows no suggestions, whatever was fetched before.
  const results = q.trim().length < 2 ? [] : fetched;
  const router = useRouter();
  const id = useId();
  const box = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?limit=8&q=${encodeURIComponent(query)}`, { signal: controller.signal, cache: "no-store" });
        if (response.ok) { setResults((await response.json()).results ?? []); setActive(-1); setOpen(true); }
      } catch { /* a dropped suggestion request leaves the full search available */ }
    }, 180);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [q]);

  useEffect(() => {
    const close = (event: MouseEvent) => { if (box.current && !box.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function go(result: Result) {
    setOpen(false);
    if (result.external) window.open(result.href, "_blank", "noreferrer");
    else if (embedded && window.parent !== window) window.parent.location.assign(result.href);
    else router.push(result.href);
  }

  return <form ref={box} action="/search" target={embedded ? "_top" : undefined} role="search" className="site-search" onSubmit={event => {
    if (active >= 0 && results[active]) { event.preventDefault(); go(results[active]); }
  }}>
    <label htmlFor={`${id}-q`} className="sr-only">Search the whole program and State of Minnesota agencies</label>
    <input id={`${id}-q`} name="q" type="search" value={q} autoComplete="off" placeholder="Search everything…"
      role="combobox" aria-expanded={open && results.length > 0} aria-controls={`${id}-list`} aria-autocomplete="list"
      aria-activedescendant={active >= 0 ? `${id}-r${active}` : undefined}
      onChange={event => setQ(event.target.value)} onFocus={() => results.length && setOpen(true)}
      onKeyDown={event => {
        if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActive(i => Math.min(i + 1, results.length - 1)); }
        else if (event.key === "ArrowUp") { event.preventDefault(); setActive(i => Math.max(i - 1, -1)); }
        else if (event.key === "Escape") setOpen(false);
      }} />
    <button type="submit">Search</button>
    {open && results.length ? <ul id={`${id}-list`} role="listbox" className="site-search-list">
      {results.map((result, index) => <li key={result.id} id={`${id}-r${index}`} role="option" aria-selected={index === active}
        className={`site-search-option area-${result.area}${index === active ? " is-active" : ""}`}
        onMouseDown={event => { event.preventDefault(); go(result); }}>
        <strong>{result.title}</strong>
        {result.excerpt ? <span>{result.excerpt}</span> : null}
      </li>)}
      <li className="site-search-all"><SourceLink href={`/search?q=${encodeURIComponent(q.trim())}`}>See all results</SourceLink></li>
    </ul> : null}
  </form>;
}
