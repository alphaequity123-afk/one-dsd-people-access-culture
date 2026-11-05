import Link from "next/link";
import { LiveSearchForm } from "./live-search-form";
import { notFound } from "next/navigation";
import { communityDesignEntries } from "@/lib/content/community-design";
import { FEATURED_COMMUNITY_IDS, NATIVE_DEFERENCE_COMMUNITY_IDS } from "@/lib/content/community-presentation";
import { communityReadingSurfaceId } from "@/lib/content/community-reading-surface";
import { getBrief } from "@/lib/content/briefs";
import { communityBriefSurfaceId, stringValue } from "@/lib/content/staff-surface-registry";
import { communityReading } from "@/lib/content/community-design";
import { EditableSurfaceRegion, prepareEditableSurface } from "./editable-surface";
import "./community-editorial.css";
import { ExplainerVideo } from "@/components/explainer-video";
import { ToolDecisionQuestions } from "@/components/tool-decision-questions";

export async function CommunityDesignIndex({ query = "" }: { query?: string }) {
  const pageSurface = await prepareEditableSurface("communities.index");
  if (!pageSurface.available && !pageSurface.canEdit) notFound();
  const preparedEntries = await Promise.all(communityDesignEntries().map(async entry => {
    const raw = getBrief(entry.id);
    const [briefSurface, readingSurface] = await Promise.all([
      raw ? prepareEditableSurface(communityBriefSurfaceId(entry.id), { includeOwner: false }) : Promise.resolve(null),
      communityReading(entry.id) ? prepareEditableSurface(communityReadingSurfaceId(entry.id), { includeOwner: false }) : Promise.resolve(null),
    ]);
    // A withdrawal must remove both the link and its title from staff browse/search.
    if ((briefSurface && !briefSurface.available) || (readingSurface && !readingSurface.available)) return null;
    const editedTitle = briefSurface ? stringValue(briefSurface.values, "title") : undefined;
    return { ...entry, title: editedTitle && editedTitle !== raw?.title ? editedTitle : readingSurface ? stringValue(readingSurface.values, "title") : entry.title };
  }));
  const entries = preparedEntries.filter(entry => entry !== null);
  // Retain the approved new introduction until the owner actually changes the
  // existing wording area; its older seed copy is not the new design's default.
  const copy = (key: string, fallback: string) => {
    const value = stringValue(pageSurface.values, key);
    const original = stringValue(pageSurface.definition.approvedValues, key);
    return value !== original ? value : fallback;
  };
  const normalized = query.trim().toLocaleLowerCase();
  const matching = entries.filter(b => `${b.title} ${b.id}`.toLocaleLowerCase().includes(normalized));
  const featured = matching.filter(b => FEATURED_COMMUNITY_IDS.some(id => id === b.id));
  const more = matching.filter(b => !FEATURED_COMMUNITY_IDS.some(id => id === b.id));
  const list = (items: typeof entries) => <ul className="community-directory">{items.map(b => <li key={b.id}><Link prefetch={false} href={`/minnesota-communities/${b.id}`}>{b.title}</Link>{(NATIVE_DEFERENCE_COMMUNITY_IDS as readonly string[]).includes(b.id) ? <span className="community-in-development-tag"> (we defer to the Office of Indian Affairs and the Department of Human Services offices that handle Tribal relations and consultation)</span> : null}</li>)}</ul>;
  return <EditableSurfaceRegion surface={pageSurface}><div className="community-editorial">
    <div className="community-index-layout">
      <p className="community-eyebrow">People, place, and perspective</p>
      <h1>{copy("introTitle", "Minnesota Communities")}</h1><p className="community-opening">{copy("introLede", "Minnesota's communities carry long histories, real contributions and everyday experiences that shape how people meet public services. These briefs offer that context so you can ask better questions and plan for access, never to describe any one person.")}</p><ExplainerVideo id="community-briefs" />
      <LiveSearchForm action="/minnesota-communities" className="community-search"><label htmlFor="community-query">{copy("searchLabel", "Find a community")}</label><div><input id="community-query" type="search" name="q" defaultValue={query} placeholder={copy("searchExample", "") || undefined} /><button type="submit">{copy("searchButton", "Search")}</button>{normalized ? <Link href="/minnesota-communities">Clear search</Link> : null}</div></LiveSearchForm>
      <p>{normalized ? `${matching.length} matching ${matching.length === 1 ? "brief" : "briefs"}` : `${entries.length} community and place briefs`}</p>
      {normalized ? list(matching) : <><h2>Explore communities</h2>{list(featured)}<details className="community-more"><summary>All other communities and places ({more.length})</summary>{list(more)}</details></>}
      {normalized && !matching.length ? <p>No community matched that name. You might try a different spelling, or browse the full collection.</p> : null}
      <p className="mt-8"><Link href="/minnesota-communities/calendar">Open the cultural calendar</Link> for observances, festivals and remembrances across these communities.</p>
      <p><Link href="/community-outreach">Community Outreach and Engagement</Link>: find organizations connected with the Disability Services Division, compare counties, and plan an engagement.</p>
      <ToolDecisionQuestions tool="minnesota-communities" className="mt-8" />
    </div>
  </div></EditableSurfaceRegion>;
}
