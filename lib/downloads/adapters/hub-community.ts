import "server-only";
import { publishedCommunityAddition } from "@/components/community-collection-addition";
import { publishedCommunityProfile, type CommunityProfile } from "@/lib/content/community-profile";
import { NATIVE_DEFERENCE_COMMUNITY_IDS } from "@/lib/content/community-presentation";
import { minnesotaAccess, publishedCommunityResearch } from "@/lib/content/community-research";
import type { CommunityResearch, MinnesotaAccess, ResearchContext, ResearchInstitution, ResearchPerson, ResearchSource } from "@/lib/content/community-research-policy";
import { parseResearchMarkdown, type ResearchBlock } from "@/lib/content/research-markdown";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { BEFORE_YOU_REACH_OUT } from "@/lib/content/hub/before-you-reach-out";
import { COMMUNITY_CROSSWALK_BY_ID, communityFigureGroups } from "@/lib/content/hub/community-crosswalk";
import { COMMUNITY_FIGURES, DISABILITY_BRIEF_SOURCE, FIGURES_PER_100_NOTE, FIGURES_SOURCE, FIGURE_MEASURES, groupFigureText } from "@/lib/content/hub/community-figures-format";
import { counties, formatValue, getCountyData, groupLabel, measureFor, statewidePlace, statusText, type GroupId, type MeasureId, type Place } from "@/lib/content/hub/county-data";
import { isNativeCommunity, organizationHref, organizationsForCommunity, relationshipLine } from "@/lib/content/hub/organizations";
import { DEPARTMENT_WIDE_GRANTS } from "@/lib/content/hub/record-findings";
import {
  bullets,
  callout,
  compactSections,
  heading,
  numbered,
  paragraph,
  quote,
  section,
  table,
  type DocumentBlock,
  type DocumentSection,
  type DocumentSource,
  type ResourceDocument,
} from "../model";
import { briefDocument } from "./community";
import { dateText } from "./hub-outreach";

/** Owner rule: Native community pages publish only what the page itself says. Nothing is added. */
export function isNativeCommunityPage(id: string): boolean {
  return isNativeCommunity(id) || (NATIVE_DEFERENCE_COMMUNITY_IDS as readonly string[]).includes(id);
}

/** Markdown links and emphasis as plain document text: "label (address)". */
function inline(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g, "$1 ($2)")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

function markdownBlocks(blocks: ResearchBlock[]): DocumentBlock[] {
  return blocks.flatMap((block): DocumentBlock[] => {
    switch (block.type) {
      case "heading":
        return [heading(inline(block.text))];
      case "paragraph":
        return [paragraph(inline(block.text))];
      case "list":
        return [bullets(block.items.map(inline), block.ordered)];
      case "table":
        return [table(block.header.map(inline), block.rows.map(row => row.map(inline)))];
      case "note":
        return [callout(inline(block.text), "Content note")];
      case "voice":
        return [quote(markdownBlocks(block.blocks).map(blockText).filter(Boolean).join(" "))];
      case "fact":
        return markdownBlocks(block.blocks);
      case "takeaway":
        return [paragraph([{ text: "Practice this week", bold: true }]), ...markdownBlocks(block.blocks)];
      case "reflect":
        return [paragraph([{ text: "For your own reflection", bold: true }]), numbered(block.items.map(inline))];
      case "scenario":
        return [
          ...(block.label ? [paragraph([{ text: inline(block.label), bold: true }])] : []),
          ...markdownBlocks(block.blocks),
          ...(block.question ? [paragraph(inline(block.question))] : []),
          ...(block.options.length ? [bullets(block.options.map(option => `${inline(option.choice)} — ${inline(option.feedback)}`))] : []),
        ];
    }
  });
}

function blockText(block: DocumentBlock): string {
  switch (block.kind) {
    case "heading":
    case "quote":
    case "callout":
      return block.text;
    case "paragraph":
      return block.runs.map(run => run.text).join("");
    case "list":
      return block.items.map(item => item.map(run => run.text).join("")).join(" ");
    default:
      return "";
  }
}

const sourceLine = (sources: ResearchSource[]) => paragraph(`Sources: ${sources.map(source => `${source.label} (${source.href})`).join("; ")}`);

// ---------------------------------------------------------------- Sections the hub adds to non-Native pages

const MAP_MEASURES: Array<[MeasureId, string]> = [
  ["population", "Share of the county's population"],
  ["services", "Share of people receiving home and community-based services"],
  ["comparison", "Services compared with population"],
];

