
import { SourceLink } from "@/components/app-link";
import Link from "@/components/app-link";
import { notFound } from "next/navigation";
import { Fragment, type ReactNode } from "react";
import { Notice } from "./ui";
import { getBrief } from "@/lib/content/briefs";
import { getPath } from "@/lib/content/paths";
import { suggestedReadingFor } from "@/lib/content/knowledge-graph";
import { communityReading } from "@/lib/content/community-design";
import { COMMUNITY_QUESTIONS, NATIVE_DEFERENCE_COMMUNITY_IDS, communityReadingGroups } from "@/lib/content/community-presentation";
import { WATER_RESOURCE_COLLECTION_PATH, WATER_RESOURCE_COLLECTION_TITLE } from "@/lib/learning/water-resource-collection";
import { communityReadingSurfaceId } from "@/lib/content/community-reading-surface";
import type { EditableRichBlock } from "@/lib/content/editable-surface-contract";
import { applyCommunityBriefValues, communityBriefSurfaceId, stringValue } from "@/lib/content/staff-surface-registry";
import { EditableSurfaceRegion, prepareEditableSurface } from "./editable-surface";
import { ResourceDownloads } from "./resource-downloads";
import { CommunityExperience, CommunityPractice } from "./community-experience-controls";
import { culturalIntelligenceHubAvailable } from "@/lib/content/cultural-intelligence-publication";
import { CommunityCollectionAddition, publishedCommunityAddition } from "./community-collection-addition";
import { CommunityResearchSections } from "./community-research-sections";
import { minnesotaAccess, publishedCommunityResearch } from "@/lib/content/community-research";
import { CommunityProfileSections } from "./community-profile-sections";
import { publishedCommunityProfile } from "@/lib/content/community-profile";
import { CommunityBeforeOutreachSection, CommunityHubSections, CommunityNumbersSection, CommunityOrganizationsSection } from "./hub/community-hub-sections";
import { COMMUNITY_PARTS, communityPartHref, isCommunityPartSlug, type CommunityPartSlug } from "./cp-community-parts";
import { CommunityBreadcrumb, CommunityPartsList, CommunityPartsNav, type CommunityPartSummary } from "./cp-community-parts-nav";
import { CommunityHashForward } from "./cp-community-hash-forward";
import { isNativeCommunity } from "@/lib/content/hub/organizations";
import "./community-editorial.css";

function inlineText(text: string): ReactNode {
  // Render content as text/links, never as executable source HTML.
  return text.split(/(\[[^\]]+\]\(https:\/\/[^\s)]+\))/g).map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\((https:\/\/[^\s)]+)\)$/);
    const plain = part.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1");
    return link ? <SourceLink key={index} href={link[2]}>{link[1]}</SourceLink> : <Fragment key={index}>{plain}</Fragment>;
  });
}

function Reading({ body }: { body: string }) {
  return <>{body.split(/\n\s*\n/).map((part, index) => {
    const heading = part.match(/^#{1,6}\s+(.+)$/);
    if (heading) return <h3 key={index}>{inlineText(heading[1])}</h3>;
    const lines = part.split("\n");
    if (lines.every(line => /^\s*[-*]\s+/.test(line))) return <ul key={index}>{lines.map((line, n) => <li key={n}>{inlineText(line.replace(/^\s*[-*]\s+/, ""))}</li>)}</ul>;
    if (lines.every(line => /^\s*\d+[.)]\s+/.test(line))) return <ol key={index}>{lines.map((line, n) => <li key={n}>{inlineText(line.replace(/^\s*\d+[.)]\s+/, ""))}</li>)}</ol>;
    return <p key={index}>{inlineText(part)}</p>;
  })}</>;
}

function chapterTitle(raw: string) {
  // Recovered drafts carry numbering and lowercase editing notes after a dash,
  // such as "9. Other considerations — unvarnished". Staff see the plain heading.
  const title = raw.replace(/^\s*\d+\.\s+/, "").replace(/\s+[—–-]\s+(?=[a-z0-9]).*$/, "").trim();
  if (title === "A Note on This Guide") return "People, place, and perspective";
  if (/^How it hits DHS gates/.test(title)) return "Connections to human services";
  return title;
}

