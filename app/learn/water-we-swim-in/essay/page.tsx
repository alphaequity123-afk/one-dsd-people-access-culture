import { WATER_COURSE_TITLE } from "@/lib/content/water-we-swim-in";
import type { Metadata } from "next";
import Link from "@/components/app-link";
import { WATER_WHOLE_ESSAY_HREF, WATER_ESSAY_PARTS, WaterEssayContents, waterPartHref } from "@/components/cl-water";
import "@/components/community-editorial.css";
import "@/components/community-research-sections.css";
import { ResourceDownloads } from "@/components/resource-downloads";

export const metadata: Metadata = { title: `Essay (${WATER_COURSE_TITLE})` };

/** The essay's contents: one page per part, plus the whole essay on one page. */
export default function WaterEssayPage() {
  return <div className="community-editorial"><div className="community-index-layout community-research">
    <p className="community-eyebrow"><Link href="/learn">Learn</Link></p>
    <h1>Minnesota culture: the water we swim in</h1>
    <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this essay</summary><ResourceDownloads kind="water-we-swim-in" id="essay" noun="essay" /></details>
    <WaterEssayContents mode="pages" />
    <nav className="course-next" aria-label="Ways to read the essay">
      <Link href={waterPartHref(WATER_ESSAY_PARTS[0])}>Start reading: {WATER_ESSAY_PARTS[0].heading}</Link>
      <Link href={WATER_WHOLE_ESSAY_HREF}>Read the whole essay on one page</Link>
    </nav>
  </div></div>;
}
