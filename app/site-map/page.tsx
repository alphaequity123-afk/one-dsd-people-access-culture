import Link from "@/components/app-link";
export const metadata = { title: "Site map" };

/** Owner decision 2026-11-22: the site map mirrors the menu and lists only live pages; retired addresses are not listed. */
const GROUPS: { title: string; links: [string, string][] }[] = [
  { title: "Start", links: [["Home", "/"], ["Your work", "/work"], ["Begin with equity", "/start"], ["How to use this site", "/user-guide"]] },
  { title: "Learn", links: [["Learn", "/learn"], ["Practice for the Moments That Matter", "/learn/self-directed"], ["Equity Analysis Toolkit", "/learn/equity-toolkit"], ["Disability services in practice", "/practice/disability"], ["Cultural Humility", "/trainings/cultural-humility"], ["Audio library", "/audio-library"]] },
  { title: "Leadership", links: [["One DSD Leadership", "/learn/leadership"], ["Leadership courses", "/learn/leadership/courses"], ["Simulations", "/learn/leadership/practice"], ["Areas of practice", "/learn/leadership/areas"], ["About this section", "/learn/leadership/about"]] },
  { title: "Library", links: [["Library", "/library"]] },
  { title: "Communities", links: [["Minnesota Communities", "/minnesota-communities"], ["Culture Calendar", "/calendar"], ["Community Outreach and Engagement", "/community-outreach"], ["Organizations connected with the Disability Services Division", "/community-outreach/organizations"], ["Minnesota county map", "/community-outreach/county-map"], ["Plan an engagement", "/community-outreach/plan"], ["County agencies", "/community-outreach/county-agencies"], ["Where to reach people", "/community-outreach/sources"], ["How the system connects", "/community-outreach/how-the-system-connects"], ["Policies that shape disability services", "/community-outreach/policies"], ["Providers and designated agencies", "/community-outreach/providers"]] },
  { title: "Prepare and review a piece of work", links: [["Equity reviews", "/equity-review"], ["Analyze a document", "/equity-review/analyze"], ["Plan a legislatively required working group", "/equity-review/working-group-plan"], ["ADSA goals planner", "/learn/equity-toolkit/goals"], ["Find the person or area responsible", "/support/right-person"]] },
  { title: "Help and information", links: [["Support", "/support"], ["How the program works", "/program/model"], ["Program charter", "/program-foundation"], ["About", "/about"]] },
];

export default function SiteMap() {
  return <article className="dsd-shell dsd-stage site-map-page"><header className="dsd-page-heading"><h1>Site map</h1><p>Find your way to every part of One DSD People, Access and Culture.</p></header>
    <div className="site-map-groups">{GROUPS.map((group, i) => <section key={group.title} aria-labelledby={`site-map-${i}`}><h2 id={`site-map-${i}`}>{group.title}</h2><ul className="dsd-model-list">{group.links.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul></section>)}</div>
  </article>;
}