function RichReading({ blocks }: { blocks: EditableRichBlock[] }) {
  return <>{blocks.map((block, i) => {
    if (block.type === "heading") return <h3 key={i}>{block.text}</h3>;
    if (block.type === "paragraph") return <p key={i}>{block.text}</p>;
    if (block.type === "link-list") return <ul key={i}>{block.items.map((link, n) => <li key={n}><SourceLink href={link.href}>{link.label}</SourceLink></li>)}</ul>;
    const List = block.type === "numbered-list" ? "ol" : "ul";
    return <List key={i}>{block.items.map((item, n) => <li key={n}>{item}</li>)}</List>;
  })}</>;
}

function Chapters({ chapters, openFirst = false }: { chapters: Array<{ heading: string; body: string; blocks?: EditableRichBlock[] }>; openFirst?: boolean }) {
  return <>{chapters.map((chapter, index) => <details key={`${chapter.heading}-${index}`} open={openFirst && index === 0}>
    <summary>{chapterTitle(chapter.heading)}</summary><div>{chapter.blocks ? <RichReading blocks={chapter.blocks} /> : <Reading body={chapter.body} />}</div>
  </details>)}</>;
}

export async function CommunityDesignPage({ id, part }: { id: string; part?: string }) {
  const raw = getBrief(id);
  const recovered = communityReading(id);
  if (!raw && !recovered) notFound();
  // Native community pages are never split into parts (owner rule).
  const native = isNativeCommunity(id) || (NATIVE_DEFERENCE_COMMUNITY_IDS as readonly string[]).includes(id);
  if (part !== undefined && (native || !isCommunityPartSlug(part))) notFound();
  const [surface, readingSurface] = await Promise.all([
    raw ? prepareEditableSurface(communityBriefSurfaceId(id)) : Promise.resolve(null),
    recovered ? prepareEditableSurface(communityReadingSurfaceId(id)) : Promise.resolve(null),
  ]);
  // Owners retain the existing editing controls for withdrawn areas, but staff
  // must receive a real unavailable result rather than an empty successful page.
  if ([surface, readingSurface].some(area => area && !area.available && !area.canEdit)) notFound();
  const b = raw && surface ? applyCommunityBriefValues(raw, surface.values) : null;
  const title = b && b.title !== raw?.title ? b.title : readingSurface ? stringValue(readingSurface.values, "title") : b!.title;
  const chapters: Array<{ heading: string; body: string; blocks?: EditableRichBlock[] }> = recovered && readingSurface ? recovered.sections.map((chapter, i) => ({
    ...chapter, heading: stringValue(readingSurface.values, `chapter${i}Title`), blocks: readingSurface.values[`chapter${i}Body`] as EditableRichBlock[],
  })) : b?.level2 ?? [];
  const readingGroups = communityReadingGroups(chapters);
  const firstParagraph = chapters.flatMap(chapter => chapter.blocks ?? []).find(block => block.type === "paragraph");
  const opening = b?.level0.whoAndWhere ?? (firstParagraph?.type === "paragraph" ? firstParagraph.text : undefined);
  const question = COMMUNITY_QUESTIONS[id] ?? {
    question: `A team is preparing an outreach meeting with people whose experiences are discussed in ${title}. Before choosing one format, what would you want to learn from the people who might attend?`,
    response: "Use the community context to prepare questions, not to decide the answers for participants. Ask about language, access, timing, and how people want to contribute. Explain what they can influence and how the team will respond to their input.",
  };
  const spotlight = surface ? stringValue(surface.values, "spotlightTitle") : "";
  const available = [surface, readingSurface].every(area => !area || area.available);
  const collectionLink = available && !native ? <p>Back to <Link href={WATER_RESOURCE_COLLECTION_PATH}>{WATER_RESOURCE_COLLECTION_TITLE}</Link>.</p> : null;
  const culturalIntelligenceAvailable = available && await culturalIntelligenceHubAvailable();
  const practiceTitle = b?.tribalGate ? "Government-to-government relationships" : "Practice considerations";
  const practice = b ? <section id="community-practice">
    <h2>{practiceTitle}</h2>
    <p>{b.level0.whyItMattersForDhsWork}</p>
    {Object.entries({ "What to ask": b.level1.whatToAsk, "Access considerations": b.level1.accessChecks, "Who to involve": b.level1.whoToInvolve, "Assumptions to examine": b.level1.whatNotToAssume }).map(([heading, items]) => <details key={heading}><summary>{heading}</summary><div><ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul></div></details>)}
  </section> : null;
  const links = <section id="community-connections"><h2>Continue the connection</h2>
    <ul className="community-link-list">
      {b?.relatedPathIds.map(id => getPath(id)).filter(path => path !== undefined).map(path => <li key={path.id}><Link href={`/paths/${path.id}`}>{path.title}</Link></li>)}
      <li><Link href="/learn/equity-toolkit">Equity Analysis Toolkit</Link></li>
      <li><Link href="/community-outreach">Community Outreach and Engagement</Link></li>
      <li><Link href="/learn/community-connections">Community engagement and connections</Link></li>
      <li><Link href="/learn">Learning and resources</Link></li>
      <li><Link href="/ask">Ask a question</Link></li>
    </ul>
    {culturalIntelligenceAvailable ? <p><Link href="/learn/cultural-intelligence">Explore the Cultural Intelligence collection</Link></p> : null}
    {suggestedReadingFor(id).length ? <><h3>Suggested reading</h3><p>Two books can deepen your understanding of this community. Each comes with reading notes, key ideas, and questions to discuss with your team.</p><ul className="community-link-list">{suggestedReadingFor(id).map(book => <li key={book.id}><Link href={`/learn/readings/${book.id}`}>{book.title}</Link> <span>· {book.authors}</span></li>)}</ul></> : null}
  </section>;
  const communityOverview = b ? <section id="community-overview"><h2>Community overview</h2><p>{b.level0.withinGroupDiversity}</p><h3>Names and terms</h3><p>{b.names.preferred.join("; ")}</p>{b.names.alsoUsed.length ? <p>Also used: {b.names.alsoUsed.join("; ")}</p> : null}<p>{b.names.note}</p>{b.names.uncertainty ? <p>{b.names.uncertainty}</p> : null}</section> : null;
  const history = readingGroups.some(group => group.chapters.length) ? <section id="community-history"><h2>History, culture, and life today</h2>{readingGroups.filter(group => group.chapters.length).map(group => <details className="community-reading-theme" key={group.title}><summary>{group.title}</summary><div><Chapters chapters={group.chapters} /></div></details>)}</section> : null;
  const context = b?.level2?.length && recovered ? <section id="community-context"><h2>More context for your work</h2><Chapters chapters={b.level2} /></section> : null;
  const observances = b?.observances?.length ? <section id="community-observances"><h2>Observances at work</h2><div className="community-table" role="region" aria-label="Observances at work" tabIndex={0}><table><thead><tr><th scope="col">Observance</th><th scope="col">When</th><th scope="col">At work</th></tr></thead><tbody>{b.observances.map((o, i) => <tr key={i}><th scope="row">{o.title}</th><td>{o.when}</td><td>{o.atWork}</td></tr>)}</tbody></table></div></section> : null;
  const sources = b?.sources.length ? <section id="community-sources"><h2>Sources</h2><ul>{b.sources.map((source, index) => <li key={index}>{source.href ? <SourceLink href={source.href}>{source.label}</SourceLink> : source.label}</li>)}</ul></section> : null;
  // All recovered chapters remain available in the brief. Learning brings full
  // readings alongside three objectives and a reflection, rather than replacing
  // the source material with short question-only summaries.
  const lessonHistory = <section><h2>History and the decisions we make today</h2><h3>In this lesson</h3><ul>
      <li>Connect a historical condition described in the brief to a present-day service question.</li>
      <li>Distinguish community-level context from an individual’s circumstances.</li>
      <li>Identify evidence needed before changing a service requirement.</li>
    </ul><Chapters chapters={readingGroups[0].chapters} />
    {!b?.tribalGate ? <CommunityPractice {...question} /> : <p>Historical and cultural learning does not replace government-to-government consultation. Begin with the Tribal Relations guidance and the Nation’s own designated contacts.</p>}</section>;
  const lessonIdentity = <section><h2>Family, identity, and individual experience</h2><h3>In this lesson</h3><ul>
      <li>Recognize differences in identity, language, and experience within a community.</li>
      <li>Ask about a person’s relationships without prescribing who should be involved.</li>
      <li>Identify an assumption that could distort a service conversation.</li>
    </ul><Chapters chapters={readingGroups[1].chapters} />
    <CommunityPractice question="A person names a close friend as an important source of support. How would you learn what that relationship means for the decision being discussed?" response="Ask the person how they want their friend involved, and explain any relevant requirements. A community description cannot establish whom an individual trusts or what support they want." /></section>;
  const lessonEquity = <section><h2>From understanding to an equity analysis</h2><h3>In this lesson</h3><ul>
      <li>Identify a specific access barrier in a proposed process.</li>
      <li>Name whose input would help evaluate the decision.</li>
      <li>Choose a way to check whether a revision improves access.</li>
    </ul><Chapters chapters={readingGroups[2].chapters} />
    <CommunityPractice question="A team has offered a listening session but has not explained what changed afterward. What would strengthen the work?" response="Explain what input affected the decision, what remains unresolved, and how participants can respond. Attendance is useful information, but it does not show that the decision became more responsive." />
    <p><Link href="/learn/equity-toolkit">Connect your reflection to the Equity Analysis Toolkit</Link></p></section>;
  // Applies the same publication gates as the additions and never loads for
  // pages under standing deference. The deference notice above is unchanged.
  const research = await publishedCommunityResearch(id);
  const profile = await publishedCommunityProfile(id);
  const collectionAddition = await CommunityCollectionAddition({ id, research });
  const downloads = available ? <div className="community-download-links"><ResourceDownloads kind="community" id={id} noun="page" appearance="links" /></div> : null;
  const spotlightSection = spotlight && surface ? <section className="community-spotlight"><h2>{spotlight}</h2><p>{stringValue(surface.values, "spotlightBody")}</p><SourceLink href={stringValue(surface.values, "spotlightHref")}>{stringValue(surface.values, "spotlightLinkLabel")}</SourceLink></section> : null;
  const reflection = surface && stringValue(surface.values, "reflectionBody") ? <details className="community-opening-reflection"><summary>{stringValue(surface.values, "reflectionTitle")}</summary><div><p>{stringValue(surface.values, "reflectionBody")}</p></div></details> : null;
  const aside = <aside><Link href="/minnesota-communities">Minnesota Communities</Link><p>Briefs for staff of the Disability Services Division (DSD) on history, everyday life, and the connections that shape our work.</p></aside>;
  const wrap = (content: ReactNode) => {
    const readings = readingSurface ? <EditableSurfaceRegion surface={readingSurface}>{content}</EditableSurfaceRegion> : content;
    return surface ? <EditableSurfaceRegion surface={surface}>{readings}</EditableSurfaceRegion> : readings;
  };

  if (native) {
    // Native community pages render exactly as they always have: one page.
    const overview = <>
      <nav className="community-reading-contents" aria-label="In this brief">{readingGroups.some(group => group.chapters.length) ? <SourceLink href="#community-history">History and culture</SourceLink> : null}{b ? <SourceLink href="#community-practice">Practice considerations</SourceLink> : null}{!isNativeCommunity(id) ? <><SourceLink href="#community-numbers">Numbers</SourceLink><SourceLink href="#community-organizations">Organizations</SourceLink><SourceLink href="#community-before-outreach">Before you reach out</SourceLink></> : null}<SourceLink href="#community-connections">Related resources</SourceLink></nav>
      {communityOverview}
      {history}
      {practice}
      <CommunityHubSections id={id} title={title} />
      {context}
      {observances}
      {sources}
      {links}
    </>;
    const learning = <>{lessonHistory}{lessonIdentity}{lessonEquity}</>;
    return wrap(<div className="community-editorial">
      <div className="community-reading-layout">
        {aside}
        <article>
          <p className="community-eyebrow">Minnesota Communities</p><h1>{title}</h1>
          {(NATIVE_DEFERENCE_COMMUNITY_IDS as readonly string[]).includes(id) ? <Notice tone="info">This program defers to the Office of Indian Affairs and to the Department of Human Services offices that handle Tribal relations and consultation for anything concerning Native American individuals, communities, or Tribal Nations. That deference is standing, not a brief under construction — this program does not complete or expand this content on its own. For anything substantive, contact the Office of Indian Affairs or the Department of Human Services offices that handle Tribal relations and consultation directly.</Notice> : null}
          {opening ? <p className="community-opening">{opening}</p> : null}
          {spotlightSection}
          {downloads}
          {reflection}
          <CommunityExperience title={title} brief={overview} learning={learning} />
          {collectionAddition}
          {profile ? <CommunityProfileSections profile={profile} /> : null}
          {research ? <CommunityResearchSections research={research} access={minnesotaAccess()} /> : null}
        </article>
      </div>
    </div>);
  }

  // Every other community page is an overview plus parts. Each section of the
  // former single page lands on exactly one part; nothing is left out.
  const collection = collectionAddition ? await publishedCommunityAddition(id, research) : null;
  const bodies: Record<CommunityPartSlug, { sections: Array<string | false | null | undefined | 0>; body: ReactNode }> = {
    history: { sections: [history && "History, culture, and life today", context && "More context for your work", observances && "Observances at work"], body: <>{history}{context}{observances}</> },
    learning: { sections: ["History and the decisions we make today", "Family, identity, and individual experience", "From understanding to an equity analysis"], body: <>{lessonHistory}{lessonIdentity}{lessonEquity}</> },
    "working-with": { sections: [practice && practiceTitle, "Before you reach out", "Continue the connection"], body: <>{practice}<CommunityBeforeOutreachSection id={id} />{links}</> },
    numbers: { sections: ["Numbers, with care"], body: <CommunityNumbersSection id={id} /> },
    organizations: { sections: ["Organizations connected with the Disability Services Division"], body: <CommunityOrganizationsSection id={id} title={title} /> },
    profile: { sections: [profile && "Community profile"], body: profile ? <CommunityProfileSections profile={profile} /> : null },
    // The research set stays together: its sections link to one another within the page.
    people: { sections: research ? [research.people.length && "People and contributions", research.institutions.length && "Institutions and history", "Disability and access", "Organizations and media", "About this page"] : [], body: research ? <CommunityResearchSections research={research} access={minnesotaAccess()} /> : null },
    sources: { sections: [sources && "Sources", collectionAddition && (collection?.hasStories ? "More to explore" : "Try it in your work")], body: <>{sources}{collectionAddition}</> },
  };
  const parts: CommunityPartSummary[] = COMMUNITY_PARTS
    .map(({ slug, label }) => ({ slug, label, sections: bodies[slug].sections.filter((section): section is string => typeof section === "string" && section.length > 0) }))
    .filter(entry => entry.sections.length > 0);

  if (part === undefined) {
    return wrap(<div className="community-editorial">
      <div className="community-reading-layout">
        {aside}
        <article>
          <p className="community-eyebrow">Minnesota Communities</p><h1>{title}</h1>
          {opening ? <p className="community-opening">{opening}</p> : null}
          {collectionLink}
          {spotlightSection}
          {downloads}
          {reflection}
          {communityOverview}
          <CommunityPartsList id={id} parts={parts} />
          <CommunityHashForward id={id} parts={parts.map(entry => entry.slug)} />
        </article>
      </div>
    </div>);
  }

  const current = parts.find(entry => entry.slug === part);
  // A part with nothing in it for this community is never linked and does not exist.
  if (!current) notFound();
  return wrap(<div className="community-editorial">
    <div className="community-reading-layout">
      {aside}
      <article>
        <CommunityBreadcrumb id={id} title={title} current={current.label} />
        <p className="community-eyebrow">{title}</p><h1>{current.label}</h1>
        {collectionLink}
        {downloads}
        <CommunityPartsNav id={id} title={title} parts={parts} current={current.slug} />
        {bodies[current.slug].body}
        <p className="cp-community-part-end"><Link href={communityPartHref(id)}>Back to the {title} overview</Link></p>
      </article>
    </div>
  </div>);
}
