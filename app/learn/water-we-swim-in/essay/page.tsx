import type { Metadata } from "next";
import Link from "next/link";
import { Disclosure } from "@/components/community-research-sections";
import { ResearchMarkdown } from "@/components/research-markdown";
import { WATER_COURSE_HREF, WATER_COURSE_TITLE, WATER_ESSAY } from "@/lib/content/water-we-swim-in";
import "@/components/community-editorial.css";
import "@/components/community-research-sections.css";

export const metadata: Metadata = { title: `Essay (${WATER_COURSE_TITLE})` };

export default function WaterEssayPage() {
  return <div className="community-editorial"><div className="community-index-layout community-research">
    <p className="community-eyebrow"><Link href={WATER_COURSE_HREF}>{WATER_COURSE_TITLE}</Link></p>
    <h1>Minnesota culture: the water we swim in</h1>
    {WATER_ESSAY.sections.map((section, index) => <Disclosure key={section.id} id={section.id} level={3} title={section.heading} open={index === 0}><ResearchMarkdown markdown={section.body} /></Disclosure>)}
    {WATER_ESSAY.limits ? <Disclosure level={3} title="What the sources could not establish"><ResearchMarkdown markdown={WATER_ESSAY.limits} /></Disclosure> : null}
    {WATER_ESSAY.sources ? <Disclosure level={3} title="Sources"><ResearchMarkdown markdown={WATER_ESSAY.sources} /></Disclosure> : null}
  </div></div>;
}
