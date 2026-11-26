import Link from "next/link";
import { competencies, pageHref } from "@/lib/dsd-live/leadership/program";
import { practiceCases } from "@/lib/dsd-live/leadership/practice";
import { areaSlug } from "@/lib/dsd-live/leadership/areas";
import { currentUnit } from "@/lib/dsd-live/unit";

export function generateMetadata() {
  return { title: `Areas of practice · ${currentUnit().short} Leadership` };
}

const introductions: Record<string, string> = {
  "leading-self": "Examine how your own reactions, assumptions and choices affect the people who rely on you.",
  "leading-others": "Practice feedback, delegation and coaching when people have different levels of authority.",
  "leading-the-organization": "Connect priorities and spending decisions to the conditions staff and residents actually experience.",
  "leading-outside-the-organization": "Work with partners and communities. Make clear what they can influence and how you will report back.",
  "getting-work-done": "Examine a handoff, plan a project or test whether a change makes a service easier to use.",
  "leading-with-deai": "Make sure opportunities and services are open, accessible and fair to everyone they are meant for.",
};
const routes = [
  { title: "Exploring leadership", description: "Start with a decision you can influence without supervising anyone.", id: "article_05", label: "Grow as an individual contributor" },
  { title: "Leading a team", description: "Work through a concern raised by someone who depends on you for assignments and feedback.", id: "article_19", label: "When a concern keeps coming back" },
  { title: "Leading across programs", description: "Examine the tradeoffs when a decision in one unit changes what another can deliver.", id: "article_34", label: "Turn a strategic priority into a plan" },
];

/** Areas of practice and starting points by responsibility, moved here from the Leadership landing page so it stays short. */
export default function LeadershipAreas() {
  const section = `${currentUnit().short} Leadership`;
  return <>
    <header className="article-layout article-head">
      <Link className="article-tag" href="/learn/leadership">{section}</Link>
      <h1>Areas of practice</h1>
      <p className="article-lede">Start with the responsibility you hold, or choose an area of practice. Each area brings together readings you can take in any order and a scenario to try.</p>
    </header>
    <section aria-labelledby="roles-title" className="leadership-styles">
      <h2 id="roles-title">Start with the responsibility you hold</h2>
      <div className="leadership-roles">{routes.map(role => <div key={role.id} className="leadership-card"><h3>{role.title}</h3><p>{role.description}</p><Link href={pageHref(role.id)}>{role.label}</Link></div>)}</div>
      <p><Link href={pageHref("roles")}>Find a decision by job family</Link> · <Link href={pageHref("lifecycle")}>Explore the employee life cycle</Link> · <Link href="/learn/paths#level-leading">Experienced leader learning path</Link></p>
    </section>
    <section aria-labelledby="areas" className="leadership-styles">
      <h2 id="areas">Areas of practice</h2>
      <div className="leadership-library">{competencies.map(area => {
        const practice = practiceCases.find(item => item.id === area.id);
        return <section className="leadership-card" id={areaSlug(area.id)} key={area.id}><h3>{area.title}</h3><p>{introductions[area.id]}</p>
          <p><Link href={pageHref(area.articleIds[0])}>Start reading</Link></p>
          {practice && <Link href={`/learn/leadership/practice/${areaSlug(area.id)}`}>Practice: {practice.title}</Link>}
        </section>;
      })}</div>
    </section>
  </>;
}
