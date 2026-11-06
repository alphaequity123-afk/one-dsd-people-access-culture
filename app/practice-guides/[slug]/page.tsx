import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { practiceGuides } from "@/lib/program/dsd-practice-guides";
import { courseHref, publishedCourses } from "@/lib/content/courses/published";
import { requestedContentScope } from "@/lib/product/request-context";
import { collaborationCourses, collaborationHref } from "@/lib/learning/collaboration-collection";
import { PageContents, type PageContentsItem } from "@/components/page-contents";
import styles from "../practice-guide-layout.module.css";
import { ResourceDownloads } from "@/components/resource-downloads";

const relatedCollaboration: Record<string, readonly { id: string; purpose: string }[]> = {
  "clearer-processes": [
    { id: "dc-t75-handoffs-that-work", purpose: "Make the next step clear when work moves from one person or team to another." },
    { id: "dc-t74-shared-ownership-of-cross-unit-work", purpose: "Clarify who contributes, who follows through, and how teams stay connected." },
  ],
  "inclusive-meetings": [
    { id: "dc-t76-cross-unit-communication-habits", purpose: "Carry the discussion into clear follow-up and communication across teams." },
  ],
};

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return practiceGuides.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: practiceGuides.find(guide => guide.slug === slug)?.title ?? "Practice guide" };
}

export default async function PracticeGuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = practiceGuides.find(item => item.slug === slug);
  if (!guide) notFound();
  const related = relatedCollaboration[slug] ?? [];
  const available = related.length
    ? collaborationCourses((await publishedCourses(await requestedContentScope())).map(row => row.pack))
    : [];
  const learning = related.flatMap(item => {
    const row = available.find(candidate => candidate.pack.course.id === item.id);
    return row ? [{ ...item, title: row.pack.course.title }] : [];
  });
  const contents: PageContentsItem[] = [
    ...guide.steps.map((step, index) => ({ href: `#guide-step-${index + 1}` as const, label: step.title })),
    { href: "#guide-example", label: "An example" },
    { href: "#guide-review", label: "Bring it into your work" },
    { href: "#guide-resources", label: "Related guidance" },
  ];
  return <article className={`dsd-shell dsd-stage dsd-guide ${styles.guide}`}>
    <header className="dsd-page-heading"><p className="dsd-eyebrow">{guide.purpose}</p><h1>{guide.title}.</h1><p className="dsd-lede">{guide.introduction}</p><details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="equity-review" id={`practice-guide~${guide.slug}`} noun="practice guide" /></details></header>
    <PageContents items={contents}>
      <ol className="dsd-guide-steps">{guide.steps.map((step, index) => <li key={step.title}><span className="dsd-guide-step-number" aria-hidden="true">0{index + 1}</span><div><h2 id={`guide-step-${index + 1}`}>{step.title}</h2><p>{step.body}</p><p className="dsd-guide-question">{step.question}</p></div></li>)}</ol>
        <section className="dsd-guide-example" aria-labelledby="guide-example"><p className="dsd-eyebrow">An example to consider</p><h2 id="guide-example">What this could look like</h2><p>{guide.example}</p></section>
        <section className="dsd-guide-review" aria-labelledby="guide-review"><h2 id="guide-review">Bring it back to your work</h2><p>{guide.review}</p><Link className="dsd-primary-link" href="/my-work/plan">Open your practice plans →</Link><p>After the appropriate decision and use of an approach, <Link href="/program/reflection">record an observation and its limits</Link>. Bring what you learn back to the people who contributed and to the next review.</p></section>
      <section className={styles.resources} aria-labelledby="guide-resources"><h2 id="guide-resources">Keep the guidance close</h2><p>Use these resources to prepare for the task in front of you. It supports preparation and reflection; it does not replace policy or required approval.</p><ul className="dsd-guide-resources">{guide.resources.map(resource => <li key={resource.href}><Link href={resource.href}>{resource.title}</Link><p>{resource.purpose}</p></li>)}</ul>
        {learning.length > 0 && <section aria-labelledby="guide-collaboration"><h3 id="guide-collaboration">Practice working across teams</h3><ul className="dsd-guide-resources">{learning.map(course => <li key={course.id}><Link href={courseHref(course.id)}>{course.title}</Link><p>{course.purpose}</p></li>)}</ul><Link href={collaborationHref({ focus: "cross-unit" })}>Explore more cross-unit learning →</Link></section>}
      </section>
    </PageContents>
    <nav className="dsd-next" aria-label="Related resources"><Link href="/program/practice">← Put equity into practice</Link><Link href="/library">Find more learning and tools →</Link></nav>
  </article>;
}
