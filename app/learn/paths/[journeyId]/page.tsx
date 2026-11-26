
import { SourceLink } from "@/components/app-link";
import Link from "@/components/app-link";
import { ResourceDownloads } from "@/components/resource-downloads";
import { notFound } from "next/navigation";
import { developmentModel, developmentJourney, journeyHref, stageGuidance } from "@/lib/program/development";
import { publishedDevelopment, availableDevelopmentLink } from "@/lib/program/development-published";
import { requestedContentScope } from "@/lib/product/request-context";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ journeyId: string }> }) {
  return { title: developmentJourney((await params).journeyId)?.title ?? "Learning pathway" };
}
export default async function JourneyPage({ params }: { params: Promise<{ journeyId: string }> }) {
  const journey = developmentJourney((await params).journeyId);
  if (!journey) notFound();
  const scope = await requestedContentScope();
  const { records } = await publishedDevelopment(scope);
  const resources = records.filter(record => record.journeyIds.includes(journey.id));
  return <div className="development-page">
    <Link href="/learn/paths">All guided pathways</Link>
    <header><p className="development-eyebrow">From engagement to action</p><h1>{journey.title}</h1><p>{journey.summary}</p><p>Use whichever steps help with your question. There's nothing to enroll in and no set order.</p></header>
    <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="learn-page" id={`paths-${journey.id}`} noun="pathway" scope={scope} /></details>
    <nav aria-label="Pathway steps"><ol className="development-stages">{developmentModel.stages.map((stage, index) => <li key={stage.id}><SourceLink href={`#${stage.id}`}>{index + 1}. {stage.title}</SourceLink></li>)}</ol></nav>
    {developmentModel.stages.map((stage, index) => <section id={stage.id} className="development-step" aria-labelledby={`title-${stage.id}`} key={stage.id}>
      <header><span className="development-step-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><h2 id={`title-${stage.id}`}>{stage.title}</h2></header>
      <p>{stage.purpose}</p><div className="development-practice"><h3>{stage.id === "practice" ? "Try a different approach" : stage.id === "apply" ? "Take it into your situation" : "A question to work with"}</h3><p>{stageGuidance(journey, stage.id)}</p></div>
      {(() => {
        const links = journey.links.filter(link => link.stage === stage.id && availableDevelopmentLink(link.href, records));
        return links.length ? <details className="course-more-item"><summary>Courses and resources for this step ({links.length})</summary><ul className="development-step-links">{links.map(link => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul></details> : null;
      })()}
      <p><strong>Something to carry forward:</strong> {stage.evidence}</p>
      {index < developmentModel.stages.length - 1 ? <SourceLink href={`#${developmentModel.stages[index + 1].id}`}>Continue to {developmentModel.stages[index + 1].title.toLowerCase()}</SourceLink> : <Link href="/learn/paths">See all learning paths</Link>}
    </section>)}
    <section className="development-logic"><h2>Make room for another perspective</h2><p>{journey.social}</p><Link href={journey.connection.href}>{journey.connection.label}</Link><p>Whether and how you take part is up to you. Check what's on offer with the people or group involved.</p></section>
    <section className="development-related"><h2>Explore more within this pathway</h2><p>Each of these can help with a different part of your question. There's no need to work through the whole collection.</p><details><summary>Browse related courses and resources ({resources.length})</summary><ul>{resources.map(resource => <li key={resource.id}><Link href={resource.href}>{resource.title}</Link><p>{resource.contribution}</p></li>)}</ul></details><p><Link href={journeyHref(journey.id, "engage")}>Return to your starting question</Link> · <Link href="/learn/paths">Choose another pathway</Link></p></section>
  </div>;
}