function countyRow(place: Place, group: GroupId): string[] {
  return [
    place.name,
    ...MAP_MEASURES.map(([measure]) => {
      const value = measureFor(place, group, measure);
      return value.status === "ok" ? formatValue(measure, value.value) : statusText(value.status);
    }),
  ];
}

function hubSections(id: string, title: string): { sections: DocumentSection[]; sources: DocumentSource[] } {
  const crosswalk = COMMUNITY_CROSSWALK_BY_ID.get(id);
  const groups = communityFigureGroups(id);
  const orgs = organizationsForCommunity(id);
  const grants = DEPARTMENT_WIDE_GRANTS.filter(grant => grant.communities.includes(id));
  const sections: DocumentSection[] = [];
  const sources: DocumentSource[] = [];

  sections.push(section("Numbers, with care", [
    paragraph("Figures describe groups and conditions, not any one person. Read how people differ within this community before you read the numbers."),
    ...(groups.length
      ? [
          crosswalk?.match === "approximate" ? paragraph([{ text: "How these figures differ from this page: ", bold: true }, { text: crosswalk.note }]) : null,
          ...groups.flatMap((group): DocumentBlock[] => [
            heading(`${group.name} Minnesotans, statewide, ${COMMUNITY_FIGURES.surveyYears}`),
            table(["Measure", "Figure", "Report table"], FIGURE_MEASURES.map(measure => [measure.label, groupFigureText(group, measure), `${measure.table}, page ${measure.page}`])),
            ...("definition" in group && group.definition ? [paragraph(`Who is counted: ${String(group.definition)}`)] : []),
          ]),
          paragraph(`${FIGURES_PER_100_NOTE} ${COMMUNITY_FIGURES.comparabilityNote} ${COMMUNITY_FIGURES.periodNote}`),
          paragraph(`Source: ${FIGURES_SOURCE.title}, ${FIGURES_SOURCE.publisher}, ${FIGURES_SOURCE.date}. ${FIGURES_SOURCE.dataSource}`),
          paragraph(`Disability counts not shown in that report come from ${DISABILITY_BRIEF_SOURCE.title}, ${DISABILITY_BRIEF_SOURCE.publisher}, ${DISABILITY_BRIEF_SOURCE.date}.`),
        ]
      : [paragraph(crosswalk?.note ?? "The Minnesota State Demographic Center report does not give separate figures for this community.")]),
  ]));
  if (groups.length) {
    sources.push(
      { title: FIGURES_SOURCE.title, href: FIGURES_SOURCE.url, note: `${FIGURES_SOURCE.publisher}, ${FIGURES_SOURCE.date}` },
      { title: DISABILITY_BRIEF_SOURCE.title, href: DISABILITY_BRIEF_SOURCE.url, note: `${DISABILITY_BRIEF_SOURCE.publisher}, ${DISABILITY_BRIEF_SOURCE.date}` },
    );
  }

  const equityGroup = crosswalk?.equityGroup;
  if (equityGroup && equityGroup !== "all") {
    const data = getCountyData();
    sections.push(section("Minnesota counties", [
      paragraph(`The table below shows the broader group that includes this community, county by county: ${groupLabel(equityGroup)}. It is a wider group than this page, so read it as context.`),
      table(["Place", ...MAP_MEASURES.map(([, label]) => label)], [countyRow(statewidePlace(), equityGroup), ...counties().map(place => countyRow(place, equityGroup))]),
      paragraph(`Measures: ${MAP_MEASURES.map(([measure]) => `${data.measures[measure].label} (${data.measures[measure].date})`).join("; ")}.`),
      paragraph(`Full Minnesota county map — program page /community-outreach/county-map?group=${equityGroup}`),
    ]));
    sources.push(...data.sources.map(source => ({ title: source.title, href: source.url, note: [source.publisher, source.date].filter(Boolean).join(", ") })));
  }

  sections.push(section("Organizations connected with the Disability Services Division", [
    orgs.length
      ? paragraph(`These organizations have a published record of working with the Disability Services Division, and their records name work with ${title}. No organization speaks for a whole community.`)
      : paragraph("No organization with a published record of working with the Disability Services Division names this community in its records. That is a finding about the records, not about the community."),
    orgs.length
      ? table(
          ["Organization", "Work on record", "Status", "Public records", "Facts checked", "Page"],
          orgs.map(org => [
            org.name,
            org.withTheDivision.map(relationshipLine).join("; "),
            org.closed ? "Closed" : "",
            org.records.map(record => `${record.title}${record.date ? `, ${record.date}` : ""}: ${record.url}`).join("\n"),
            dateText(org.checked),
            organizationHref(org.slug),
          ]),
        )
      : null,
    grants.length ? heading("Also on record with the Department of Human Services") : null,
    grants.length ? bullets(grants.map(grant => `${grant.organizations}: ${grant.program}, ${grant.years}. Record: ${grant.record.title}, ${grant.record.date} (${grant.record.url})`)) : null,
  ]));
  sources.push(...orgs.flatMap(org => org.records.map(record => ({ title: record.title, href: record.url, note: [record.date, `facts checked ${dateText(org.checked)}`].filter(Boolean).join("; ") }))));
  sources.push(...grants.map(grant => ({ title: grant.record.title, href: grant.record.url, note: grant.record.date })));

  sections.push(section("Before you reach out", [
    bullets(BEFORE_YOU_REACH_OUT.slice(0, 6).map(group => [{ text: `${group.title}: `, bold: true }, { text: group.items[0] }])),
    paragraph("Plan an engagement — program page /community-outreach/plan"),
  ]));
  return { sections, sources };
}

