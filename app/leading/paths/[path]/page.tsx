import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadingPathPlace, type LeadingPathRow } from "@/components/leading-path-place";
import { LEADING_LABEL, collectionItem, collectionItemHref, leadingPath, pathHours } from "@/lib/content/collections";
import { publishedCourses } from "@/lib/content/courses/published";
import { requestedContentScope } from "@/lib/product/request-context";
import base from "@/app/learn/collaboration/collaboration.module.css";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ path: string }> }): Promise<Metadata> {
  const path = leadingPath((await params).path);
  return path ? { title: `${path.title}: a suggested path`, description: path.description } : {};
}

export default async function LeadingPathPage({ params }: { params: Promise<{ path: string }> }) {
  const path = leadingPath((await params).path);
  if (!path) notFound();
  const scope = await requestedContentScope();
  const published = new Set((await publishedCourses(scope)).map(({ pack }) => pack.course.id));
  const rows: LeadingPathRow[] = path.courseIds.map(id => {
    const item = collectionItem(id);
    if (!item) return { id, title: id };
    return { id, title: item.title, minutes: item.minutes, required: item.required, href: item.kind !== "course" || published.has(id) ? collectionItemHref(item) : undefined };
  });
  return <div className={base.page}><div className={base.content}>
    <p className={base.back}><Link href="/leading/paths">Suggested paths</Link></p>
    <header className={base.intro}>
      <p className={base.eyebrow}>{LEADING_LABEL} · optional</p>
      <h1>{path.title}</h1>
      <p className={base.lede}>{path.description}</p>
      <p>{path.courseIds.length} courses, about {pathHours(path)} hours in all, at your own pace. This is a suggestion. Start anywhere and skip anything. Your place stays in this browser, and anyone using this computer could see it. Nothing is sent to a supervisor or employer. <Link href="/leading/how-this-works">How this works</Link>.</p>
    </header>
    <LeadingPathPlace pathId={path.slug} rows={rows} />
  </div></div>;
}
