import type { Metadata } from "next";
import Link from "@/components/app-link";
import { notFound } from "next/navigation";
import { WATER_ESSAY_HREF, WATER_ESSAY_PARTS, WATER_WHOLE_ESSAY_HREF, WaterEssayContents, WaterEssayPager, WaterEssayPartBody } from "@/components/cl-water";
import { WATER_COURSE_HREF, WATER_COURSE_TITLE } from "@/lib/content/water-we-swim-in";
import "@/components/community-editorial.css";
import "@/components/community-research-sections.css";
import { ResourceDownloads } from "@/components/resource-downloads";

export function generateStaticParams() {
  return WATER_ESSAY_PARTS.map(part => ({ part: part.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ part: string }> }): Promise<Metadata> {
  const { part: slug } = await params;
  const found = WATER_ESSAY_PARTS.find(item => item.slug === slug);
  return { title: found ? `${found.heading} (${WATER_COURSE_TITLE})` : WATER_COURSE_TITLE };
}

/** One part of the essay, with previous and next links and the full contents one click away. */
export default async function WaterEssayPartPage({ params }: { params: Promise<{ part: string }> }) {
  const { part: slug } = await params;
  const index = WATER_ESSAY_PARTS.findIndex(item => item.slug === slug);
  if (index < 0) notFound();
  const part = WATER_ESSAY_PARTS[index];
  return <div className="community-editorial"><div className="community-index-layout community-research">
    <p className="community-eyebrow"><Link href={WATER_COURSE_HREF}>{WATER_COURSE_TITLE}</Link>: <Link href={WATER_ESSAY_HREF}>essay</Link>, part {index + 1} of {WATER_ESSAY_PARTS.length}</p>
    <h1>Minnesota culture: the water we swim in</h1>
    <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this essay</summary><ResourceDownloads kind="water-we-swim-in" id="essay" noun="essay" /></details>
    <details className="course-more-item"><summary>In this essay</summary><WaterEssayContents mode="pages" current={part.slug} showTitle={false} /><p><Link href={WATER_WHOLE_ESSAY_HREF}>Read the whole essay on one page</Link></p></details>
    <WaterEssayPartBody part={part} />
    <WaterEssayPager index={index} />
  </div></div>;
}
