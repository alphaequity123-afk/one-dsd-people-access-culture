import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ResearchMarkdown } from "@/components/research-markdown";
import { WATER_COURSE_HREF, WATER_COURSE_TITLE, WATER_MODULES, WATER_SUPPORT } from "@/lib/content/water-we-swim-in";
import "@/components/community-editorial.css";
import "@/components/community-research-sections.css";

export async function generateMetadata({ params }: { params: Promise<{ module: string }> }): Promise<Metadata> {
  const { module: slug } = await params;
  const found = WATER_MODULES.find(item => item.slug === slug);
  return { title: found ? `${found.title} (${WATER_COURSE_TITLE})` : WATER_COURSE_TITLE };
}

export default async function WaterModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module: slug } = await params;
  const index = WATER_MODULES.findIndex(item => item.slug === slug);
  if (index < 0) notFound();
  const current = WATER_MODULES[index];
  const previous = WATER_MODULES[index - 1];
  const next = WATER_MODULES[index + 1];
  return <div className="community-editorial"><div className="community-index-layout community-research">
    <p className="community-eyebrow"><Link href={WATER_COURSE_HREF}>{WATER_COURSE_TITLE}</Link>: module {current.number} of {WATER_MODULES.length}</p>
    <h1>{current.title}</h1>
    <p className="community-opening">{current.goal}</p>
    <ResearchMarkdown markdown={current.body} notesKey={`water-we-swim-in-notes-${current.number}`} />
    <p>{WATER_SUPPORT}</p>
    <nav className="course-next" aria-label="Course modules">
      {previous ? <Link href={`${WATER_COURSE_HREF}/${previous.slug}`}>Previous: {previous.title}</Link> : <Link href={WATER_COURSE_HREF}>Course overview</Link>}
      {next ? <Link href={`${WATER_COURSE_HREF}/${next.slug}`}>Next: {next.title}</Link> : <Link href={`${WATER_COURSE_HREF}/essay`}>Read the full essay</Link>}
    </nav>
  </div></div>;
}
