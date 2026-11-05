import Link from "next/link";
import CountyMap from "./county-map";
import figures from "@/lib/content/hub/community-figures.json";
import { COMMUNITY_CROSSWALK_BY_ID, communityFigureGroups, type CommunityFigureGroup } from "@/lib/content/hub/community-crosswalk";
import { isNativeCommunity, organizationHref, organizationsForCommunity, relationshipLine } from "@/lib/content/hub/organizations";
import { BEFORE_YOU_REACH_OUT } from "@/lib/content/hub/before-you-reach-out";
import { DEPARTMENT_WIDE_GRANTS } from "@/lib/content/hub/record-findings";

// Sections added to each community page: dated figures, organizations on record,
// and the questions to answer before reaching out. Native community pages get
// none of this (owner rule: those pages defer to the Office of Indian Affairs).

type Figure = { status: string; estimate?: number; marginOfError?: number; universeCount?: number; percentOfMinnesota?: number; note?: string };
type Measure = { key: string; label: string; table: string; page: number; universe: string; unit: string; note?: string };

const MEASURES = (figures.measures as Measure[]).filter(m => m.key !== "households");
const SOURCE = figures.sources.chartbook;
const number = (n: number) => n.toLocaleString("en-US");

function value(measure: Measure, figure: Figure | undefined) {
  if (!figure || figure.status !== "published" || figure.estimate === undefined) {
    return figure?.status === "suppressed" ? "Not shown: too few survey responses" : "Not available";
  }
  const money = measure.unit === "dollars";
  const main = money ? `$${number(figure.estimate)}` : `${number(figure.estimate)} people`;
  const moe = figure.marginOfError !== undefined ? ` (give or take ${money ? "$" : ""}${number(figure.marginOfError)})` : "";
  const share = figure.universeCount ? ` out of ${number(figure.universeCount)}, about ${Math.round((figure.estimate / figure.universeCount) * 100)} in 100` : "";
  const ofState = figure.percentOfMinnesota !== undefined ? `, ${figure.percentOfMinnesota}% of Minnesotans` : "";
  return `${main}${moe}${share}${ofState}`;
}

type BriefValue = { group: string; status: string; estimate?: number | null };
const DISABILITY_BRIEF = figures.disabilityBrief as unknown as { groups: BriefValue[] };
const DISABILITY_SOURCE = figures.sources.disabilityBrief;

/** When the chartbook hides a group's disability count, the February 2026 disability brief may print one. */
function disabilityFromBrief(groupName: string): string | null {
  const row = DISABILITY_BRIEF.groups.find(item => item.group === groupName);
  if (!row || row.status !== "published" || row.estimate == null) return null;
  return `${number(row.estimate)} people, from the disability brief (${DISABILITY_SOURCE.date}). Few survey responses and no printed margin of error, so read with extra caution.`;
}

function FigureTable({ group }: { group: CommunityFigureGroup }) {
  const groupFigures = group.figures as Record<string, Figure>;
  return <div className="community-table" role="region" aria-label={`Figures for ${group.name} Minnesotans`} tabIndex={0}>
    <table>
      <caption>{group.name} Minnesotans, statewide, {figures.surveyYears}</caption>
      <thead><tr><th scope="col">Measure</th><th scope="col">Figure</th></tr></thead>
      <tbody>{MEASURES.map(measure => <tr key={measure.key}>
        <th scope="row">{measure.label}</th>
        <td>{measure.key === "disabilityAges18to64" && groupFigures[measure.key]?.status !== "published" && disabilityFromBrief(group.name)
          ? disabilityFromBrief(group.name) : value(measure, groupFigures[measure.key])}</td>
      </tr>)}</tbody>
    </table>
    {"definition" in group && group.definition ? <p className="text-sm">Who is counted: {String(group.definition)}</p> : null}
  </div>;
}

