import type { Metadata } from "next";
import Link from "next/link";
import { dsdLeadershipReading } from "@/lib/dsd-live/dsd-practice/leadership-readings";
import { sources } from "@/lib/dsd-live/dsd-practice/sources";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { leadershipResourceHref } from "@/lib/dsd-live/agency/leadership-resource-links";
import {
  adjacentReadings, blockText, competencies, getLeadershipPage, leadershipPages, pageHref, readingTitle,
  type LeadershipBlock, type LeadershipPage, type LeadershipSpan,
} from "@/lib/dsd-live/leadership/program";
import styles from "./reading.module.css";
import { areaSlug } from "@/lib/dsd-live/leadership/areas";
import { styleForScenario, styleHref } from "@/lib/dsd-live/leadership/styles";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return leadershipPages.map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getLeadershipPage((await params).id);
  if (!page) notFound();
  return { title: readingTitle(page) };
}

function CatalogTitle({ label }: { label: string }) {
  const href = leadershipResourceHref(label);
  const title = label.replace(/^[LGR]\d+\s*·\s*/, "");
  return href ? <Link href={href}>{title}</Link> : <>{title}</>;
}

function SourceSpan({ span, publication }: { span: LeadershipSpan; publication?: string }) {
  if (span.field || span.text === "\t") return null;
  let content: ReactNode = span.text;
  if (span.bold) content = <strong>{content}</strong>;
  if (span.italic) content = <em>{content}</em>;
  if (span.href?.startsWith("#")) return <Link href={pageHref(span.href.slice(1))}>{content}</Link>;
  if (span.href) return <a href={span.href} aria-label={publication ? `Read ${publication}` : undefined}>{content}</a>;
  return <>{content}</>;
}

function CrosswalkDetails({ text }: { text: string }) {
  const [capability, courses] = text.split("   ·   ");
  if (!courses) return <p>{text}</p>;
  return <>
    <p>{capability}</p>
    <ul className={styles.resources}>{courses.split(" / ").map(name =>
      <li key={name}><CatalogTitle label={name} /></li>
    )}</ul>
  </>;
}

function SourceBlocks({ page }: { page: LeadershipPage }) {
  const output: ReactNode[] = [];
  let sectionHeading: string | undefined;
  for (let i = 0; i < page.blocks.length; i++) {
    const block = page.blocks[i];
    const text = blockText(block);
    if (["Title", "Heading1", "Heading2", "Programlabel"].includes(block.style)) continue;
    if (block.style === "Directoryitem" && page.type === "directory") {
      const items: LeadershipBlock[] = [block];
      while (page.blocks[i + 1]?.style === "Directoryitem") items.push(page.blocks[++i]);
      output.push(<ul key={i} className={styles.resources}>{items.map((b, n) =>
        <li key={n}><CatalogTitle label={blockText(b)} /></li>
      )}</ul>);
      continue;
    }
    if (block.style === "Directoryitem" && page.type === "crosswalk") {
      output.push(<CrosswalkDetails key={i} text={text} />);
      continue;
    }
    const contents = block.spans.map((s, n) =>
      <SourceSpan span={s} key={n} publication={page.type === "research" ? sectionHeading : undefined} />
    );
    if (block.style === "Heading3" || block.style === "Contentsarea") {
      sectionHeading = text;
      output.push(<h2 key={i}>{contents}</h2>);
    } else if (block.style === "Choicelink") {
      output.push(<p key={i} className={styles.sourceLinks}>{contents}</p>);
    } else {
      output.push(<p key={i} className={block.style === "Smallnote" ? styles.note : undefined}>{contents}</p>);
    }
  }
  return <>{output}</>;
}

export default async function LeadershipReading({ params }: Props) {
  const page = getLeadershipPage((await params).id);
  if (!page) notFound();
  const competency = competencies.find(c => c.id === page.competencyId);
  const revised = dsdLeadershipReading(page.id);
  const { previous, next } = adjacentReadings(page);
  return <div className={`shell ${styles.shell} article-layout`}>
    <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
      <Link href="/learn">Learn</Link>
      <span aria-hidden="true">/</span>
      <Link href="/learn/leadership">One DSD Leadership</Link>
      {competency && <><span aria-hidden="true">/</span><Link href={`/learn/leadership/areas#${areaSlug(competency.id)}`}>{competency.title}</Link></>}
    </nav>
    <article className={styles.article} aria-labelledby="reading-title">
      <h1 id="reading-title">{readingTitle(page)}</h1>
      {styleForScenario(page.id) ? <p><Link href={styleHref(styleForScenario(page.id)!.slug)}>Read the full guide to {styleForScenario(page.id)!.name.toLowerCase()}</Link>: what it looks like, where it helps and costs, and how it affects staff.</p> : null}
      {revised ? <>
        <p className="learning-lede">{revised.opening}</p>
        {revised.sections.map(section => <section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section>)}
        <p><Link href={`/practice/disability/${revised.guide}`}>Explore a related disability services situation</Link></p>
        <details><summary>Sources for this One DSD learning adaptation</summary><ul className={styles.resources}>{revised.sources.map(id => <li key={id}><a href={sources[id].url}>{sources[id].title}</a><p>{sources[id].use}</p></li>)}</ul></details>
        <details><summary>Related readings</summary><ul className={styles.resources}>{Array.from(new Map(page.blocks.flatMap(block => block.spans).filter(span => span.href).map(span => [span.href!,span])).values()).map(span => {
          const linked = span.href!.startsWith("#") ? getLeadershipPage(span.href!.slice(1)) : undefined;
          return <li key={span.href}>{linked ? <Link href={pageHref(linked.id)}>{readingTitle(linked)}</Link> : <SourceSpan span={span} />}</li>;
        })}</ul></details>
      </> : <SourceBlocks page={page} />}
      {page.related && competency && <section className={styles.practice} aria-labelledby="practice-title">
        <h2 id="practice-title">Continue with a situation</h2>
        <p>Explore {competency.title} through a decision, consider the feedback and choose a next step that fits your responsibilities.</p>
        <p><Link href={`/learn/leadership/practice/${areaSlug(competency.id)}`}>Open the {competency.title} practice</Link></p>
        <h3>Related learning</h3>
        <ul className={styles.resources}>{page.related.resources.map(name =>
          <li key={name}><CatalogTitle label={name} /></li>
        )}</ul>
      </section>}
    </article>
    <nav className={styles.paging} aria-label={competency ? `More articles in ${competency.title}` : "Adjacent program readings"}>
      {previous && <Link href={pageHref(previous.id)} rel="prev"><span>Previous reading</span>{readingTitle(previous)}</Link>}
      {next && <Link href={pageHref(next.id)} rel="next"><span>Next reading</span>{readingTitle(next)}</Link>}
    </nav>
  </div>;
}
