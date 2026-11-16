"use client";

import { useState } from "react";
import Link, { SourceLink } from "@/components/app-link";
import { CatResultStatus } from "@/components/cat-list";
import { ButtonPager } from "@/components/private-search";
import { catPaginate } from "@/lib/cat-paging";
import type { SourcingEntry, SourcingUse } from "@/lib/content/hub/sourcing";
import styles from "@/app/community-outreach/hub.module.css";

export type FinderSource = SourcingEntry & { category: string };
type Choices = { category: string; use: string; community: string; q: string };

export function matchingSources(all: FinderSource[], choices: Choices): FinderSource[] {
  const query = choices.q.trim().toLowerCase();
  return all.filter(entry =>
    (!choices.category || entry.category === choices.category) &&
    (!choices.use || entry.uses.includes(choices.use as SourcingUse)) &&
    (!choices.community || entry.communities.includes(choices.community)) &&
    (!query || `${entry.name} ${entry.alsoKnownAs ?? ""} ${entry.what} ${entry.region} ${(entry.languages ?? []).join(" ")}`.toLowerCase().includes(query)));
}

/**
 * Where to reach people: filters and a text search kept in this page. Fixed choices from a link
 * (for example ?category=media) arrive as `initial`; typed words never go into the address.
 */
export function SourceFinder({ all, categories, uses, communities, titles, initial }: {
  all: FinderSource[];
  categories: { category: string; title: string; intro: string }[];
  uses: readonly string[];
  communities: string[];
  titles: Record<string, string>;
  initial: Choices & { page: string };
}) {
  const [draft, setDraft] = useState<Choices>({ category: initial.category, use: initial.use, community: initial.community, q: initial.q });
  const [choices, setChoices] = useState<Choices>(draft);
  const [page, setPage] = useState(initial.page);
  const shown = matchingSources(all, choices);
  const paging = catPaginate(shown, page, 8);
  const groups = categories.map(c => ({ ...c, entries: paging.items.filter(entry => entry.category === c.category) })).filter(c => c.entries.length);
  const filtered = Boolean(choices.category || choices.use || choices.community || choices.q);
  const reset = () => { const none = { category: "", use: "", community: "", q: "" }; setDraft(none); setChoices(none); setPage("1"); };
  const set = (key: keyof Choices) => (value: string) => setDraft(current => ({ ...current, [key]: value }));
  return <>
    <form className={styles.filters} role="search" aria-label="Filter sources" onSubmit={event => { event.preventDefault(); setChoices({ ...draft, q: draft.q.trim().slice(0, 200) }); setPage("1"); }}>
      <label>Type of source<select value={draft.category} onChange={event => set("category")(event.target.value)}><option value="">All types</option>{categories.map(c => <option key={c.category} value={c.category}>{c.title}</option>)}</select></label>
      <label>Use<select value={draft.use} onChange={event => set("use")(event.target.value)}><option value="">All uses</option>{uses.map(u => <option key={u} value={u}>{u}</option>)}</select></label>
      <label>Community<select value={draft.community} onChange={event => set("community")(event.target.value)}><option value="">All communities</option>{communities.map(id => <option key={id} value={id}>{titles[id]}</option>)}</select></label>
      <label>Search<input type="search" value={draft.q} maxLength={200} autoComplete="off" onChange={event => set("q")(event.target.value)} /></label>
      <button className={styles.button} type="submit">Show sources</button>
      {filtered ? <button type="button" className="text-button" onClick={reset}>Clear filters</button> : null}
    </form>
    <CatResultStatus page={paging} noun="source" nouns="sources" />

    {groups.length ? groups.map(group => <section className={styles.section} key={group.category} aria-labelledby={`group-${group.category}`}>
      <h2 id={`group-${group.category}`}>{group.title}</h2>
      <p>{group.intro}</p>
      <ul className={styles.grid} style={{ listStyle: "none", padding: 0 }}>
        {group.entries.map(entry => <li className={styles.card} key={`${entry.name}-${entry.region}`}>
          <h3>{entry.website ? <SourceLink href={entry.website}>{entry.name}</SourceLink> : entry.name}</h3>
          <p className={styles.meta}>{[entry.kind, entry.region].filter(Boolean).join(" · ")}</p>
          <div>{entry.uses.map(u => <span className={styles.chip} key={u}>{u}</span>)}</div>
          <p>{entry.what}</p>
          <p className={styles.small}>{entry.howToUse}</p>
          {entry.languages?.length ? <p className={styles.small}>Languages: {entry.languages.join(", ")}</p> : null}
          {entry.communities.some(id => titles[id]) ? <p className={styles.small}>Communities: {entry.communities.filter(id => titles[id]).map(id => titles[id]).join(", ")}</p> : null}
          {entry.contact ? <p className={styles.small}>Contact: {entry.contact}</p> : null}
          {entry.dhsRecord ? <p className={styles.small}>Department of Human Services record: {entry.dhsRecord}</p> : null}
        </li>)}
      </ul>
    </section>) : <p>No source matches these filters. <Link href="/community-outreach/sources" onClick={event => { event.preventDefault(); reset(); }}>Show all sources</Link>.</p>}
    <ButtonPager page={paging} label="Source pages" onPage={next => setPage(String(next))} />
  </>;
}
