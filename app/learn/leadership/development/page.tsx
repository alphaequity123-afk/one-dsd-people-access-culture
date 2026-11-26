import Link from "next/link";
import Image from "next/image";
import { MODULES, moduleHref } from "@/lib/dsd-live/leadership/development/modules";
import { PROGRAM_GUIDANCE, PROGRAM_ROOT, PROGRAM_TITLE, RESPONSIBILITIES, STAGES } from "@/lib/dsd-live/leadership/development/framework";
import { currentUnit } from "@/lib/dsd-live/unit";
import { AskForm } from "@/components/dsd-live/ask-form";

export const metadata = { title: PROGRAM_TITLE };
export default function DevelopmentHome() {
  return <>
    <nav aria-label="Breadcrumb" className="crumbs"><Link href="/learn/leadership">{currentUnit().short} Leadership</Link> › Development program</nav>
    <header className="development-hero development-intro"><div><p className="development-kicker">Leadership development</p><h1>{PROGRAM_TITLE}</h1>
      <p>Develop the judgment and skills to use authority responsibly, work across cultural differences and change conditions that limit opportunity and access.</p>
      <p>Begin with a decision you can influence. Practice with a case, apply a tool, and return to what happened. Build toward changes in how teams, programs and the organization work.</p>
      <div className="development-actions"><Link className="button" href={moduleHref(MODULES[0].id)}>Begin the sequence</Link><Link href={`${PROGRAM_ROOT}/framework`}>Explore the intercultural crosswalk</Link><Link href={`${PROGRAM_ROOT}/facilitate`}>Run the program with a team</Link></div>
      </div><figure className="development-intro-image"><Image src="/images/leadership-development/leadership-working-session.png" alt="Four colleagues, two seated and two standing, consider a decision together at a computer while one colleague explains a point on the screen." width={1536} height={1024} priority sizes="(max-width:760px) 94vw, 540px"/><figcaption>Illustrative leadership working session.</figcaption></figure>
    </header>
    <section><h2>A development sequence with room to enter</h2><p>{PROGRAM_GUIDANCE.sequence}</p><p>{PROGRAM_GUIDANCE.pace}</p>
      <div className="development-grid">{RESPONSIBILITIES.map(r => <article className="development-card" key={r.id}><h3>{r.title}</h3><p>{r.task}</p></article>)}</div>
    </section>
    <section aria-labelledby="sequence-title"><h2 id="sequence-title">Six stages, twenty-four applied modules</h2><p>Build from everyday decisions to lasting changes in your organization.</p>
      {STAGES.map((stage, i) => <section key={stage.id} className="development-stage" id={stage.id}><p className="development-kicker">Stage {i + 1}</p><h3>{stage.title}</h3><p>{stage.purpose}</p>
        <ol>{MODULES.filter(m => m.stage === stage.id).map(m => <li key={m.id}><Link href={moduleHref(m.id)}>{m.title}</Link><p>{m.objective}</p></li>)}</ol>
        <p className="development-check"><strong>Practice review:</strong> {stage.checkpoint}</p></section>)}
    </section>
    <section><h2>Racism and anti-racism in practice</h2><p>Explore how racism shapes workplace and service decisions, and practice ways to respond and change the conditions people experience.</p><Link href="/learn/racism-and-antiracism">Explore the One DSD collection</Link></section>
    <section><h2>Explore communication and community values</h2><p>How do workplace expectations shape whose concerns are heard? <Link href={`${PROGRAM_ROOT}/communication`}>Explore the collection</Link>, including <Link href={`${PROGRAM_ROOT}/tone-policing`}>tone policing</Link>.</p></section>
    <section><h2>What makes this equity-centered</h2><p>{PROGRAM_GUIDANCE.partnership}</p><p>{PROGRAM_GUIDANCE.evidence}</p><p>{PROGRAM_GUIDANCE.privacy}</p></section>
    <section><h2>Continue with Ask</h2><p>Ask about a leadership decision, a curriculum concept or how to choose a starting point. Suggested follow-up questions help you examine, rehearse and apply the learning.</p><AskForm compact leadershipModule="purpose-and-power" /></section>
  </>;
}
