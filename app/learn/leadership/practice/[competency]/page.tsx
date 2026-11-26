import Link from "next/link";
import { areaIdFromSlug, areaSlug } from "@/lib/dsd-live/leadership/areas";
import { notFound } from "next/navigation";
import { practiceCases, practiceHome, practiceSources } from "@/lib/dsd-live/leadership/practice";
import { leadershipPages, pageHref } from "@/lib/dsd-live/leadership/program";
import { PracticeWorkspace } from "./workspace";

type Props = { params: Promise<{ competency: string }> };
export function generateStaticParams() { return practiceCases.map(item => ({ competency: areaSlug(item.id) })); }
export async function generateMetadata({ params }: Props) {
  const { competency } = await params;
  return { title: practiceCases.find(item => item.id === areaIdFromSlug(competency))?.title ?? "Leadership simulation" };
}
export default async function Simulation({ params }: Props) {
  const { competency } = await params;
  const item = practiceCases.find(value => value.id === areaIdFromSlug(competency));
  if (!item) notFound();
  return <article className="leadership-section article-layout">
    <nav className="crumbs" aria-label="Breadcrumb"><Link href="/learn/leadership">One DSD Leadership</Link> › <Link href={practiceHome}>Simulations</Link> › {item.competency}</nav>
    <h1>{item.title}</h1><p className="learning-lede">{item.scenario}</p>
    <PracticeWorkspace key={item.id} scenario={item} />
    <h2 id="related-reading">Go further</h2><ul className="leadership-links">{item.articleIds.map(number => {
      const page = leadershipPages.find(other => other.type === "article" && other.number === number);
      return page ? <li key={page.id}><Link href={pageHref(page.id)}>{page.title}</Link></li> : null;
    })}</ul>
    <details><summary>Sources for this simulation</summary><ul className="leadership-links">{item.sources.map(id => {
      const source = practiceSources.find(s => s.id === id);
      return source ? <li key={id}><Link href={"/learn/leadership/research#" + id}>{source.title}</Link></li> : null;
    })}</ul></details>
    <p><Link href={"/learn/leadership/areas#" + areaSlug(item.id)}>Return to {item.competency}</Link></p>
  </article>;
}
