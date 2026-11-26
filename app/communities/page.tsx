import type { Metadata } from "next";
import { PillarHub } from "@/components/pillar-hub";

export const metadata: Metadata = { title: "Communities" };

/** Communities pillar. Owner decision 2026-11-25: wording and organization follow the Gemini overhaul. */
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
    note={<p><strong>Using a community brief without profiling anyone:</strong> briefs give historical and cultural context so you can ask better questions. Always ask each person directly what access and communication work best for them. Tribal Nations pages stand as written, and government-to-government matters go to the person or area responsible.</p>}
  />;
}
