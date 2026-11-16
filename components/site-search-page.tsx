"use client";

import { useState } from "react";
import Link, { SourceLink } from "@/components/app-link";
import { handOffSearch, postSearch, PrivateSearchBox, SEARCH_HANDOFF_KEYS, useHandOff } from "@/components/private-search";
import "@/components/site-search.css";

type Result = { id: string; title: string; href: string; excerpt: string; area: string; external: boolean };

/** The full search page. What someone types stays in this page; results come from a request body. */
export function SiteSearchPage() {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function run(text: string) {
    const q = text.trim().slice(0, 200);
    setDraft(q);
    setQuery(q);
    if (!q) { setResults([]); setStatus("idle"); return; }
    setStatus("loading");
    try {
      const payload = await postSearch<{ results?: Result[] }>("/api/search", { q, limit: 40 });
      setResults(payload.results ?? []);
      setStatus("done");
    } catch {
      setResults([]);
      setStatus("error");
    }
  }

  // Words typed in the search box at the top of the page arrive through this tab's session storage.
  useHandOff(SEARCH_HANDOFF_KEYS.siteSearch, text => void run(text));

  return <>
    <PrivateSearchBox className="site-search-page-form" id="site-search-page-q" labelClassName="sr-only"
      label="Search the whole program and State of Minnesota agencies" buttonLabel="Search"
      placeholder="Search courses, policies, communities, agencies…" value={draft} onChange={setDraft} onSearch={text => void run(text)} />
    {query ? <p className="site-search-count" role="status">{
      status === "loading" ? "Searching…"
        : status === "error" ? "Search is not available just now. Try again in a moment."
        : results.length ? `${results.length} results for “${query}”` : `Nothing matched “${query}”. Try fewer or different words, or ask your question in Ask.`
    }</p> : null}
    <ol className="site-search-results">
      {results.map(result => <li key={result.id} className={`site-search-result area-${result.area}`}>
        {result.external
          ? <SourceLink href={result.href} target="_blank" rel="noreferrer">{result.title}</SourceLink>
          : <Link href={result.href}>{result.title}</Link>}
        {result.excerpt ? <p>{result.excerpt}</p> : null}
      </li>)}
    </ol>
    {query && status !== "loading" ? <p className="site-search-ask"><Link href="/ask" onClick={() => handOffSearch(SEARCH_HANDOFF_KEYS.ask, query)}>Ask this as a question</Link></p> : null}
  </>;
}
