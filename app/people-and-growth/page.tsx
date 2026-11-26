import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PillarHub, type PillarGroup } from "@/components/pillar-hub";
import { catalogForEngine, type CatalogItem } from "@/lib/program/catalog";

export const metadata: Metadata = { title: "People and Growth" };

/**
 * People and Growth engine (owner direction 2026-11-26): mentoring, career resources and team development get a home
 * of their own, ready for the next build wave. Today it gathers what the program already has, from the catalog, so
 * every new course or guide tagged for this engine appears here without another page being written.
 */
const GROUPS: { title: string; intro: string; match: RegExp }[] = [
  { title: "Mentoring and sponsorship", intro: "Learn from each other, and open doors for colleagues.", match: /mentor|sponsor|peer learning/i },
  { title: "Career growth", intro: "See the paths ahead, and the conversations that help people move along them.", match: /career|advancement|stretch|succession|pay, classification|development plan/i },
  { title: "Coaching and supervision", intro: "Help the people you supervise grow, and share the work fairly.", match: /coach|delegat|supervis/i },
  { title: "Building strong teams", intro: "Trust, norms, healthy conflict and repair, for teams in the office, at home or both.", match: /team|hybrid|psychological safety|repair|wellbeing|workload/i },
  { title: "Welcoming and keeping people", intro: "A good start, and the knowledge that stays when people move on.", match: /onboard|welcom|first 90|knowledge|generations|engagement survey/i },
];

function links(items: CatalogItem[]) {
  return items.map(item => ({ label: item.title, href: item.href }));
}

export default function PeopleAndGrowth() {
  const items = catalogForEngine("people-growth");
  const used = new Set<string>();
  const groups: PillarGroup[] = GROUPS.map(group => {
    const members = items.filter(item => !used.has(item.id) && group.match.test(item.title));
    members.forEach(item => used.add(item.id));
    return { title: group.title, intro: group.intro, links: links(members) };
  }).filter(group => group.links.length);
  const rest = items.filter(item => !used.has(item.id));
  if (rest.length) groups.push({ title: "More for growing together", links: links(rest) });
  groups.push({ title: "Gather with colleagues", links: [
    { label: "Amplify Equity mentoring", href: "/one-dsd/amplify/mentoring", description: "A conversation with a colleague about a work question, practical know-how or a development opportunity." },
    { label: "Growth paths by role", href: "/growth", description: "A suggested start, apply and lead sequence for your role." },
    { label: "Employee resource groups", href: "/employee-resource-groups", description: "Groups open to all staff, including allies." },
  ] });
  return <PillarHub
    id="people-and-growth"
    title="People and Growth"
    lede="Mentoring, career growth and strong teams, all in one place. This part of the program is growing, and everything here is voluntary: nothing is tracked, scored or counted toward training credit."
    primary={{ label: "Explore growth paths by role", href: "/growth" }}
    groups={groups}
    note={<p>Questions about pay, classification, reassignment or a formal concern belong with DHS Human Resources and Labor Relations. Find the right person on <Link href="/about#support">About and help</Link>.</p>}
  />;
}
