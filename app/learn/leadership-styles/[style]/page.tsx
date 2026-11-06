import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Block, BoundaryNote, Bullets, PathwayEyebrow, PathwayShell, QuoteCard, SectionNav, Steps } from "@/components/leadership-styles-pathway";
import { LeadershipStyleVideo } from "@/components/leadership-style-video";
import {
  COMMON_SCENARIO, LEADERSHIP_PATHWAY_HREF, LEADERSHIP_PATHWAY_PAGES, LEADERSHIP_PATHWAY_TITLE, LEADERSHIP_STYLE_LESSONS,
  STYLE_GROUP_LABEL, STYLE_SECTIONS, leadershipStyle, leadershipStyleHref,
} from "@/lib/content/leadership-styles-pathway";
import styles from "../leadership-styles.module.css";
import { ResourceDownloads } from "@/components/resource-downloads";

export const dynamicParams = false;

export function generateStaticParams() {
  return LEADERSHIP_STYLE_LESSONS.map(lesson => ({ style: lesson.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ style: string }> }): Promise<Metadata> {
  const { style } = await params;
  const lesson = leadershipStyle(style);
  return lesson
    ? { title: `${lesson.name} (${LEADERSHIP_PATHWAY_TITLE})`, description: `${lesson.tagline}. How this approach handles conflict, and how it can promote or undermine equity and inclusion.` }
    : { title: LEADERSHIP_PATHWAY_TITLE };
}

export default async function LeadershipStylePage({ params }: { params: Promise<{ style: string }> }) {
  const { style } = await params;
  const index = LEADERSHIP_STYLE_LESSONS.findIndex(lesson => lesson.slug === style);
  if (index < 0) notFound();
  const lesson = LEADERSHIP_STYLE_LESSONS[index];
  const previous = LEADERSHIP_STYLE_LESSONS[index - 1];
  const next = LEADERSHIP_STYLE_LESSONS[index + 1];
  return <PathwayShell
    eyebrow={<PathwayEyebrow>lesson {index + 1} of {LEADERSHIP_STYLE_LESSONS.length}</PathwayEyebrow>}
    title={lesson.name}
    intro={<p>{lesson.tagline}. <Link className="underline" href={`${LEADERSHIP_PATHWAY_HREF}#group-${lesson.group}`}>{STYLE_GROUP_LABEL[lesson.group]}</Link>.</p>}
  >
    <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this lesson</summary><ResourceDownloads kind="leadership-styles" id={lesson.slug} noun="lesson" /></details>
    <SectionNav label="Lesson sections" items={STYLE_SECTIONS.map(section => ({ href: `#${section.id}`, title: section.title }))} />

    <Block id="how-it-works" title="Working definition and boundaries">
      <div className={styles.prose}>{lesson.definition.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
      <h3>What it is not</h3>
      <Bullets items={lesson.isNot} />
      {lesson.legacyVideo && <LeadershipStyleVideo style={lesson.legacyVideo} title={lesson.name} />}
    </Block>

    <Block id="common-scenario" title={`The common scenario: “${COMMON_SCENARIO.title}”`}>
      <details className={styles.callout}>
        <summary className="cursor-pointer font-semibold">Read the fictional scenario</summary>
        {COMMON_SCENARIO.situation.map(paragraph => <p key={paragraph} className="mt-3">{paragraph}</p>)}
      </details>
      <p className={styles.prose}>Here is how this approach might respond. These responses illustrate tendencies and choices, not scripts that predict how anyone would act.</p>
      <div className={styles.quotes}>
        <QuoteCard kind="stronger" label="A stronger version" quote={lesson.stronger.quote} why={lesson.stronger.why} />
        <QuoteCard kind="harmful" label="A harmful version" quote={lesson.harmful.quote} why={lesson.harmful.why} />
      </div>
    </Block>

    <Block id="conflict" title={`How it resolves another conflict: ${lesson.conflict.title}`}>
      <p className={styles.callout}>{lesson.conflict.situation}</p>
      <h3>How this approach tends to handle it</h3>
      <p className={styles.prose}>{lesson.conflict.tendency}</p>
      <h3>A stronger resolution</h3>
      <p className={styles.prose}>{lesson.conflict.stronger}</p>
    </Block>

    <Block id="equity" title="How it can promote or undermine equity and inclusion">
      <h3>Where it can promote equity and inclusion</h3>
      <Bullets items={lesson.promotes} />
      <h3>Where it can undermine them</h3>
      <Bullets items={lesson.undermines} />
      <h3>Racial equity</h3>
      <p className={styles.prose}>{lesson.race} <Link className="underline" href={LEADERSHIP_PATHWAY_PAGES.race.href}>Read more about race as a cross-cutting factor</Link>.</p>
      <h3>Equity assessment</h3>
      <p className={styles.assessment}>{lesson.assessment.label}</p>
      <p className={styles.prose}>{lesson.assessment.text} This is a curriculum judgment about a pattern of behavior, not a rating of any person.</p>
    </Block>

    <Block id="swot" title="Strengths, weaknesses, opportunities and threats">
      <div className={styles.swot}>
        <div><h3>Strengths</h3><Bullets items={lesson.swot.strengths} /></div>
        <div><h3>Weaknesses</h3><Bullets items={lesson.swot.weaknesses} /></div>
        <div><h3>Opportunities</h3><Bullets items={lesson.swot.opportunities} /></div>
        <div><h3>Threats</h3><Bullets items={lesson.swot.threats} /></div>
      </div>
    </Block>

    <Block id="when-to-use" title="When to use it, and when not to">
      <h3>Conditions where it helps</h3>
      <Bullets items={lesson.helpsWhen} />
      <h3>Conditions where it should not be used</h3>
      <Bullets items={lesson.avoidWhen} />
    </Block>

    <Block id="complements" title="Complementary approaches and safeguards">
      <ul className={styles.list}>{lesson.complements.map(item => {
        const other = LEADERSHIP_STYLE_LESSONS.find(candidate => candidate.slug === item.slug)!;
        return <li key={item.slug}><Link className="underline" href={leadershipStyleHref(other.slug)}>{other.name}</Link>: {item.why}</li>;
      })}</ul>
      <h3>Safeguards</h3>
      <Bullets items={lesson.safeguards} />
    </Block>

    <Block id="practice" title="Practice exercise and review">
      <p className={styles.callout}>{lesson.practice.situation}</p>
      <Steps items={lesson.practice.steps} />
      <h3>Review prompts</h3>
      <Bullets items={lesson.review} />
      <p className={`${styles.prose} mt-4`}>Check a written response against the <Link className="underline" href={`${LEADERSHIP_PATHWAY_PAGES.capstone.href}#rubric`}>eight-point practice rubric</Link>. The rubric looks at responses, never at people.</p>
      <BoundaryNote />
    </Block>

    <nav className={styles.pager} aria-label="Lessons">
      {previous ? <Link href={leadershipStyleHref(previous.slug)}>Previous: {previous.name}</Link> : <Link href={LEADERSHIP_PATHWAY_HREF}>Pathway overview</Link>}
      {next ? <Link href={leadershipStyleHref(next.slug)}>Next: {next.name}</Link> : <Link href={LEADERSHIP_PATHWAY_PAGES.scenarios.href}>Next: {LEADERSHIP_PATHWAY_PAGES.scenarios.title}</Link>}
    </nav>
  </PathwayShell>;
}
