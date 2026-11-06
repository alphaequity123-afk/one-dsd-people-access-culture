import type { Metadata } from "next";
import Link from "next/link";
import { Disclosure } from "@/components/community-research-sections";
import { ResearchMarkdown } from "@/components/research-markdown";
import { WATER_COURSE_HREF, WATER_COURSE_TITLE, WATER_ESSAY } from "@/lib/content/water-we-swim-in";
import "@/components/community-editorial.css";
import "@/components/community-research-sections.css";
import { ResourceDownloads } from "@/components/resource-downloads";

export const metadata: Metadata = { title: `Essay (${WATER_COURSE_TITLE})` };

export default function WaterEssayPage() {
  return <div className="community-editorial"><div className="community-index-layout community-research">
    <p className="community-eyebrow"><Link href={WATER_COURSE_HREF}>{WATER_COURSE_TITLE}</Link></p>
    <h1>Minnesota culture: the water we swim in</h1>
    <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this essay</summary><ResourceDownloads kind="water-we-swim-in" id="essay" noun="essay" /></details>
    {WATER_ESSAY.sections.map((section, index) => <Disclosure key={section.id} id={section.id} level={3} title={section.heading} open={index === 0}><ResearchMarkdown markdown={section.body} /></Disclosure>)}
    {WATER_ESSAY.limits ? <Disclosure level={3} title="What the sources could not establish"><ResearchMarkdown markdown={WATER_ESSAY.limits} /></Disclosure> : null}
    {WATER_ESSAY.sources ? <Disclosure level={3} title="Sources"><ResearchMarkdown markdown={WATER_ESSAY.sources} /></Disclosure> : null}
  </div></div>;
}
