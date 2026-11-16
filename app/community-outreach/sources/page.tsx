import { SourceFinder } from "@/components/source-finder";
import type { Metadata } from "next";
import Link from "@/components/app-link";
import { communityDesignEntries } from "@/lib/content/community-design";
import { isNativeCommunity } from "@/lib/content/hub/organizations";
import { SOURCING_CATEGORIES, SOURCING_CHECKED, SOURCING_USES, sourcingEntries } from "@/lib/content/hub/sourcing";
import styles from "../hub.module.css";
import { ResourceDownloads } from "@/components/resource-downloads";

export const metadata: Metadata = {
  title: "Where to reach people",
  description: "Potential sources for recruitment, outreach and engagement in Minnesota: colleges, workforce programs, associations, media, community places and events.",
};

export default async function SourcesPage({ searchParams }: { searchParams: Promise<{ category?: string; use?: string; community?: string; q?: string; page?: string }> }) {
  const { category = "", use = "", community = "", q = "", page: pageNumber } = await searchParams;
  const titles = new Map(communityDesignEntries().map(entry => [entry.id, entry.title]));
  const all = sourcingEntries();
  const communities = [...new Set(all.flatMap(entry => entry.communities))].filter(id => !isNativeCommunity(id) && titles.has(id))
    .sort((a, b) => (titles.get(a) ?? a).localeCompare(titles.get(b) ?? b));
  return <div className={styles.page}>
    <p className={styles.kicker}><Link href="/community-outreach">Community Outreach and Engagement</Link></p>
    <h1 className={styles.title}>Where to reach people</h1>
    <p className={styles.lede}>Places to find job candidates, share information and involve community members across Minnesota: colleges, workforce programs, professional associations, media, community places and events.</p>
    <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="community-outreach" id="sources" noun="source list" /></details>
    <p className={styles.note}>These are possible sources, not partners. Being listed does not mean a source works with the Department of Human Services or speaks for a community. Where a public record of a connection exists, the entry says so. Facts were checked on {SOURCING_CHECKED}; confirm current details before you rely on them.</p>
    <p>For Tribal colleges, Tribal Nations and Native American organizations, contact the Office of Indian Affairs and the Department of Human Services offices that handle Tribal relations and consultation. <Link href="/learn/tribal-referral">Native American and Tribal-specific guidance</Link>.</p>

    <SourceFinder all={all} categories={SOURCING_CATEGORIES.map(({ category, title, intro }) => ({ category, title, intro }))} uses={SOURCING_USES} communities={communities} titles={Object.fromEntries(titles)}
      initial={{ category, use, community, q: q.trim().slice(0, 200), page: pageNumber ?? "" }} />
  </div>;
}
