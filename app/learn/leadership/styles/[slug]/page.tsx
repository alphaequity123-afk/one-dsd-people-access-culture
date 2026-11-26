import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageHref } from "@/lib/dsd-live/leadership/program";
import { getStyle, guideDownloads, leadershipStyles, styleGroups, styleHref, styleScenarioId, type LabeledItem } from "@/lib/dsd-live/leadership/styles";
import { currentUnit } from "@/lib/dsd-live/unit";
import { InTheMoment } from "@/components/dsd-live/in-the-moment";
import { momentFor } from "@/lib/dsd-live/leadership/in-the-moment";
import { podcastFor } from "@/lib/dsd-live/leadership/style-podcasts";
import { StylePodcast } from "@/components/dsd-live/style-podcast";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return leadershipStyles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const style = getStyle((await params).slug);
  if (!style) notFound();
  return { title: style.name, description: style.summary };
}

function Labeled({ items }: { items: LabeledItem[] }) {
  return <ul className="style-list">{items.map(item => <li key={item.label + item.text}>
    {item.label ? <><strong>{item.label}.</strong> </> : null}{item.text}
  </li>)}</ul>;
}

const SWOT: Array<[keyof NonNullable<ReturnType<typeof getStyle>>["swot"], string]> = [
  ["helps", "Where it helps"],
  ["falls_short", "Where it falls short"],
  ["on_purpose", "When to use it on purpose"],
  ["at_risk", "What it puts at risk"],
];

export default async function StylePage({ params }: Props) {
  const style = getStyle((await params).slug);
  if (!style) notFound();
  const unit = currentUnit();
  const section = `${unit.short} Leadership`;
  const group = styleGroups.find(g => g.id === style.group)!;
  const index = leadershipStyles.findIndex(s => s.slug === style.slug);
  const previous = leadershipStyles[index - 1];
  const next = leadershipStyles[index + 1];
  const related = style.related.map(slug => getStyle(slug)!).filter(Boolean);
  const downloads = guideDownloads(unit.id);
  const moment = momentFor(style.slug, unit.id);
  const podcast = podcastFor(style.slug);
  const words = JSON.stringify([style.look, style.swot, style.impact]).split(/\s+/).length;
  return <article className="style-page article-layout">
    <header className="style-head article-head">
      <Link className="article-tag" href={`/learn/leadership#${group.id}`}>{group.title}</Link>
      <h1>{style.name}</h1>
      <p className="article-meta"><Link href="/learn/leadership">{section}</Link><span>About a {Math.max(4, Math.round(words / 230))}-minute read</span></p>
      <p className="article-lede">{style.summary}</p>
      {podcast ? <StylePodcast podcast={podcast} styleName={style.name} /> : null}
      <p>{style.opener}</p>
      <div className="style-brief"><h2>How it affects staff</h2><p>{style.staff}</p></div>
      <nav aria-label="On this page" className="style-contents">
        <a href="#looks">What it looks like</a><a href="#helps">Where it helps and where it costs</a><a href="#affects">How it affects staff and fair service</a>{moment ? <a href="#moment">In the moment</a> : null}<a href="#do">What to do</a><a href="#practice">Practice it</a>
      </nav>
    </header>

    <section id="looks" aria-labelledby="looks-title">
      <h2 id="looks-title">What it looks like</h2>
      {style.look.paragraphs.map(text => <p key={text}>{text}</p>)}
      {style.look.behaviors.length ? <><h3>What you might notice</h3><Labeled items={style.look.behaviors} /></> : null}
    </section>

    <section id="helps" aria-labelledby="helps-title">
      <h2 id="helps-title">Where it helps and where it costs</h2>
      <div className="style-swot">{SWOT.map(([key, title]) => <div key={key}>
        <h3>{title}</h3>{style.swot[key].map(text => <p key={text}>{text}</p>)}
      </div>)}</div>
    </section>

    <section id="affects" aria-labelledby="affects-title">
      <h2 id="affects-title">How it affects staff and fair service</h2>
      {style.impact.intro.map(text => <p key={text}>{text}</p>)}
      {style.impact.points.map(point => <div key={point.title} className={`style-point style-point-${point.tone}`}>
        <p className="style-tone">{point.tone === "help" ? "Where it helps" : "Where to take care"}</p>
        <h3>{point.title}</h3>
        {point.text.map(text => <p key={text}>{text}</p>)}
      </div>)}
    </section>

    {moment ? <InTheMoment moment={moment} kitHref={`/learn/leadership/styles/${style.slug}/team-kit`} /> : null}

    <section id="do" aria-labelledby="do-title">
      <h2 id="do-title">What to do</h2>
      {style.impact.what_to_do_intro ? <p>{style.impact.what_to_do_intro}</p> : null}
      <Labeled items={style.impact.what_to_do} />
    </section>

    <section id="practice" aria-labelledby="practice-title" className="style-next">
      <h2 id="practice-title">Practice it</h2>
      <p>Try a short scenario that asks how you would use this style in a real decision, then bring a question of your own to Ask.</p>
      <div className="leadership-actions">
        <Link className="button" href={pageHref(styleScenarioId(style.slug))}>Work through a scenario</Link>
        <Link href={`/ask?q=${encodeURIComponent(`How can I recognize ${style.name.toLowerCase()} in my own work, and what should I try instead when it is not serving my team?`)}`}>Ask about this style</Link>
      </div>
      {related.length ? <>
        <h3>Often compared with</h3>
        <ul className="style-related">{related.map(r => <li key={r.slug}><Link href={styleHref(r.slug)}>{r.name}</Link><span>{r.summary}</span></li>)}</ul>
      </> : null}
    </section>

    <nav className="style-pager" aria-label="Other styles">
      {previous ? <Link href={styleHref(previous.slug)}>Previous: {previous.name}</Link> : <span />}
      <Link href="/learn/leadership#styles">All leadership styles</Link>
      {next ? <Link href={styleHref(next.slug)}>Next: {next.name}</Link> : <span />}
    </nav>
    <p className="style-download">The full guide to all the styles: <a href={downloads.docx} download>Word</a> · <a href={downloads.pdf} download>PDF</a></p>
  </article>;
}
