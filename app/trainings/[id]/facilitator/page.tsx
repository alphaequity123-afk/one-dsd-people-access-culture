import Link from "next/link";
import { notFound } from "next/navigation";
import { trainingById } from "@/lib/dsd-live/trainings/catalog";
import { JOB_FAMILIES } from "@/lib/dsd-live/workforce/matrix";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const training = trainingById(id);
  return { title: training ? `${training.title}: facilitator guide` : "Facilitator guide unavailable" };
}

/** The facilitator guide and talking points for running a training with a team or cohort. */
export default async function FacilitatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = trainingById(id);
  if (!t) notFound();
  const f = t.facilitator;
  return <div className="shell reading article-layout">
    <p className="crumbs"><Link href={`/trainings/${t.id}`}>{t.title}</Link></p>
    <h1>Facilitator guide</h1>
    <p>A useful learning conversation gives people room to think, ask questions and reconsider an assumption. As you prepare this session for DSD colleagues, choose an example about disability access, a person’s choices or a workplace relationship that participants can recognize. Invite reflection without asking anyone to disclose a disability or speak for a whole community.</p>
    <p>{f.purpose}</p>
    <h2>Ways to facilitate the training</h2><ul>{f.delivery.map(d => <li key={d}>{d}</li>)}</ul>
    <h2>Before the session</h2><p>Ask about participation needs and make the materials usable before the group meets. Allow people to contribute by speaking, writing or another agreed method. When a conversation needs more time, adjust the pace rather than treating silence as lack of engagement.</p><ul>{f.preparation.map(d => <li key={d}>{d}</li>)}</ul>
    <h2>Session plan</h2>
    {f.agenda.map(a => <section key={a.title}><h3>{a.title} <span className="meta">({a.minutes} minutes)</span></h3>
      <ul>{a.steps.map(s => <li key={s}>{s}</li>)}</ul>
      {a.notes.length ? <div className="meta">{a.notes.map(n => <p key={n}>{n}</p>)}</div> : null}
    </section>)}
    <h2>Talking points</h2>
    {f.talking_points.map(p => <section key={p.moment}><h3>{p.moment}</h3>{p.say.map(s => <p key={s}>&ldquo;{s}&rdquo;</p>)}</section>)}
    <h2>When discussion stalls</h2><ul>{f.when_stalls.map(s => <li key={s}>{s}</li>)}</ul>
    <h2>When tension rises</h2><ul>{f.when_tense.map(s => <li key={s}>{s}</li>)}</ul>
    <h2>After the session</h2><ul>{f.follow_up.map(s => <li key={s}>{s}</li>)}</ul>
    {Object.keys(f.version_notes).length ? <><h2>Facilitating a version for a job family</h2>
      {Object.entries(f.version_notes).map(([v, note]) => <section key={v}><h3>{JOB_FAMILIES.find(j => j.id === v)?.title ?? v}</h3><p>{note}</p></section>)}</> : null}
  </div>;
}
