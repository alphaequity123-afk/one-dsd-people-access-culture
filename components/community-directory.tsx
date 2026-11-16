"use client";

import { useState, type ReactNode } from "react";
import Link from "@/components/app-link";

export type DirectoryCommunity = { id: string; title: string; native: boolean };

export function matchingCommunities(entries: DirectoryCommunity[], query: string): DirectoryCommunity[] {
  const normalized = query.trim().toLocaleLowerCase();
  return entries.filter(b => `${b.title} ${b.id}`.toLocaleLowerCase().includes(normalized));
}

/**
 * Find a community by name. Results narrow as the person types; the words stay in this page and never go into
 * the address. Words from a link (?q=) start the search.
 */
export function CommunityDirectory({ entries, featuredIds, initialQuery, copy, whenBrowsing }: {
  entries: DirectoryCommunity[];
  featuredIds: readonly string[];
  initialQuery: string;
  copy: { searchLabel: string; searchExample: string; searchButton: string };
  /** Shown only while no search is active. */
  whenBrowsing?: ReactNode;
}) {
  const [query, setQuery] = useState(initialQuery);
  const normalized = query.trim().toLocaleLowerCase();
  const matching = matchingCommunities(entries, query);
  const featured = matching.filter(b => featuredIds.includes(b.id));
  const more = matching.filter(b => !featuredIds.includes(b.id));
  const list = (items: DirectoryCommunity[]) => <ul className="community-directory">{items.map(b => <li key={b.id}><Link prefetch={false} href={`/minnesota-communities/${b.id}`}>{b.title}</Link>{b.native ? <span className="community-in-development-tag"> (we defer to the Office of Indian Affairs and the Department of Human Services offices that handle Tribal relations and consultation)</span> : null}</li>)}</ul>;
  return <>
    <form role="search" className="community-search" onSubmit={event => event.preventDefault()}>
      <label htmlFor="community-query">{copy.searchLabel}</label>
      <div>
        <input id="community-query" type="search" value={query} maxLength={200} autoComplete="off" placeholder={copy.searchExample || undefined} onChange={event => setQuery(event.target.value)} />
        <button type="submit">{copy.searchButton}</button>
        {normalized ? <button type="button" className="text-button" onClick={() => setQuery("")}>Clear search</button> : null}
      </div>
    </form>
    <p role="status">{normalized ? `${matching.length} matching ${matching.length === 1 ? "brief" : "briefs"}` : `${entries.length} community and place briefs`}</p>
    {normalized ? list(matching) : <><h2>Explore communities</h2>{list(featured)}<details className="community-more"><summary>All other communities and places ({more.length})</summary>{list(more)}</details></>}
    {normalized && !matching.length ? <p>No community matched that name. You might try a different spelling, or browse the full collection.</p> : null}
    {!normalized ? whenBrowsing : null}
  </>;
}
