import Link from "@/components/app-link";
import { CommunityDirectory } from "./community-directory";
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
import { WATER_RESOURCE_COLLECTION_PATH, WATER_RESOURCE_COLLECTION_TITLE } from "@/lib/learning/water-resource-collection";

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
  return <EditableSurfaceRegion surface={pageSurface}><div className="community-editorial">
    <div className="community-index-layout">
      <p className="community-eyebrow">People, place, and perspective</p>
      <h1>{copy("introTitle", "Minnesota Communities")}</h1><p className="community-opening">{copy("introLede", "Minnesota's communities carry long histories, real contributions and everyday experiences that shape how people meet public services. These briefs offer that context so you can ask better questions and plan for access, never to describe any one person.")}</p>
      <p className="community-opening">Start with <Link href={WATER_RESOURCE_COLLECTION_PATH}>{WATER_RESOURCE_COLLECTION_TITLE}</Link>.</p>
      {/* Typed words narrow the list in the page and never go into the address (components/community-directory.tsx). */}
      <CommunityDirectory entries={entries.map(b => ({ id: b.id, title: b.title, native: (NATIVE_DEFERENCE_COMMUNITY_IDS as readonly string[]).includes(b.id) }))} featuredIds={FEATURED_COMMUNITY_IDS}
        initialQuery={query.trim().slice(0, 200)} copy={{ searchLabel: copy("searchLabel", "Find a community"), searchExample: copy("searchExample", ""), searchButton: copy("searchButton", "Search") }}
        whenBrowsing={<ExplainerVideo id="community-briefs" />} />
      <p className="mt-8"><Link href="/minnesota-communities/calendar">Open the cultural calendar</Link> for observances, festivals and remembrances across these communities.</p>
      <p><Link href="/community-outreach">Community Outreach and Engagement</Link>: find organizations connected with the Disability Services Division, compare counties, and plan an engagement.</p>
      <ToolDecisionQuestions tool="minnesota-communities" className="mt-8" />
    </div>
  </div></EditableSurfaceRegion>;
}
