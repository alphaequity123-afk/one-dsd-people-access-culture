import Link from "next/link";
import CountyMap from "./county-map";
import figures from "@/lib/content/hub/community-figures.json";
import { COMMUNITY_CROSSWALK_BY_ID, communityFigureGroups, type CommunityFigureGroup } from "@/lib/content/hub/community-crosswalk";
import { isNativeCommunity, organizationHref, organizationsForCommunity, relationshipLine } from "@/lib/content/hub/organizations";
import { BEFORE_YOU_REACH_OUT } from "@/lib/content/hub/before-you-reach-out";
import { DEPARTMENT_WIDE_GRANTS } from "@/lib/content/hub/record-findings";
import { DISABILITY_BRIEF_SOURCE, FIGURES_PER_100_NOTE, FIGURES_SOURCE, FIGURE_MEASURES, groupFigureText } from "@/lib/content/hub/community-figures-format";

// Sections added to each community page: dated figures, organizations on record,
// and the questions to answer before reaching out. Native community pages get
// none of this (owner rule: those pages defer to the Office of Indian Affairs).

const MEASURES = FIGURE_MEASURES;
const SOURCE = FIGURES_SOURCE;
const DISABILITY_SOURCE = DISABILITY_BRIEF_SOURCE;

function FigureTable({ group }: { group: CommunityFigureGroup }) {
  return <div className="community-table" role="region" aria-label={`Figures for ${group.name} Minnesotans`} tabIndex={0}>
    <table>
      <caption>{group.name} Minnesotans, statewide, {figures.surveyYears}</caption>
      <thead><tr><th scope="col">Measure</th><th scope="col">Figure</th></tr></thead>
      <tbody>{MEASURES.map(measure => <tr key={measure.key}>
        <th scope="row">{measure.label}</th>
        <td>{groupFigureText(group, measure)}</td>
      </tr>)}</tbody>
    </table>
    {"definition" in group && group.definition ? <p className="text-sm">Who is counted: {String(group.definition)}</p> : null}
  </div>;
}

/** All three sections in their original order. Native community pages get none. */
export function CommunityHubSections({ id, title }: { id: string; title: string }) {
  if (isNativeCommunity(id)) return null;
  return <>
    <CommunityNumbersSection id={id} />

    <CommunityOrganizationsSection id={id} title={title} />

    <CommunityBeforeOutreachSection id={id} />
  </>;
}

export function CommunityNumbersSection({ id }: { id: string }) {
  if (isNativeCommunity(id)) return null;
  const crosswalk = COMMUNITY_CROSSWALK_BY_ID.get(id);
  const groups = communityFigureGroups(id);
  return <section id="community-numbers" aria-labelledby="community-numbers-title">
      <h2 id="community-numbers-title">Numbers, with care</h2>
      <p>Figures describe groups and conditions, not any one person. Read how people differ within this community before you read the numbers.</p>
      {groups.length ? <>
        {crosswalk?.match === "approximate" ? <p><strong>How these figures differ from this page:</strong> {crosswalk.note}</p> : null}
        {groups.map(group => <FigureTable key={group.name} group={group} />)}
        <p className="text-sm">{FIGURES_PER_100_NOTE} {figures.comparabilityNote} {figures.periodNote}</p>
        <p className="text-sm">Source: <a href={SOURCE.url}>{SOURCE.title}</a>, {SOURCE.publisher}, {SOURCE.date}. {SOURCE.dataSource}</p>
        <p className="text-sm">Disability counts not shown in that report come from <a href={DISABILITY_SOURCE.url}>{DISABILITY_SOURCE.title}</a>, {DISABILITY_SOURCE.publisher}, {DISABILITY_SOURCE.date}.</p>
      </> : <p>{crosswalk?.note ?? "The Minnesota State Demographic Center report does not give separate figures for this community."}</p>}
      {crosswalk?.equityGroup && crosswalk.equityGroup !== "all" ? <>
        <p>The map below shows the broader group that includes this community, county by county. It is a wider group than this page, so read it as context.</p>
        <CountyMap fixedGroup={crosswalk.equityGroup} initialMeasure="comparison" compact heading="Minnesota counties" headingLevel={3} />
      </> : null}
      <p><Link href={crosswalk?.equityGroup && crosswalk.equityGroup !== "all" ? `/community-outreach/county-map?group=${crosswalk.equityGroup}` : "/community-outreach/county-map"}>Open the full Minnesota county map</Link></p>
    </section>;
}

export function CommunityOrganizationsSection({ id, title }: { id: string; title: string }) {
  if (isNativeCommunity(id)) return null;
  const orgs = organizationsForCommunity(id);
  return <section id="community-organizations" aria-labelledby="community-organizations-title">
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
    </section>;
}

export function CommunityBeforeOutreachSection({ id }: { id: string }) {
  if (isNativeCommunity(id)) return null;
  return <section id="community-before-outreach" aria-labelledby="community-before-outreach-title">
      <h2 id="community-before-outreach-title">Before you reach out</h2>
      <ul>{BEFORE_YOU_REACH_OUT.slice(0, 6).map(group => <li key={group.title}><strong>{group.title}:</strong> {group.items[0]}</li>)}</ul>
      <p><Link href="/community-outreach/plan">Plan an engagement</Link> · <Link href="/community-outreach">Community Outreach and Engagement</Link></p>
    </section>;
}
