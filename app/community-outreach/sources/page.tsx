import type { Metadata } from "next";
import Link from "next/link";
import { communityDesignEntries } from "@/lib/content/community-design";
import { isNativeCommunity } from "@/lib/content/hub/organizations";
import { SOURCING_CATEGORIES, SOURCING_CHECKED, SOURCING_USES, sourcingEntries } from "@/lib/content/hub/sourcing";
import styles from "../hub.module.css";

export const metadata: Metadata = {
  title: "Where to reach people",
  description: "Potential sources for recruitment, outreach and engagement in Minnesota: colleges, workforce programs, associations, media, community places and events.",
};

export default async function SourcesPage({ searchParams }: { searchParams: Promise<{ category?: string; use?: string; community?: string; q?: string }> }) {
  const { category = "", use = "", community = "", q = "" } = await searchParams;
  const titles = new Map(communityDesignEntries().map(entry => [entry.id, entry.title]));
  const all = sourcingEntries();
  const communities = [...new Set(all.flatMap(entry => entry.communities))].filter(id => !isNativeCommunity(id) && titles.has(id))
    .sort((a, b) => (titles.get(a) ?? a).localeCompare(titles.get(b) ?? b));
  const query = q.trim().toLowerCase();
  const shown = all.filter(entry =>
    (!category || entry.category === category) &&
    (!use || entry.uses.includes(use as (typeof SOURCING_USES)[number])) &&
    (!community || entry.communities.includes(community)) &&
    (!query || `${entry.name} ${entry.alsoKnownAs ?? ""} ${entry.what} ${entry.region} ${(entry.languages ?? []).join(" ")}`.toLowerCase().includes(query)));
  const groups = SOURCING_CATEGORIES.map(c => ({ ...c, entries: shown.filter(entry => entry.category === c.category) })).filter(c => c.entries.length);
  return <div className={styles.page}>
    <p className={styles.kicker}><Link href="/community-outreach">Community Outreach and Engagement</Link></p>
    <h1 className={styles.title}>Where to reach people</h1>
    <p className={styles.lede}>Places to find job candidates, share information and involve community members across Minnesota: colleges, workforce programs, professional associations, media, community places and events.</p>
    <p className={styles.note}>These are possible sources, not partners. Being listed does not mean a source works with the Department of Human Services or speaks for a community. Where a public record of a connection exists, the entry says so. Facts were checked on {SOURCING_CHECKED}; confirm current details before you rely on them.</p>
    <p>For Tribal colleges, Tribal Nations and Native American organizations, contact the Office of Indian Affairs and the Department of Human Services offices that handle Tribal relations and consultation. <Link href="/learn/tribal-referral">Native American and Tribal-specific guidance</Link>.</p>

    <form method="get" className={styles.filters} role="search" aria-label="Filter sources">
      <label>Type of source<select name="category" defaultValue={category}><option value="">All types</option>{SOURCING_CATEGORIES.map(c => <option key={c.category} value={c.category}>{c.title}</option>)}</select></label>
      <label>Use<select name="use" defaultValue={use}><option value="">All uses</option>{SOURCING_USES.map(u => <option key={u} value={u}>{u}</option>)}</select></label>
      <label>Community<select name="community" defaultValue={community}><option value="">All communities</option>{communities.map(id => <option key={id} value={id}>{titles.get(id)}</option>)}</select></label>
      <label>Search<input name="q" type="search" defaultValue={q} /></label>
      <button className={styles.button} type="submit">Show sources</button>
      {category || use || community || q ? <Link href="/community-outreach/sources">Clear filters</Link> : null}
    </form>
    <p aria-live="polite">{shown.length} of {all.length} sources</p>

    {groups.length ? groups.map(group => <section className={styles.section} key={group.category} aria-labelledby={`group-${group.category}`}>
      <h2 id={`group-${group.category}`}>{group.title}</h2>
      <p>{group.intro}</p>
      <ul className={styles.grid} style={{ listStyle: "none", padding: 0 }}>
        {group.entries.map(entry => <li className={styles.card} key={`${entry.name}-${entry.region}`}>
          <h3>{entry.website ? <a href={entry.website}>{entry.name}</a> : entry.name}</h3>
          <p className={styles.meta}>{[entry.kind, entry.region].filter(Boolean).join(" · ")}</p>
          <div>{entry.uses.map(u => <span className={styles.chip} key={u}>{u}</span>)}</div>
          <p>{entry.what}</p>
          <p className={styles.small}>{entry.howToUse}</p>
          {entry.languages?.length ? <p className={styles.small}>Languages: {entry.languages.join(", ")}</p> : null}
          {entry.communities.some(id => titles.has(id)) ? <p className={styles.small}>Communities: {entry.communities.filter(id => titles.has(id)).map(id => titles.get(id)).join(", ")}</p> : null}
          {entry.contact ? <p className={styles.small}>Contact: {entry.contact}</p> : null}
          {entry.dhsRecord ? <p className={styles.small}>Department of Human Services record: {entry.dhsRecord}</p> : null}
        </li>)}
      </ul>
    </section>) : <p>No source matches these filters. <Link href="/community-outreach/sources">Show all sources</Link>.</p>}
  </div>;
}
