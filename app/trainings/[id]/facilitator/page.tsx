import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/app-link";
import { trainingById } from "@/lib/trainings/catalog";
import { JOB_FAMILIES } from "@/lib/workforce/matrix";
import "../../trainings.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const t = trainingById((await params).id);
  return t ? { title: `Facilitator guide: ${t.title}` } : {};
}

/** The facilitator guide and talking points for running a training with a team or cohort. */
export default async function FacilitatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = trainingById(id);
  if (!t) notFound();
  const f = t.facilitator;
  return <div className="wrap training-page training-reading py-8">
    <p className="training-crumbs"><Link href={`/trainings/${t.id}`}>{t.title}</Link></p>
    <h1>Facilitator guide</h1>
    <p>{f.purpose}</p>
    <h2>Ways to run it</h2><ul>{f.delivery.map(d => <li key={d}>{d}</li>)}</ul>
    <h2>Before the session</h2><ul>{f.preparation.map(d => <li key={d}>{d}</li>)}</ul>
    <h2>Session plan</h2>
    {f.agenda.map(a => <section key={a.title}><h3>{a.title} <span className="training-meta">({a.minutes} minutes)</span></h3>
      <ul>{a.steps.map(s => <li key={s}>{s}</li>)}</ul>
      {a.notes.length ? <div className="training-meta">{a.notes.map(n => <p key={n}>{n}</p>)}</div> : null}
    </section>)}
    <h2>Talking points</h2>
    {f.talking_points.map(p => <section key={p.moment}><h3>{p.moment}</h3>{p.say.map(s => <p key={s}>&ldquo;{s}&rdquo;</p>)}</section>)}
    <h2>When discussion stalls</h2><ul>{f.when_stalls.map(s => <li key={s}>{s}</li>)}</ul>
    <h2>When tension rises</h2><ul>{f.when_tense.map(s => <li key={s}>{s}</li>)}</ul>
    <h2>Afterward</h2><ul>{f.follow_up.map(s => <li key={s}>{s}</li>)}</ul>
    {Object.keys(f.version_notes).length ? <><h2>Running a job-family version</h2>
      {Object.entries(f.version_notes).map(([v, note]) => <section key={v}><h3>{JOB_FAMILIES.find(j => j.id === v)?.title ?? v}</h3><p>{note}</p></section>)}</> : null}
  </div>;
}
