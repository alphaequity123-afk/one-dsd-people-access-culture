import Link from "next/link";
import { guides } from "@/lib/dsd-live/dsd-practice/guides";
import { sources } from "@/lib/dsd-live/dsd-practice/sources";
import "./practice.css";
export const metadata = { title: "Disability services in practice" };

// Owner decision 2026-11-22: calmer page. Guides in four short headed lists; sources in one section that opens on request.
const GROUPS: { title: string; ids: string[] }[] = [
  { title: "Support people’s choices", ids: ["community-living", "employment-first", "person-centered", "intercultural"] },
  { title: "Hiring and the workplace", ids: ["connect-700", "accessible-hiring", "orientation", "leadership"] },
  { title: "Communication and engagement", ids: ["communication", "outreach", "rights"] },
  { title: "Projects, data and resources", ids: ["service-design", "data", "funding"] },
];

export default function PracticeIndex() {
  const byId = new Map(guides.map(g => [g.id, g]));
  const grouped = new Set(GROUPS.flatMap(g => g.ids));
  const rest = guides.filter(g => !grouped.has(g.id)).map(g => g.id);
  const groups = rest.length ? [...GROUPS, { title: "More guides", ids: rest }] : GROUPS;
  return <div className="shell dsd-practice"><p className="crumbs"><Link href="/">Home</Link> / Practice</p><h1>Real decisions. Disability-informed practice.</h1><p className="reading">Prepare for the work of the Disability Services Division: supporting choice, improving access, hiring and developing colleagues, and making policy and resource decisions that affect people with disabilities. Start with the task you have. Each guide includes an illustrative scenario, feedback and a draft you can prepare.</p>
    <div className="practice-groups">{groups.map((group, i) => <section key={group.title} aria-labelledby={`practice-group-${i}`}><h2 id={`practice-group-${i}`}>{group.title}</h2><ul>{group.ids.flatMap(id => { const g = byId.get(id); return g ? [<li key={g.id}><Link href={`/practice/disability/${g.id}`}>{g.title}</Link></li>] : []; })}</ul></section>)}</div>
    <section className="practice-try" aria-labelledby="practice-try"><h2 id="practice-try">Try it</h2><ul>
      <li><Link href="/practice/plain-language">Rewrite it in plain language</Link><span>Turn dense notice language into words people can act on.</span></li>
      <li><Link href="/minnesota-communities/prepare">Prepare for a conversation</Link><span>A plan with questions to ask and access arrangements to make.</span></li>
      <li><Link href="/minnesota-communities/assumptions">Check your assumptions</Link><span>Twelve common assumptions, and what tends to be true instead.</span></li>
    </ul></section>
    <details id="sources" className="practice-sources"><summary>Sources behind the practice</summary><p>Public resources checked November 21, 2026. Follow the linked authority for current procedures. A resource’s inclusion does not imply a partnership or endorsement.</p><ul>{Object.entries(sources).map(([id, s]) => <li key={id}><a href={s.url}>{s.title}</a> <span className="meta">{s.type}</span></li>)}</ul></details></div>;
}
