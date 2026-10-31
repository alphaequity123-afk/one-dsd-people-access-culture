import Link from "next/link";
import type { CommunityBusiness, CommunityProfile } from "@/lib/content/community-profile";
import { Disclosure } from "./community-research-sections";
import { ResearchMarkdown } from "./research-markdown";

const BUSINESS_STATUS: Record<string, string> = {
  "could not confirm open": "We could not confirm this is still open.",
  closed: "Closed. Kept here as part of the history.",
};

function Businesses({ businesses }: { businesses: CommunityBusiness[] }) {
  return <>
    <h3>Businesses named in public sources</h3>
    <p>This list is a starting point, not a recommendation, and it is not complete. Check hours and details with the business.</p>
    <ul className="research-business-list">{businesses.map(business => <li key={`${business.name}-${business.place}`}>
      {business.href ? <a href={business.href}>{business.name}</a> : <strong>{business.name}</strong>}
      <p className="research-business-meta">{[business.type, business.place].filter(Boolean).join(" · ")}</p>
      <p>{business.about}</p>
      {BUSINESS_STATUS[business.status] ? <p className="research-business-meta">{BUSINESS_STATUS[business.status]}</p> : null}
    </li>)}</ul>
  </>;
}

/** The full community profile, shown beneath the page's existing content. */
export function CommunityProfileSections({ profile }: { profile: CommunityProfile }) {
  return <section id="community-profile" aria-labelledby="community-profile-title" className="community-research">
    <h2 id="community-profile-title">Community profile</h2>
    <p>A fuller picture of community life in Minnesota, from public sources. It gives context for preparing questions and changing systems. It does not describe any individual.</p>
    {profile.sections.map((section, index) => <Disclosure key={section.id} id={`profile-${section.id}`} level={3} title={section.heading} open={index === 0}>
      <ResearchMarkdown markdown={section.body} />
      {section.id === "businesses-and-commercial-life" && profile.businesses.length ? <Businesses businesses={profile.businesses} /> : null}
      {section.id === "celebrations-and-observances" ? <p><Link href={`/minnesota-communities/calendar?community=${profile.communityId}&month=all`}>See these dates in the cultural calendar</Link></p> : null}
    </Disclosure>)}
    {profile.limits ? <Disclosure id="profile-limits" level={3} title="What the sources could not establish"><ResearchMarkdown markdown={profile.limits} /></Disclosure> : null}
    {profile.sources ? <Disclosure id="profile-sources" level={3} title="Sources for this profile"><ResearchMarkdown markdown={profile.sources} /></Disclosure> : null}
  </section>;
}
