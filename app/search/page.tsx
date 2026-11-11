import type { Metadata } from "next";
import Link from "next/link";
import { siteSearch } from "@/lib/search/site-search";
import { requestedContentScope } from "@/lib/product/request-context";
import "@/components/site-search.css";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 200);
  const results = query ? await siteSearch(query, await requestedContentScope(), 40) : [];
  return <div className="calm site-search-page">
    <h1>Search</h1>
    <form action="/search" role="search" className="site-search-page-form">
      <label htmlFor="site-search-page-q" className="sr-only">Search the whole program and State of Minnesota agencies</label>
      <input id="site-search-page-q" name="q" type="search" defaultValue={query} placeholder="Search courses, policies, communities, agencies…" />
      <button type="submit">Search</button>
    </form>
    {query ? <p className="site-search-count">{results.length ? `${results.length} results for “${query}”` : `Nothing matched “${query}”. Try fewer or different words, or ask your question in Ask.`}</p> : null}
    <ol className="site-search-results">
      {results.map(result => <li key={result.id} className={`site-search-result area-${result.area}`}>
        {result.external
          ? <a href={result.href} target="_blank" rel="noreferrer">{result.title}</a>
          : <Link href={result.href}>{result.title}</Link>}
        {result.excerpt ? <p>{result.excerpt}</p> : null}
      </li>)}
    </ol>
    {query ? <p className="site-search-ask"><Link href={`/ask?q=${encodeURIComponent(query)}`}>Ask this as a question</Link></p> : null}
  </div>;
}
