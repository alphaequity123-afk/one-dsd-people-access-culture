import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { BranchingSimulation } from "@/components/dsd-live/branching-simulation";
import { CoursePlayer } from "@/components/dsd-live/course-player";
import { mediaFor, readyParts } from "@/lib/dsd-live/media/manifest";
import { introductionFor } from "@/lib/dsd-live/media/training-introductions";
import { TrainingCheck } from "@/components/dsd-live/training-check";
import { trainingById, versionFor } from "@/lib/dsd-live/trainings/catalog";
import { JOB_FAMILIES } from "@/lib/dsd-live/workforce/matrix";
import { FAMILY_COOKIE, parseFamily } from "@/lib/dsd-live/workforce/family";
import { ResourceDownloads } from "@/components/dsd-live/resource-downloads";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: trainingById(id)?.title ?? "Training unavailable" };
}

const LEVEL: Record<string, string> = { foundational: "Foundational", intermediate: "Intermediate", advanced: "Advanced" };
const versionTitle = (v: string) => v === "all-staff" ? "All staff" : JOB_FAMILIES.find(f => f.id === v)?.title ?? v;

/** A narrated training: shared segments, then the simulation for the reader's job family (or all staff). */
export default async function TrainingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ version?: string }> }) {
  const [{ id }, { version: asked }, jar] = await Promise.all([params, searchParams, cookies()]);
  const t = trainingById(id);
  if (!t) notFound();
  const sim = versionFor(t, parseFamily(jar.get(FAMILY_COOKIE)?.value), asked);
  const media = readyParts(mediaFor(t.id));
  const introduction = introductionFor(t.id, sim.version, sim.intro, sim.intro_by);

  return <div className="shell training article-layout">
    <p className="crumbs"><Link href="/learn">Learn</Link></p>
    <h1>{t.title}</h1>
    <p className="lede-text">{t.subtitle}</p>
    {/* Media sits right under the title. Before the video is ready, the topic's hero image stands in its place. */}
    {media.length ? <CoursePlayer parts={media.map(p => ({ ...p, title: p.title ?? p.chapters[0]?.title ?? t.title }))} />
      : <Image className="training-hero" src={t.hero.src} width={t.hero.width} height={t.hero.height} alt={t.hero.alt} priority sizes="(max-width: 1100px) 100vw, 1040px" />}
    <p className="meta">{LEVEL[sim.level]} · {versionTitle(sim.version)} · about {t.minutes} minutes</p>
    <ResourceDownloads slug={t.id} title={`${t.title}: ${versionTitle(sim.version)}`} noun="training" download={`/api/downloads/training/${t.id}?version=${sim.version}`} share={`/trainings/${t.id}?version=${sim.version}`} />

    <p className="reading">Choose a version connected to your responsibilities, or explore how the same ideas apply in another role. The all-staff version provides a shared starting point.</p>
    <nav className="versions" aria-label="Versions of this training">
      {t.simulations.map(s => <Link key={s.version} href={`/trainings/${t.id}?version=${s.version}`} aria-current={s.version === sim.version ? "page" : undefined}>{versionTitle(s.version)}</Link>)}
    </nav>

    <section className="reading">
      <h2>What you will practice</h2>
      <ul>{t.objectives.map(o => <li key={o}>{o}</li>)}</ul>
      <p className="meta">
        <Link href={`/trainings/${t.id}/transcript?version=${sim.version}`}>Transcript</Link> · <Link href={`/trainings/${t.id}/facilitator`}>Facilitator guide</Link>
      </p>
    </section>

    {t.segments.map((seg, n) => <section key={seg.id} className="training-segment" aria-labelledby={`seg-${seg.id}`}>
      <h2 id={`seg-${seg.id}`}>{n + 1}. {seg.title}</h2>
      <p className="meta">About {seg.minutes} minutes</p>
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

    {introduction ? <section className="training-segment" aria-label="About this version">
      <h2>{versionTitle(sim.version)}</h2>
      <CoursePlayer key={`${t.id}-${sim.version}`} parts={[{ ...introduction.part, title: "About this version" }]} />
      <p>{sim.intro}</p>
    </section> : <section className="scene slide version-intro" aria-label="About this version">
      <div className="slide-text"><p className="slide-label">{versionTitle(sim.version)}</p><p>{sim.intro}</p></div>
      <Image className="slide-figure" loading="eager" src={`/images/learning-guides/${sim.intro_by}.png`} alt="" width={941} height={1672} sizes="(max-width: 700px) 90px, 160px" />
    </section>}
    <ul className="cast-strip" aria-label="People in this scenario">{sim.cast.map(c => <li key={c.role}>
      <Image src={`/images/learning-guides/${c.portrait}.png`} loading="eager" alt="" width={941} height={1672} sizes="64px" /><span>{c.label}</span>
    </li>)}</ul>
    <BranchingSimulation sim={sim} />

    <section className="reading">
      <h2>Your action plan</h2>
      <ul>{t.action_plan.map(a => <li key={a}>{a}</li>)}</ul>
      <p>{t.closing.narration}</p>
    </section>

    <section className="reading">
      <h2>Sources</h2>
      <ul>{t.sources.map(s => <li key={s.slug}><Link href={`/r/${s.slug}`}>{s.title}</Link></li>)}</ul>
    </section>
  </div>;
}