export function CommunityHubSections({ id, title }: { id: string; title: string }) {
  if (isNativeCommunity(id)) return null;
  const crosswalk = COMMUNITY_CROSSWALK_BY_ID.get(id);
  const groups = communityFigureGroups(id);
  const orgs = organizationsForCommunity(id);
  return <>
    <section id="community-numbers" aria-labelledby="community-numbers-title">
      <h2 id="community-numbers-title">Numbers, with care</h2>
      <p>Figures describe groups and conditions, not any one person. Read how people differ within this community before you read the numbers.</p>
      {groups.length ? <>
        {crosswalk?.match === "approximate" ? <p><strong>How these figures differ from this page:</strong> {crosswalk.note}</p> : null}
        {groups.map(group => <FigureTable key={group.name} group={group} />)}
        <p className="text-sm">&ldquo;About N in 100&rdquo; is worked out from the report&apos;s published counts; the report itself prints counts, not percentages. {figures.comparabilityNote} {figures.periodNote}</p>
        <p className="text-sm">Source: <a href={SOURCE.url}>{SOURCE.title}</a>, {SOURCE.publisher}, {SOURCE.date}. {SOURCE.dataSource}</p>
        <p className="text-sm">Disability counts not shown in that report come from <a href={DISABILITY_SOURCE.url}>{DISABILITY_SOURCE.title}</a>, {DISABILITY_SOURCE.publisher}, {DISABILITY_SOURCE.date}.</p>
      </> : <p>{crosswalk?.note ?? "The Minnesota State Demographic Center report does not give separate figures for this community."}</p>}
      {crosswalk?.equityGroup && crosswalk.equityGroup !== "all" ? <>
        <p>The map below shows the broader group that includes this community, county by county. It is a wider group than this page, so read it as context.</p>
        <CountyMap fixedGroup={crosswalk.equityGroup} initialMeasure="comparison" compact heading="Minnesota counties" headingLevel={3} />
      </> : null}
      <p><Link href={crosswalk?.equityGroup && crosswalk.equityGroup !== "all" ? `/community-outreach/county-map?group=${crosswalk.equityGroup}` : "/community-outreach/county-map"}>Open the full Minnesota county map</Link></p>
    </section>

    <section id="community-organizations" aria-labelledby="community-organizations-title">
      <h2 id="community-organizations-title">Organizations connected with the Disability Services Division</h2>
      {orgs.length ? <>
        <p>These organizations have a published record of working with the Disability Services Division, and their records name work with {title}. No organization speaks for a whole community.</p>
        <ul className="community-link-list">{orgs.map(org => <li key={org.slug}>
          <Link href={organizationHref(org.slug)}>{org.name}</Link>{org.closed ? " (closed)" : ""}
          <span> · {org.withTheDivision.map(relationshipLine).join("; ")}</span>
        </li>)}</ul>
      </> : <p>No organization with a published record of working with the Disability Services Division names this community in its records. That is a finding about the records, not about the community.</p>}
      {DEPARTMENT_WIDE_GRANTS.some(grant => grant.communities.includes(id)) ? <>
        <h3>Also on record with the Department of Human Services</h3>
        <ul>{DEPARTMENT_WIDE_GRANTS.filter(grant => grant.communities.includes(id)).map(grant => <li key={grant.organizations}>{grant.organizations}: {grant.program}, {grant.years}. <a href={grant.record.url}>Record</a></li>)}</ul>
      </> : null}
      <p><Link href="/community-outreach/organizations">See all organizations</Link></p>
    </section>

    <section id="community-before-outreach" aria-labelledby="community-before-outreach-title">
      <h2 id="community-before-outreach-title">Before you reach out</h2>
      <ul>{BEFORE_YOU_REACH_OUT.slice(0, 6).map(group => <li key={group.title}><strong>{group.title}:</strong> {group.items[0]}</li>)}</ul>
      <p><Link href="/community-outreach/plan">Plan an engagement</Link> · <Link href="/community-outreach">Community Outreach and Engagement</Link></p>
    </section>
  </>;
}
