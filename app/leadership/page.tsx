import type { Metadata } from "next";
import { PillarHub } from "@/components/pillar-hub";

export const metadata: Metadata = { title: "Leadership" };

export default function LeadershipPillar() {
  return <PillarHub
    id="leadership"
    title="Leadership"
    lede="For supervisors, managers and directors. Start from the decision or team moment in front of you, then find the approach, session plan or path that fits."
    primary={{ label: "What are you deciding?", href: "/leading" }}
    groups={[
      { title: "Lead your team", intro: "Ready-to-run help for the next meeting or hard conversation.", links: [
        { label: "Team kits", href: "/team-kits", description: "Session plans with timing and an agenda, from a 20-minute practice case to a fair hiring panel." },
        { label: "Leadership styles", href: "/learn/leadership-styles", description: "Compare approaches, including coaching, and when each one helps or gets in the way." },
        { label: "Conflict, from start to repair", href: "/learn/leadership-styles/conflict-lifecycle", description: "How conflict develops on a team and what a leader can do at each stage." },
        { label: "Leadership scenarios", href: "/learn/leadership-styles/scenarios", description: "Practice a realistic situation before you face a similar one." },
      ] },
      { title: "Grow as a leader", intro: "Longer learning for your own development.", links: [
        { label: "Suggested paths", href: "/leading/paths", description: "Paths for first-year supervisors, experienced leaders, managers of managers and senior leaders." },
        { label: "Your leadership journey", href: "/leading/journey", description: "Reflect on where you are and choose a next step." },
        { label: "Race and leadership", href: "/learn/leadership-styles/race-and-leadership", description: "How race and power shape leading a team in public service." },
        { label: "Capstone", href: "/learn/leadership-styles/capstone", description: "Bring what you have learned to a real piece of work." },
      ] },
      { title: "Leadership in DSD", links: [
        { label: "Equity leadership and growth", href: "/one-dsd/leadership", description: "How leaders in the Disability Services Division carry this work forward." },
        { label: "How leadership support works", href: "/leading/how-this-works", description: "What this area offers, and what stays with the person or area responsible." },
      ] },
    ]}
  />;
}
