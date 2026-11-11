import type { Metadata } from "next";
import Link from "next/link";
import { PARTNER_GROUP_LABEL, PUBLIC_PARTNERS, STATE_AGENCIES, agencyDisplayName } from "@/lib/content/state-agencies";
import { AgencyDirectory } from "@/components/agency-directory";

export const metadata: Metadata = { title: "State of Minnesota agencies" };

/** Every State of Minnesota agency, board and council, from the state's official directory, linked to its own site. */
export default function MinnesotaAgenciesPage() {
  const agencies = STATE_AGENCIES.map(agency => ({
    id: agency.id, name: agencyDisplayName(agency.name), href: agency.href, description: agency.description,
    connected: Boolean(agency.topics) && !agency.linkOnly,
  })).sort((a, b) => a.name.localeCompare(b.name));
  const partners = PUBLIC_PARTNERS.map(partner => ({
    id: partner.id, name: partner.name, href: partner.href, description: partner.description,
    connected: Boolean(partner.topics), group: PARTNER_GROUP_LABEL[partner.group],
  }));
  return <div className="calm">
    <h1>State of Minnesota agencies</h1>
    <p className="calm-lede">Every agency, board and council in the state&apos;s official directory, with a link to its own website. Search the list, or open an agency&apos;s connections to see the courses, policies and practices that relate to its work.</p>
    <AgencyDirectory agencies={agencies} />
    <h2 id="partners">Counties, the Legislature and federal partners</h2>
    <p>The county lead agencies that serve people locally, the Minnesota Legislature, and the federal agencies whose rules shape the work. Also see the <Link href="/community-outreach/county-agencies">county agency finder</Link> and <Link href="/explore/community/county-lead-agencies">how the county lead agencies connect to program work</Link>.</p>
    <AgencyDirectory agencies={partners} grouped label="Find a county or partner" placeholder="For example: Hennepin, Medicaid, civil rights" />
    <p className="calm-note">The list follows the official directory at <a href="https://mn.gov/portal/government/state/agencies-boards-commissions/">mn.gov</a>. Also see <Link href="/explore/community/state-agencies">how the agencies connect to this program</Link>.</p>
  </div>;
}
