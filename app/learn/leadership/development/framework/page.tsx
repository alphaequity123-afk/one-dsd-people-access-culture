import Link from "next/link";
import { MODULES, moduleHref } from "@/lib/dsd-live/leadership/development/modules";
import { ORIENTATIONS, PROGRAM_ROOT, SOURCES } from "@/lib/dsd-live/leadership/development/framework";
import { AskForm } from "@/components/dsd-live/ask-form";
export const metadata = { title: "Intercultural development and leadership: the crosswalk" };
export default function FrameworkPage() {
  return <><nav className="crumbs" aria-label="Breadcrumb"><Link href={PROGRAM_ROOT}>Inclusive leadership in practice</Link> › Intercultural crosswalk</nav>
    <header className="development-hero"><h1>Intercultural development belongs in every leadership decision</h1><p>Explore how different ways of interpreting cultural similarities and differences can shape a leadership decision. Then practice a response that makes participation and access possible.</p></header>
    <section className="development-reading"><h2>What the framework contributes</h2><p>The Intercultural Development Inventory (IDI) uses the Intercultural Development Continuum to describe approaches to cultural similarities and differences. The cases here show how those approaches can inform leadership decisions.</p><p>Your IDI results, debrief and development plan are yours to reflect on privately. These examples help you explore the framework; they cannot identify anyone's orientation.</p></section>
    <section><h2>Five orientations, questions for practice</h2>{ORIENTATIONS.map(o => <article key={o.id} className="development-stage" id={o.id}><h3>{o.name}</h3><p>{o.meaning}</p><p><strong>Ask:</strong> {o.question}</p><p><strong>Practice:</strong> {o.practice}</p></article>)}</section>
    <section><h2>How the crosswalk works</h2><p>Each module brings a leadership decision to life through different responses, a chance to rehearse and a tool you can use at work. The five orientations help you consider what may be shaping the reasoning. Ask can draw on these connections as you explore a question.</p><p>For example, an assignment exercise examines whether an identical invitation overlooks different access to preparation time. The next step is to improve the invitation and support, not to identify the supervisor's orientation.</p><div className="development-grid">{MODULES.map(m => <article key={m.id} className="development-card"><h3><Link href={moduleHref(m.id)}>{m.title}</Link></h3><p>{m.objective}</p><p><strong>Take away:</strong> {m.tool.title}</p><p><strong>Revisit:</strong> {m.review}</p></article>)}</div></section>
    <section><h2>Sources and scope</h2><ul>{SOURCES.map(s => <li key={s.id}><a href={s.url}>{s.title}</a><p>{s.use}</p></li>)}</ul><p>The cases are fictional. When you apply an idea at work, consider who can make the decision and what support is needed. Return to the people affected to learn what changed.</p></section>
    <section><h2>Ask about the framework</h2><AskForm compact leadershipModule="orientations-in-decisions"/></section>
  </>;
}
