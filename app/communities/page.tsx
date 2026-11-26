import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PillarHub } from "@/components/pillar-hub";
import styles from "@/components/pillar-hub.module.css";

export const metadata: Metadata = { title: "Communities" };

/**
 * Communities pillar. Owner decisions 2026-11-25/26: wording and organization follow the Gemini overhaul and the
 * v2 prototype — the profiling reminder near the top, a search of the community briefs, the DHS human-centered
 * equity framework (its three stages named as in the DHS Equity Policy 2.0), disability-led partners, and how
 * Minnesota's disability system connects.
 */
const PROFILING_REMINDER = <><strong>Using a community brief without profiling anyone:</strong> briefs give historical and cultural context so you can ask better questions. Always ask each person directly what access and communication work best for them.</>;
/** Disability-led and disability-rights organizations, with their own sites (sources already used in this program). */
const RIGHTS_PARTNERS = [
  { name: "Advocating Change Together", href: "https://selfadvocacy.org/", text: "A Minnesota self-advocacy organization run by and for people with developmental and other disabilities." },
  { name: "Autistic Self Advocacy Network", href: "https://autisticadvocacy.org/", text: "A national organization run by and for autistic people, with plain-language policy toolkits." },
  { name: "Minnesota Disability Law Center", href: "https://mylegalaid.org/disability-law-center", text: "Mid-Minnesota Legal Aid's statewide legal advocacy for the civil rights of people with disabilities." },
];
export default function CommunitiesPillar() {
  return <PillarHub
    id="communities"
    title="Minnesota Communities"
    lede="Learn about the communities and places that make up Minnesota: their histories, perspectives and the observances that matter to them. Use what you learn to ask better questions and plan work together."
    primary={{ label: "Open the community briefs", href: "/minnesota-communities" }}
    groups={[
      { title: "Prepare to serve", links: [
        { label: "Minnesota community briefs", href: "/minnesota-communities", description: "Historical and cultural context, with sources, for communities across the state." },
        { label: "Check your assumptions", href: "/minnesota-communities/assumptions", description: "Twelve common assumptions, and what tends to be true instead." },
        { label: "Culture Calendar", href: "/minnesota-communities/calendar", description: "Check a date against observances and holidays before you schedule." },
      ] },
      { title: "Plan a conversation or engagement", links: [
        { label: "Prepare for a conversation", href: "/minnesota-communities/prepare", description: "Plan a community meeting or a conversation about services, with questions and access arrangements ready." },
        { label: "Community Outreach and Engagement", href: "/community-outreach", description: "Prepare to meet a community, plan engagement and reach people." },
        { label: "Community organizations", href: "/community-outreach/organizations", description: "A directory of organizations that work with Minnesota communities." },
        { label: "County agencies", href: "/community-outreach/county-agencies", description: "County partners and how they connect to DHS services." },
      ] },
      { title: "Government-to-government and partners", links: [
        { label: "Tribal Nations", href: "/learn/tribal-referral", description: "Minnesota's 11 Tribal Nations are sovereign governments. Find the person or area responsible for Tribal relations and consultation." },
        { label: "Minnesota agencies", href: "/minnesota-agencies", description: "State partners whose work connects with DHS." },
        { label: "Employee resource groups", href: "/employee-resource-groups", description: "Groups open to all staff, including allies." },
      ] },
    ]}
    lead={<>
      <div className={styles.reminder} role="note"><p>{PROFILING_REMINDER}</p></div>
      <form action="/minnesota-communities" method="get" role="search" className={styles.search}>
        <label>Search the community briefs<input name="q" type="search" autoComplete="off" placeholder="For example: Hmong, Somali, Deaf, Anishinaabe" /></label>
        <button type="submit">Search</button>
      </form>
    </>}
    note={<p>Tribal Nations pages stand as written, and government-to-government matters go to the person or area responsible.</p>}
  >
    <section className={styles.panel} aria-labelledby="co-creation-title">
      <h2 id="co-creation-title">Work with communities, not just about them</h2>
      <p>The DHS Equity Policy&apos;s human-centered equity framework asks you to confer early and, if at all possible, gather information from the people a decision affects. It has three stages.</p>
      <ol>
        <li><strong>Research identification.</strong> Before you draft, talk with the people affected, staff and partners to find the barriers you might miss.</li>
        <li><strong>Development co-creation.</strong> Share the work of shaping formats, language access and timing.</li>
        <li><strong>Implementation with joint feedback loop.</strong> Report back how people&apos;s input shaped the result, and keep listening.</li>
      </ol>
      <p><Link href="/minnesota-communities/prepare">Prepare for a conversation</Link> or <Link href="/community-outreach/plan">plan an engagement</Link> to put these stages to work.</p>
    </section>
    <section className={styles.panel} aria-labelledby="rights-partners-title">
      <h2 id="rights-partners-title">Disability-led organizations and rights</h2>
      <p>Learn from organizations led by disabled people and from those that protect disability rights. Each opens on its own site.</p>
      <ul>{RIGHTS_PARTNERS.map(partner => <li key={partner.href}><Link href={partner.href} original><strong>{partner.name}</strong></Link>: {partner.text}</li>)}</ul>
    </section>
    <section className={styles.panel} aria-labelledby="system-title">
      <h2 id="system-title">How Minnesota&apos;s disability system connects</h2>
      <p>Minnesota disability services are state-supervised and county-administered. DHS sets policy and pays for services, the Disability Services Division leads the disability programs, lead agencies (counties, and some Tribal Nations and health plans under contract with DHS) assess people and manage their services, and licensed providers deliver them.</p>
      <p><Link href="/community-outreach/how-the-system-connects">See how the parts connect, with a source for each point</Link></p>
    </section>
  </PillarHub>;
}
