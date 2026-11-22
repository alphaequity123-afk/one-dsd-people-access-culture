
import Link from "@/components/app-link";
import { ResearchBlocks, ResearchInline, ResearchMarkdown } from "@/components/research-markdown";
import { parseResearchMarkdown, type ResearchBlock } from "@/lib/content/research-markdown";
import { WATER_COURSE_HREF, WATER_ESSAY } from "@/lib/content/water-we-swim-in";
import "./cl-water.css";
import { WaterFigure } from "./water-curriculum";
import type { WaterImage } from "@/lib/content/water-curriculum";
import { FocusedSections } from "@/components/focused-sections";

/** One page of the essay. Its words come unchanged from the essay data; only the page layout is new. */
export type WaterEssayPart = { slug: string; heading: string; body: string };

const LIMITS_HEADING = "What the sources could not establish";
const SOURCES_HEADING = "Sources";
export const WATER_ESSAY_HREF = `${WATER_COURSE_HREF}/essay`;
export const WATER_WHOLE_ESSAY_HREF = `${WATER_ESSAY_HREF}/whole`;

/** The essay's own sections, then its limits and its sources, each as one part page. */
export const WATER_ESSAY_PARTS: WaterEssayPart[] = [
  ...WATER_ESSAY.sections.map(section => ({ slug: section.id, heading: section.heading, body: section.body })),
  ...(WATER_ESSAY.limits ? [{ slug: "what-the-sources-could-not-establish", heading: LIMITS_HEADING, body: WATER_ESSAY.limits }] : []),
  ...(WATER_ESSAY.sources ? [{ slug: "sources", heading: SOURCES_HEADING, body: WATER_ESSAY.sources }] : []),
];

export const waterPartHref = (part: WaterEssayPart) => `${WATER_ESSAY_HREF}/${part.slug}`;

/** "In this essay": links to each part page, or to anchors when the whole essay is on one page. */
export function WaterEssayContents({ mode, current, showTitle = true }: { mode: "pages" | "anchors"; current?: string; showTitle?: boolean }) {
  return <nav className="cl-water-contents" aria-labelledby={showTitle ? "cl-water-contents-title" : undefined} aria-label={showTitle ? undefined : "In this essay"}>
    {showTitle && <h2 id="cl-water-contents-title">In this essay</h2>}
    <ol>{WATER_ESSAY_PARTS.map(part => <li key={part.slug} id={mode === "pages" && !current ? part.slug : undefined}>
      <Link href={mode === "anchors" ? `#${part.slug}` : waterPartHref(part)} aria-current={current === part.slug ? "page" : undefined}>{part.heading}</Link>
    </li>)}</ol>
  </nav>;
}

/** One essay part with its heading as the page section heading; sub-headings inside stay as they are. */
export function WaterEssayPartBody({ part }: { part: WaterEssayPart }) {
  return <section id={part.slug} aria-labelledby={`${part.slug}-title`} className="cl-water-part">
    <h2 id={`${part.slug}-title`}>{part.heading}</h2>
    <ResearchMarkdown markdown={part.body} />
  </section>;
}

export function WaterEssayPager({ index }: { index: number }) {
  const previous = WATER_ESSAY_PARTS[index - 1];
  const next = WATER_ESSAY_PARTS[index + 1];
  return <nav className="course-next" aria-label="Essay parts">
    {previous ? <Link href={waterPartHref(previous)}>Previous: {previous.heading}</Link> : <Link href={WATER_ESSAY_HREF}>Essay contents</Link>}
    {next ? <Link href={waterPartHref(next)}>Next: {next.heading}</Link> : <Link href="/learn#learn-culture-title">Back to Culture at work in Learn</Link>}
  </nav>;
}

const slugify = (text: string) => text.toLowerCase().replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "part";

type ModuleGroup = { id: string; heading?: string; blocks: ResearchBlock[] };

/** Splits a module at its own top-level headings so each heading leads a section with an anchor. */
function moduleGroups(markdown: string): ModuleGroup[] {
  const groups: ModuleGroup[] = [];
  const used = new Set<string>();
  for (const block of parseResearchMarkdown(markdown)) {
    if (block.type === "heading" && block.level === 3) {
      let id = slugify(block.text);
      for (let n = 2; used.has(id); n++) id = `${slugify(block.text)}-${n}`;
      used.add(id);
      groups.push({ id, heading: block.text, blocks: [] });
    } else {
      if (!groups.length) groups.push({ id: "", blocks: [] });
      groups[groups.length - 1].blocks.push(block);
    }
  }
  return groups;
}

/** A module with an "In this module" contents list; every word and block renders as before. */
export function WaterModuleBody({ markdown, notesKey, images = {} }: { markdown: string; notesKey?: string; images?: Record<string, WaterImage> }) {
  const groups = moduleGroups(markdown);
  return <FocusedSections label="In this module">
    {groups.map((group, index) => group.heading
      ? <section key={group.id} id={group.id} data-topic-title={group.heading.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")} aria-labelledby={`${group.id}-title`} className="cl-water-part"><h2 id={`${group.id}-title`}><ResearchInline text={group.heading} /></h2>{images[group.heading] && <WaterFigure image={images[group.heading]} />}<ResearchBlocks blocks={group.blocks} notesKey={notesKey} /></section>
      : <ResearchBlocks key={`intro-${index}`} blocks={group.blocks} notesKey={notesKey} />)}
  </FocusedSections>;
}
