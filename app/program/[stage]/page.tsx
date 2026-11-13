import Link from "@/components/app-link";
import { notFound } from "next/navigation";
import { logicStages } from "@/lib/program/dsd-logic-model";
import { ResourceDownloads } from "@/components/resource-downloads";
export async function generateMetadata({ params }: { params: Promise<{ stage: string }> }) {
  const { stage } = await params;
  return { title: logicStages.find(item => item.slug === stage)?.label ?? "Program" };
}
export default async function ProgramStage({ params }: { params: Promise<{ stage: string }> }) {
  const { stage: slug } = await params;
  const stage = logicStages.find(item => item.slug === slug);
  if (!stage) notFound();
  const next = logicStages[(logicStages.indexOf(stage) + 1) % logicStages.length];
  return <article className="dsd-shell dsd-stage" data-dsd-stage={stage.slug}>
    <header className="dsd-page-heading"><p className="dsd-eyebrow">{stage.question}</p><h1>{stage.label}</h1><p className="dsd-lede">{stage.introduction}</p><details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="equity-review" id={`program-stage~${stage.slug}`} noun="page" /></details></header>
    <div className="dsd-stage-columns"><section aria-label="Explore this area" className="dsd-resource-list">{stage.resources.map((resource, index) => <article key={resource.href}>
      <span className="dsd-resource-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><div><h2><Link href={resource.href}>{resource.title}</Link></h2><p>{resource.description}</p></div>
    </article>)}</section><aside className="dsd-reading-note"><h2>Bring it into your work</h2><p>{stage.explanation}</p><details><summary>A question for reflection</summary><p>{stage.reflection}</p></details><Link href="/program/model">Connect learning with work</Link></aside></div>
    <nav className="dsd-next" aria-label="Continue exploring"><span>Continue exploring</span><Link href={`/program/${next.slug}`}>{next.label}</Link></nav>
  </article>;
}
