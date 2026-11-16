import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "@/components/app-link";
import { BranchingSimulation } from "@/components/branching-simulation";
import { TrainingCheck } from "@/components/training-check";
import { collectionItem, collectionItemHref } from "@/lib/content/collections";
import { trainingById, versionFor } from "@/lib/trainings/catalog";
import type { Training } from "@/lib/trainings/schema";
import { JOB_FAMILIES } from "@/lib/workforce/matrix";
import { FAMILY_COOKIE, parseFamily } from "@/lib/workforce/family";
import "../trainings.css";

export const dynamic = "force-dynamic";

const LEVEL: Record<string, string> = { foundational: "Foundational", intermediate: "Intermediate", advanced: "Advanced" };
const versionTitle = (v: string) => v === "all-staff" ? "All staff" : JOB_FAMILIES.find(f => f.id === v)?.title ?? v;

/** Where a source opens in this app: its course (a lesson opens its course), else its original address, else nowhere. */
function sourceHref(source: Training["sources"][number]): string | null {
  const item = collectionItem(source.slug) ?? collectionItem(source.slug.split("--")[0]);
  if (item) {
    try { return collectionItemHref(item); } catch { /* fall back to the original address */ }
  }
  return source.url;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const t = trainingById((await params).id);
  return t ? { title: t.title, description: t.subtitle } : {};
}

/** A narrated training: shared segments, then the simulation for the reader's job family (or all staff). */
export default async function TrainingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ version?: string }> }) {
  const [{ id }, { version: asked }, jar] = await Promise.all([params, searchParams, cookies()]);
  const t = trainingById(id);
  if (!t) notFound();
  const sim = versionFor(t, parseFamily(jar.get(FAMILY_COOKIE)?.value), asked);

  return <div className="wrap training-page py-8">
    <p className="training-crumbs"><Link href="/learn">Learn</Link></p>
    <h1>{t.title}</h1>
    <p className="training-lede">{t.subtitle}</p>
    {/* Media sits right under the title. Until the recording is ready, the topic's hero image stands in its place. */}
    <Image className="training-hero" src={t.hero.src} width={t.hero.width} height={t.hero.height} alt={t.hero.alt} priority sizes="(max-width: 1100px) 100vw, 1040px" />
    <p className="training-meta">{LEVEL[sim.level]} · {versionTitle(sim.version)} · about {t.minutes} minutes</p>

    <nav className="versions" aria-label="Versions of this training">
      {t.simulations.map(s => <Link key={s.version} href={`/trainings/${t.id}?version=${s.version}`} aria-current={s.version === sim.version ? "page" : undefined}>{versionTitle(s.version)}</Link>)}
    </nav>

    <section className="training-reading">
      <h2>What you will practice</h2>
      <ul>{t.objectives.map(o => <li key={o}>{o}</li>)}</ul>
      <p className="training-meta">
        <a href={`/trainings/${t.id}/transcript?version=${sim.version}`}>Transcript</a> · <Link href={`/trainings/${t.id}/facilitator`}>Facilitator guide</Link>
      </p>
    </section>

    {t.segments.map((seg, n) => <section key={seg.id} className="training-segment" aria-labelledby={`seg-${seg.id}`}>
      <h2 id={`seg-${seg.id}`}>{n + 1}. {seg.title}</h2>
      <p className="training-meta">About {seg.minutes} minutes · <a href={`/trainings/${t.id}/captions/${seg.id}`}>Captions</a></p>
      {seg.scenes.map(scene => <div key={scene.id} className="scene slide">
        <div className="slide-text">
          <p className="slide-label">People, Access and Culture</p>
          {scene.on_screen.length ? <ul className="on-screen">{scene.on_screen.map(line => <li key={line}>{line}</li>)}</ul> : null}
          <p>{scene.narration}</p>
        </div>
        <Image className="slide-figure" loading="eager" src={`/images/learning-guides/${scene.figure}.png`} alt="" width={941} height={1672} sizes="(max-width: 700px) 90px, 160px" />
      </div>)}
      {seg.check ? <TrainingCheck prompt={seg.check.prompt} options={seg.check.options} /> : null}
      {seg.reflection.length ? <div className="reflect"><h3>Reflect</h3><ul>{seg.reflection.map(r => <li key={r}>{r}</li>)}</ul></div> : null}
    </section>)}

    <section className="scene slide version-intro" aria-label="About this version">
      <div className="slide-text"><p className="slide-label">{versionTitle(sim.version)}</p><p>{sim.intro}</p></div>
      <Image className="slide-figure" loading="eager" src={`/images/learning-guides/${sim.intro_by}.png`} alt="" width={941} height={1672} sizes="(max-width: 700px) 90px, 160px" />
    </section>
    <ul className="cast-strip" aria-label="People in this scenario">{sim.cast.map(c => <li key={c.role}>
      <Image src={`/images/learning-guides/${c.portrait}.png`} loading="eager" alt="" width={941} height={1672} sizes="64px" /><span>{c.label}</span>
    </li>)}</ul>
    <BranchingSimulation key={sim.version} sim={sim} />

    <section className="training-reading">
      <h2>Your action plan</h2>
      <ul>{t.action_plan.map(a => <li key={a}>{a}</li>)}</ul>
      <p>{t.closing.narration}</p>
    </section>

    <section className="training-reading">
      <h2>Sources</h2>
      <ul>{t.sources.map(s => {
        const href = sourceHref(s);
        return <li key={s.slug}>{href ? <Link href={href}>{s.title}</Link> : s.title}</li>;
      })}</ul>
    </section>
  </div>;
}
