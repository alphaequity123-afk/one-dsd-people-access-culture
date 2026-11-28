import Link from "next/link";
import { ResourceDownloads } from "@/components/dsd-live/resource-downloads";
import { notFound } from "next/navigation";
import { guides } from "@/lib/dsd-live/dsd-practice/guides";
import { sources } from "@/lib/dsd-live/dsd-practice/sources";
import { DsdScenario } from "@/components/dsd-live/dsd-scenario";
import "../practice.css";
export async function generateMetadata({ params }: { params: Promise<{id: string}> }) { const {id}=await params; return { title: guides.find(g => g.id === id)?.title || "Disability practice guide" }; }
export default async function GuidePage({ params }: { params: Promise<{id: string}> }) {
  const {id} = await params; const guide = guides.find(g => g.id === id); if (!guide) notFound();
  return <div className="shell dsd-practice article-layout"><p className="crumbs"><Link href="/practice/disability">Disability services in practice</Link> / {guide.title}</p><h1>{guide.title}</h1><ResourceDownloads slug={`dsd-practice-${guide.id}`} title={guide.title} noun="practice guide" share={`/practice/disability/${guide.id}`} /><p className="reading">{guide.summary}</p><p className="meta">For {guide.roles.toLowerCase()} · Illustrative practice</p><div className="reading"><h2>Why it matters</h2><p>{guide.principle}</p><h2>Put it into practice</h2><ol>{guide.actions.map(action => <li key={action}>{action}</li>)}</ol></div><DsdScenario guide={guide} /><section><h2>Sources and further support</h2><p>These sources support the guidance. The situation and suggested next steps were written for learning in One DSD.</p><ul className="list">{guide.sources.map(id => <li key={id}><a href={sources[id].url}>{sources[id].title}</a><p>{sources[id].use}</p></li>)}</ul><p className="meta">Sources checked November 21, 2026. Confirm current procedures with the responsible authority when acting on a specific case or employment decision.</p></section><p><Link href="/practice/disability">Explore another situation</Link> · <Link href="/learn">Continue learning</Link></p></div>;
}
