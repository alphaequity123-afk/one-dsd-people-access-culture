import { WATER_COURSE_TITLE } from "@/lib/content/water-we-swim-in";
import type { Metadata } from "next";
import Link from "@/components/app-link";
import { WATER_ESSAY_HREF, WATER_ESSAY_PARTS, WaterEssayContents, WaterEssayPartBody } from "@/components/cl-water";
import "@/components/community-editorial.css";
import "@/components/community-research-sections.css";
import { ResourceDownloads } from "@/components/resource-downloads";

export const metadata: Metadata = { title: `Whole essay (${WATER_COURSE_TITLE})` };

/** Every part of the essay on one page, with a contents list of anchors. */
export default function WaterWholeEssayPage() {
  return <div className="community-editorial"><div className="community-index-layout community-research">
    <p className="community-eyebrow"><Link href="/learn">Learn</Link>: <Link href={WATER_ESSAY_HREF}>essay contents</Link></p>
    <h1>Minnesota culture: the water we swim in</h1>
    <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this essay</summary><ResourceDownloads kind="water-we-swim-in" id="essay" noun="essay" /></details>
    <WaterEssayContents mode="anchors" />
    {WATER_ESSAY_PARTS.map(part => <WaterEssayPartBody key={part.slug} part={part} />)}
  </div></div>;
}