// ---------------------------------------------------------------- What the page publishes beneath the brief

function profileSections(profile: CommunityProfile): DocumentSection[] {
  return [
    section("Community profile", [
      paragraph("A fuller picture of community life in Minnesota, from public sources. It gives context for preparing questions and changing systems. It does not describe any individual."),
      ...profile.sections.flatMap((entry): DocumentBlock[] => [
        heading(entry.heading),
        ...markdownBlocks(parseResearchMarkdown(entry.body)),
        ...(entry.id === "businesses-and-commercial-life" && profile.businesses.length
          ? [
              heading("Businesses named in public sources"),
              paragraph("This list is a starting point, not a recommendation, and it is not complete. Check hours and details with the business."),
              table(["Name", "Type", "Place", "About", "Website", "Status"], profile.businesses.map(business => [business.name, business.type, business.place, business.about, business.href ?? "", business.status === "closed" ? "Closed. Kept here as part of the history." : business.status === "could not confirm open" ? "We could not confirm this is still open." : ""])),
            ]
          : []),
      ]),
      ...(profile.limits ? [heading("What the sources could not establish"), ...markdownBlocks(parseResearchMarkdown(profile.limits))] : []),
      ...(profile.sources ? [heading("Sources for this profile"), ...markdownBlocks(parseResearchMarkdown(profile.sources))] : []),
    ]),
  ];
}

function storyBlocks(item: ResearchPerson | ResearchInstitution, title: string): DocumentBlock[] {
  return [
    heading(title),
    ...item.body.map(text => paragraph(text)),
    ...(item.keyFacts?.length ? [paragraph([{ text: "Key dates and facts", bold: true }]), bullets(item.keyFacts)] : []),
    paragraph([{ text: "Connect this to your work: ", bold: true }, { text: item.connectToWork }]),
    sourceLine(item.sources),
  ];
}

function contextBlocks(context: ResearchContext): DocumentBlock[] {
  return [heading(context.heading), ...context.body.map(text => paragraph(text)), sourceLine(context.sources)];
}

