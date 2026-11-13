import Link from "@/components/app-link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FACETS, facetHref, groupedFacet, type FacetId } from "@/lib/graph/facets";

type Props = { params: Promise<{ facet: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { facet } = await params;
  return { title: FACETS.find(entry => entry.id === facet)?.title ?? "Explore" };
}

export default async function FacetPage({ params }: Props) {
  const { facet } = await params;
  const definition = FACETS.find(entry => entry.id === facet);
  if (!definition) notFound();
  const groups = groupedFacet(definition.id as FacetId);
  return <div className="calm">
    <nav className="calm-crumbs" aria-label="Breadcrumb"><Link href="/explore">Explore</Link></nav>
    <h1>{definition.title}</h1>
    <p className="calm-lede">{definition.question} Choose one to see the practices, courses, tools and readings connected with it.</p>
    <div className="calm-columns">
      {groups.map(({ group, values }) => <section key={group}>
        <h2 style={{ marginTop: 0 }}>{group}</h2>
        <ul className="calm-list">{values.map(value => <li key={value.id}><Link href={facetHref(value)}>{value.title}</Link><span className="calm-count">{value.items.length}</span></li>)}</ul>
      </section>)}
    </div>
  </div>;
}
