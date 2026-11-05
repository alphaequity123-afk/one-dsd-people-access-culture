import type { Metadata } from "next";
import Link from "next/link";
import CountyMap from "@/components/hub/county-map";
import { GROUP_IDS, MEASURE_IDS, type GroupId, type MeasureId } from "@/lib/content/hub/county-data";
import styles from "../hub.module.css";

export const metadata: Metadata = {
  title: "Minnesota county map",
  description: "Compare each Minnesota county's population with the people receiving home and community-based services, and earned income, by race and ethnicity.",
};

export default async function CountyMapPage({ searchParams }: { searchParams: Promise<{ group?: string; measure?: string }> }) {
  const { group, measure } = await searchParams;
  const initialGroup = (GROUP_IDS as readonly string[]).includes(group ?? "") ? group as GroupId : "black";
  const initialMeasure = (MEASURE_IDS as readonly string[]).includes(measure ?? "") ? measure as MeasureId : "comparison";
  return <div className={styles.page}>
    <p className={styles.kicker}><Link href="/community-outreach">Community Outreach and Engagement</Link></p>
    <h1 className={styles.title}>Minnesota county map</h1>
    <p className={styles.lede}>Compare each county&apos;s population with the people receiving home and community-based services, by race and ethnicity. A difference is a question to look into, not an explanation.</p>
    <CountyMap initialGroup={initialGroup} initialMeasure={initialMeasure} />
    <p className={styles.section}><Link href="/community-outreach/county-agencies">Find the county agency that serves people in each county</Link> · <Link href="/minnesota-communities">Minnesota Communities</Link> · <Link href="/community-outreach/plan">Plan an engagement</Link></p>
  </div>;
}
