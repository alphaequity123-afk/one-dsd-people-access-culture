import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MODULES, moduleById, moduleHref } from "@/lib/dsd-live/leadership/development/modules";
import { ORIENTATIONS, PROGRAM_ROOT, STAGES } from "@/lib/dsd-live/leadership/development/framework";
import { getStyle, styleHref } from "@/lib/dsd-live/leadership/styles";
import { podcastFor } from "@/lib/dsd-live/leadership/style-podcasts";
import { StylePodcast } from "@/components/dsd-live/style-podcast";
import { LeadershipDevelopmentPractice } from "@/components/dsd-live/leadership-development-practice";
import { LeadershipReadAloud } from "@/components/dsd-live/leadership-read-aloud";
import { AskForm } from "@/components/dsd-live/ask-form";
import { COMPETENCIES } from "@/lib/dsd-live/workforce/matrix";
import photos from "@/lib/dsd-live/leadership/collection/photos.json";
import { pageHref } from "@/lib/dsd-live/leadership/program";
import { FIRST_TEAM_SESSION } from "@/lib/dsd-live/leadership/development/team-session";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) { return { title: moduleById((await params).id)?.title ?? "Leadership module" }; }
export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const m = moduleById((await params).id); if (!m) notFound();
  const index = MODULES.indexOf(m); const stage = STAGES.find(s => s.id === m.stage)!;
  const photo = (photos as Record<string, {src:string;alt:string}>)[m.photo];
  const podcastStyle = m.styles.find(s => podcastFor(s)); const podcast = podcastStyle ? podcastFor(podcastStyle) : undefined;
  return <article>
    <nav className="crumbs" aria-label="Breadcrumb"><Link href="/learn/leadership">Leadership</Link> › <Link href={PROGRAM_ROOT}>Development sequence</Link> › Module {index + 1}</nav>
    <header className="development-hero"><p className="development-kicker">{stage.title} · Module {index + 1} of {MODULES.length}</p><h1>{m.title}</h1><p>{m.objective}</p><div className="development-actions"><a href="#practice">Try the decision</a><a href="#work-tool">Use the work tool</a><a href="#module-ask">Ask about this module</a></div></header>
    {photo ? <figure className="development-figure"><Image src={photo.src} alt={photo.alt} width={1200} height={675} sizes="(max-width:760px) 95vw, 1100px"/></figure> : null}
    {podcast && podcastStyle ? <section><p>Listen to a conversation about this leadership approach, then consider how it applies to the case.</p><StylePodcast podcast={podcast} styleName={getStyle(podcastStyle)!.name}/></section> : null}
    <section className="development-reading"><h2>Understand the decision</h2><LeadershipReadAloud text={[m.title,...m.teaching].join("\n\n")}/>{m.teaching.map(p => <p key={p}>{p}</p>)}
      <p><strong>Capabilities:</strong> {m.competencies.map(id => COMPETENCIES.find(c => c.id === id)?.title ?? id).join("; ")}.</p>
      <p><Link href={pageHref(m.reading)}>Extend the reading in the existing leadership fieldbook</Link></p>
    </section>
    <section><h2>Compare leadership approaches</h2><p>How would each approach change the decision and the people it affects?</p><div className="development-grid">{m.styles.map(id => {const s = getStyle(id); return s ? <article className="development-card" key={id}><h3><Link href={styleHref(id)}>{s.name}</Link></h3><p>{s.summary}</p><p>{s.staff}</p></article> : null;})}</div></section>
    <section><h2>The intercultural crosswalk</h2><p>Explore how each orientation can shape the reasoning in this case.</p>{ORIENTATIONS.map((o,i) => <details key={o.id}><summary>{o.name}: examine the reasoning</summary><p>{o.meaning}</p><p><strong>In this case:</strong> {m.lenses[i]}</p><p><strong>Consider:</strong> {o.question}</p><p>{o.practice}</p></details>)}<p><Link href={`${PROGRAM_ROOT}/framework`}>Explore the framework and sources</Link></p></section>
    <LeadershipDevelopmentPractice key={m.id} module={m}/>
    {m.id === "offer-real-opportunity" ? <section id="team-session"><h2>A ready-to-run 20-minute team session</h2><p>{FIRST_TEAM_SESSION.preparation}</p><div className="development-grid">{FIRST_TEAM_SESSION.offers.map(offer => <article className="development-card" key={offer.name}><h3>{offer.name}</h3><p>{offer.text}</p></article>)}</div>{FIRST_TEAM_SESSION.agenda.map(step => <article className="development-stage" key={step.minutes}><h3>Minutes {step.minutes}: {step.task}</h3><p><strong>Facilitator:</strong> {step.say}</p><p><strong>Invite discussion:</strong> {step.prompt}</p></article>)}<h3>Return to the assignment brief</h3><p>{FIRST_TEAM_SESSION.followThrough}</p></section> : null}
    <section id="module-ask"><h2>Continue the conversation</h2><p>Ask a question, compare responses or rehearse a conversation.</p><AskForm compact leadershipModule={m.id}/></section>
    <section className="development-note"><h2>Review this stage</h2><p>{stage.checkpoint}</p></section>
    <nav className="development-pager" aria-label="Module sequence">{index>0 ? <Link href={moduleHref(MODULES[index-1].id)}>Previous: {MODULES[index-1].title}</Link> : <Link href={PROGRAM_ROOT}>Program overview</Link>}{index<MODULES.length-1 ? <Link href={moduleHref(MODULES[index+1].id)}>Next: {MODULES[index+1].title}</Link> : <Link href={`${PROGRAM_ROOT}/facilitate#evaluation`}>Plan the next review</Link>}</nav>
  </article>;
}
