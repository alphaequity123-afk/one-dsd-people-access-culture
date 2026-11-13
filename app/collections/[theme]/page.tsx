import type { Metadata } from "next";
import Link from "@/components/app-link";
import { notFound } from "next/navigation";
import { existsSync } from "node:fs";
import path from "node:path";
import { ResourceThemePathway } from "@/components/resource-theme-pathway";
import { prepareEditableSurface } from "@/lib/content/prepare-editable-surface";
import { culturalIntelligenceHubAvailable } from "@/lib/content/cultural-intelligence-publication";
import { courseContentItem, courseHref, publishedCourses } from "@/lib/content/courses/published";
import { readingHref, searchReadings } from "@/lib/content/reading-collection";
import { selfDirectedHref, selfDirectedItems } from "@/lib/content/self-directed";
import { matchesSourceTheme } from "@/lib/content/source-organization";
import { registerSourcesForStaff, sourceAnchor } from "@/lib/content/source-register";
import { loadStaffContentSnapshot } from "@/lib/content/staff-publications";
import { featuredThemeItems, findTheme, THEME_CONTEXT_LINKS } from "@/lib/content/theme-collections";
import { requestedContentScope } from "@/lib/product/request-context";
import video from "@/lib/program/equity-video-media.json";
import base from "@/app/learn/collaboration/collaboration.module.css";
import styles from "@/components/collections.module.css";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ theme: string }> }): Promise<Metadata> {
  const theme = findTheme((await params).theme);
  return { title: theme ? `${theme.title} | Theme collection` : "Theme collection" };
}

export default async function ThemeCollectionPage({ params }: { params: Promise<{ theme: string }> }) {
  const theme = findTheme((await params).theme);
  if (!theme) notFound();
  const scope = await requestedContentScope();
  const [{ items: baseItems }, courses, communities, programs, sources, cultural] = await Promise.all([
    loadStaffContentSnapshot({ scope }), publishedCourses(scope),
    prepareEditableSurface("communities.index", { scope, includeOwner: false }).catch(() => null),
    prepareEditableSurface("one-dsd.program-overview", { scope, includeOwner: false }).catch(() => null),
    prepareEditableSurface("sources.page", { scope, includeOwner: false }).catch(() => null),
    culturalIntelligenceHubAvailable(scope),
  ]);
  const items = [...baseItems, ...selfDirectedItems(), ...courses.map(({ pack }) => courseContentItem(pack, { includeLessonBody: false }))];
  const featured = featuredThemeItems(items, theme.id);
  const readings = searchReadings("", theme.id, "").slice(0, 3);
  const sourceExamples = sources?.available ? registerSourcesForStaff().flatMap(group => group.sources)
    .filter(source => source.kind === "external" && source.href && matchesSourceTheme(source, theme.id)).slice(0, 3) : [];
  const context = THEME_CONTEXT_LINKS[theme.id].filter(link => !link.gate
    || (link.gate === "communities" && communities?.available)
    || (link.gate === "programs" && programs?.available)
    || (link.gate === "cultural" && cultural));
  const videoFile = path.join(process.cwd(), "public", video.companion.src.replace(/^\/+/, ""));
  const videoAvailable = existsSync(videoFile);
  const itemHref = (id: string) => selfDirectedHref(id) ?? (id.startsWith("course-") ? courseHref(id.slice(7)) : `/library/${encodeURIComponent(id)}`);
  return <div className={base.page}><div className={base.content}>
    <p className={base.back}><Link href="/collections">All themes</Link></p>
    <header className={base.intro}><p className={base.eyebrow}>Explore by theme</p><h1>{theme.title}</h1><p className={base.lede}>{theme.description}</p><p>Choose a way to learn or begin with a practical question. This is a selection from available material, not a claim that every relevant resource appears here.</p></header>
    <ResourceThemePathway theme={theme.id} items={items} className={styles.section} />
    <section className={styles.section} aria-labelledby="theme-formats-title"><h2 id="theme-formats-title">Explore this theme in different ways</h2>
      <ul className={styles.doors}>
        <li><Link className={styles.door} href={`/learn?theme=${theme.id}`}><span className={styles.doorTitle}>Courses and learning</span><span>Browse learning and practice connected with this subject.</span><span className={styles.doorAction}>Explore learning</span></Link></li>
        <li><Link className={styles.door} href={`/library?theme=${theme.id}`}><span className={styles.doorTitle}>Tools and guidance</span><span>Find related job aids, practical resources and other library items.</span><span className={styles.doorAction}>Explore the library</span></Link></li>
        {sources?.available && <li><Link className={styles.door} href={`/learn/sources?theme=${theme.id}`}><span className={styles.doorTitle}>Research and sources</span><span>Follow references used in the work and check their context.</span><span className={styles.doorAction}>Explore sources</span></Link></li>}
        <li><Link className={styles.door} href={`/learn/readings?theme=${theme.id}`}><span className={styles.doorTitle}>Books and ideas</span><span>Read summaries and questions for reflection.</span><span className={styles.doorAction}>Explore readings</span></Link></li>
        <li><Link className={styles.door} href={`/audio-library?theme=${theme.id}`}><span className={styles.doorTitle}>Listening</span><span>Find recordings and course listening where available.</span><span className={styles.doorAction}>Explore audio</span></Link></li>
        {videoAvailable && <li><Link className={styles.door} href="/learn/equity-in-practice#put-it-into-practice"><span className={styles.doorTitle}>Watch a DSD example</span><span>A shared video connects program-wide equity goals with four work situations.</span><span className={styles.doorAction}>Watch the example</span></Link></li>}
      </ul>
    </section>
    {featured.learning.length > 0 && <section className={styles.section} aria-labelledby="theme-learning-title"><h2 id="theme-learning-title">Learning to explore</h2><ul className={styles.startList}>{featured.learning.map(item => <li key={item.id}><Link href={itemHref(item.id)}>{item.title}</Link></li>)}</ul></section>}
    {featured.practical.length > 0 && <section className={styles.section} aria-labelledby="theme-tools-title"><h2 id="theme-tools-title">Tools and guidance to explore</h2><ul className={styles.startList}>{featured.practical.map(item => <li key={item.id}><Link href={itemHref(item.id)}>{item.title}</Link></li>)}</ul></section>}
    {readings.length > 0 && <section className={styles.section} aria-labelledby="theme-readings-title"><h2 id="theme-readings-title">Reading to explore</h2><ul className={styles.startList}>{readings.map(item => <li key={item.id}><Link href={readingHref(item.id)}>{item.title}</Link> — {item.authors}</li>)}</ul></section>}
    {sourceExamples.length > 0 && <section className={styles.section} aria-labelledby="theme-sources-title"><h2 id="theme-sources-title">Sources to explore</h2><ul className={styles.startList}>{sourceExamples.map(source => <li key={source.sourceId}><Link href={`/learn/sources?theme=${theme.id}#${sourceAnchor(source)}`}>{source.title}</Link></li>)}</ul></section>}
    {context.length > 0 && <section className={styles.section} aria-labelledby="theme-context-title"><h2 id="theme-context-title">Connect with DSD and community work</h2><ul className={styles.startList}>{context.map(link => <li key={link.href}><Link href={link.href}>{link.title}</Link> — {link.description}</li>)}</ul></section>}
    <aside className={base.continue}><h2>Other ways to start</h2><p><Link href="/learn/collections">Course collections</Link><Link href="/leading">Leadership decisions</Link><Link href="/practice">Practical tasks</Link><Link href="/support/right-person">Find a person or office</Link></p></aside>
  </div></div>;
}
