import type { Metadata } from "next";
import { PillarHub } from "@/components/pillar-hub";

export const metadata: Metadata = { title: "Communities" };

export default function CommunitiesPillar() {
  return <PillarHub
    id="communities"
    title="Communities"
    lede="Prepare to serve and work with the communities that call Minnesota home: their history, observances, organizations and the right way to connect."
    primary={{ label: "Open Minnesota communities", href: "/minnesota-communities" }}
    groups={[
      { title: "Prepare to serve", links: [
        { label: "Minnesota community briefs", href: "/minnesota-communities", description: "Background, history and sources for communities across the state." },
        { label: "Culture Calendar", href: "/minnesota-communities/calendar", description: "Observances with their sources, so meetings and deadlines respect what matters to people." },
        { label: "Tribal Nations", href: "/learn/tribal-referral", description: "Find the person or area responsible for Tribal relations and consultation." },
      ] },
      { title: "Engage a community", links: [
        { label: "Community Outreach and Engagement", href: "/community-outreach", description: "Prepare to meet a community, plan engagement and reach people." },
        { label: "Plan engagement", href: "/community-outreach/plan", description: "Work through who to involve, what they can influence and how they will hear back." },
        { label: "Community organizations", href: "/community-outreach/organizations", description: "A directory of organizations that work with Minnesota communities." },
        { label: "County agencies", href: "/community-outreach/county-agencies", description: "County partners and how they connect to DHS services." },
      ] },
      { title: "Connect at work", links: [
        { label: "Cultural Intelligence", href: "/learn/cultural-intelligence", description: "Build the skills to work well across cultures, including your own." },
        { label: "Employee resource groups", href: "/employee-resource-groups", description: "Groups open to all staff, including allies." },
        { label: "Minnesota agencies", href: "/minnesota-agencies", description: "State partners whose work connects with DHS." },
      ] },
    ]}
    note={<p>Community information is preparation, not a profile of the person in front of you. Each person is an individual. Tribal Nations pages stand as written, and government-to-government matters go to the person or area responsible.</p>}
  />;
}
