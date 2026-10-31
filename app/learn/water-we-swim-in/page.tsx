import type { Metadata } from "next";
import Link from "next/link";
import { WATER_COURSE_HREF, WATER_COURSE_TITLE, WATER_MODULES, WATER_SUPPORT } from "@/lib/content/water-we-swim-in";
import "@/components/community-editorial.css";
import "@/components/community-research-sections.css";

export const metadata: Metadata = { title: WATER_COURSE_TITLE };

export default function WaterCoursePage() {
  return <div className="community-editorial"><div className="community-index-layout community-research">
    <p className="community-eyebrow"><Link href="/learn">Learn</Link></p>
    <h1>{WATER_COURSE_TITLE}</h1>
    <p className="community-opening">A voluntary course on Minnesota&apos;s mainstream culture: its real strengths, its blind spots, and how it shapes our work with Minnesotans of other cultures and with disabled people and their families.</p>
    <p>There are six modules of about 20 minutes each. You can take them in any order, and nothing is collected or graded.</p>
    <h2>Modules</h2>
    <ol>{WATER_MODULES.map(module => <li key={module.slug}><Link href={`${WATER_COURSE_HREF}/${module.slug}`}>{module.title}</Link><p>{module.goal} About {module.minutes} minutes.</p></li>)}</ol>
    <h2>Go further</h2>
    <p><Link href={`${WATER_COURSE_HREF}/essay`}>Read the full essay</Link>, with every source the course draws on.</p>
    <p>{WATER_SUPPORT}</p>
  </div></div>;
}