function researchSections(research: CommunityResearch, access: MinnesotaAccess | null): DocumentSection[] {
  const sections: DocumentSection[] = [];
  if (research.people.length) {
    const groups = [
      { title: "Minnesota connections", items: research.people.filter(person => person.connection !== "beyond") },
      { title: "Beyond Minnesota", items: research.people.filter(person => person.connection === "beyond") },
    ].filter(group => group.items.length > 0);
    sections.push(section("People and contributions", [
      paragraph("These stories offer context. They do not describe any individual or represent every experience in a community."),
      ...groups.flatMap((group): DocumentBlock[] => [paragraph([{ text: group.title, bold: true }]), ...group.items.flatMap(person => storyBlocks(person, `${person.name} (${person.dates} · ${person.field})`))]),
    ]));
  }
  if (research.institutions.length) {
    sections.push(section("Institutions and history", research.institutions.flatMap(item => storyBlocks(item, [item.name, item.dates, item.type, item.location].filter(Boolean).join(" · ")))));
  }
  const routes = [...(research.disability.communityRoutes ?? []), ...(access?.routes ?? [])];
  sections.push(section("Disability and access", [
    paragraph(research.disability.intro),
    heading("Questions to ask the person"),
    bullets(research.disability.questions),
    ...(access ? [...contextBlocks(access.whoDefines), ...contextBlocks(access.whatTheLabelUnlocks)] : []),
    ...research.disability.context.flatMap(contextBlocks),
  ]));
  if (routes.length) {
    sections.push(section("Access routes in Minnesota", [
      table(["Route", "Purpose", "Link", "Checked"], routes.map(route => [route.name, route.purpose, route.href, dateText(route.checked)])),
      paragraph("Check current services and eligibility with the organization before making a connection."),
    ]));
  }
  const directoryGroups = [
    { title: "Minnesota organizations", kind: "organization", scope: "minnesota" },
    { title: "Minnesota media", kind: "media", scope: "minnesota" },
    { title: "National organizations", kind: "organization", scope: "national" },
    { title: "National media", kind: "media", scope: "national" },
  ] as const;
  sections.push(section("Organizations and media", [
    paragraph(research.organizations.intro),
    paragraph("These are starting points for learning. Check current services and eligibility with the organization before making a connection."),
    sourceLine(research.organizations.sources),
    table(
      ["Group", "Name", "Type", "Location", "Purpose", "Link", "Checked"],
      directoryGroups.flatMap(group =>
        research.organizations.entries
          .filter(entry => entry.kind === group.kind && entry.scope === group.scope)
          .map(entry => [group.title, entry.name, entry.type, entry.location, entry.purpose, entry.linkLabel ? `${entry.linkLabel}: ${entry.href}` : entry.href, dateText(entry.checked)]),
      ),
    ),
  ]));
  sections.push(section("About this page", [
    paragraph("This page gives context for preparing questions and changing systems. It is not evidence about any individual in planning, eligibility or investigation."),
    paragraph("To send a correction, use Find the right person (program page /support/right-person) and name this page and what needs to change."),
    paragraph(`Last checked: ${dateText(research.about.lastChecked)}.`),
    heading("Main sources for this page"),
    bullets(research.about.sources.map(source => `${source.label} (${source.href})`)),
  ]));
  return sections;
}

async function additionSections(id: string, research: CommunityResearch | null, scope: StaffProgramScope): Promise<DocumentSection[]> {
  const published = await publishedCommunityAddition(id, research, scope);
  if (!published) return [];
  const { addition, claims, supplements, showResource, hasStories } = published;
  const citations = (items: { label: string; href: string }[]) => paragraph(`Sources: ${items.map(item => `${item.label} (${item.href})`).join("; ")}`);
  return [
    section(hasStories ? "More to explore" : "Try it in your work", [
      hasStories ? paragraph("These examples offer context. They do not describe any individual or represent every experience in a community.") : null,
      ...claims.flatMap((claim): DocumentBlock[] => [heading(claim.title), paragraph(claim.text), citations(claim.citations)]),
      ...(supplements.length ? [paragraph([{ text: "More stories and context", bold: true }]), ...supplements.flatMap((item): DocumentBlock[] => [heading(item.heading), paragraph(item.text), citations(item.citations)])] : []),
      ...(showResource ? [heading("Community resource"), paragraph(`${addition.resource.description} ${addition.resource.label} (${addition.resource.href})`)] : []),
      hasStories ? heading("Try it in your work") : null,
      paragraph(addition.practice.question),
      paragraph([{ text: "Consider a response: ", bold: true }, { text: addition.practice.guidance }]),
    ]),
  ];
}

const AFTER_HUB_SECTIONS = new Set(["More context for your work", "Observances at work", "Continue the connection"]);

/** The whole community page: the brief, then the hub sections, then what the page publishes beneath it. */
export async function communityPageDocument(id: string, scope: StaffProgramScope): Promise<ResourceDocument | null> {
  const brief = await briefDocument(id, scope);
  if (!brief) return null;
  // Native pages: exactly what the page publishes. No figures, organizations or research are added.
  if (isNativeCommunityPage(id)) return brief;

  const hub = hubSections(id, brief.title);
  const insertAt = brief.sections.findIndex(entry => entry.heading !== undefined && AFTER_HUB_SECTIONS.has(entry.heading));
  const sections = [...brief.sections];
  sections.splice(insertAt < 0 ? sections.length : insertAt, 0, ...hub.sections);

  const research = await publishedCommunityResearch(id, scope);
  const profile = await publishedCommunityProfile(id, scope);
  sections.push(...(await additionSections(id, research, scope)));
  if (profile) sections.push(...profileSections(profile));
  if (research) sections.push(...researchSections(research, minnesotaAccess()));

  const seen = new Set<string>();
  const sources = [...(brief.sources ?? []), ...hub.sources].filter(source => {
    const key = `${source.title}|${source.href ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { ...brief, sections: compactSections(sections), sources };
}
