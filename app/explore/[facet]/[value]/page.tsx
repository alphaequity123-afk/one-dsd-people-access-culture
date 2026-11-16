import Link from "@/components/app-link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FACETS, KIND_LABEL, KIND_ORDER, facetHref, facetValue, facetsForHref } from "@/lib/graph/facets";

type Props = { params: Promise<{ facet: string; value: string }>; searchParams: Promise<{ show?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { facet, value } = await params;
  return { title: facetValue(facet, value)?.title ?? "Explore" };
}

const FIRST = 6;

export default async function FacetValuePage({ params, searchParams }: Props) {
  const { facet, value } = await params;
  const { show } = await searchParams;
  const entry = facetValue(facet, value);
  if (!entry) notFound();
  const definition = FACETS.find(item => item.id === entry.facet)!;
  const byKind = KIND_ORDER.map(kind => ({ kind, items: entry.items.filter(item => item.kind === kind) })).filter(group => group.items.length);
  const start = entry.items.find(item => item.kind === "practice") ?? entry.items[0];
  const nearby = facetsForHref(start.href, 12).filter(other => !(other.facet === entry.facet && other.id === entry.id)).slice(0, 6);
  return <div className="calm">
    <nav className="calm-crumbs" aria-label="Breadcrumb"><Link href="/explore">Explore</Link> / <Link href={`/explore/${definition.id}`}>{definition.title}</Link></nav>
    <p className="calm-kicker">{entry.group}</p>
    <h1>{entry.title}</h1>
    <p className="calm-lede">{entry.summary}</p>
    <div className="calm-panel">
      <h2 style={{ marginTop: 0 }}>A good place to start</h2>
      <p><Link href={start.href}><strong>{start.title}</strong></Link></p>
      <p className="calm-muted calm-small">{KIND_LABEL[start.kind].replace(/s$/, "")}. When you are done, you can turn what you learned into an action plan.</p>
      <div className="calm-actions"><Link className="calm-button" href={start.href}>Open it</Link><Link className="calm-button calm-button--quiet" href={`/my-work/action-plan?from=${encodeURIComponent(entry.title)}`}>Start an action plan</Link></div>
    </div>
    {byKind.map(group => {
      const all = show === group.kind;
      const visible = all ? group.items : group.items.slice(0, FIRST);
      return <section key={group.kind} id={group.kind}>
        <h2>{KIND_LABEL[group.kind]} <span className="calm-count calm-small">{group.items.length}</span></h2>
        <ul className="calm-list">{visible.map(item => <li key={item.id}><Link href={item.href}>{item.title}</Link></li>)}</ul>
        {group.items.length > FIRST && !all ? <p><Link href={`?show=${group.kind}#${group.kind}`}>Show all {group.items.length} {KIND_LABEL[group.kind].toLowerCase()}</Link></p> : null}
      </section>;
    })}
    {nearby.length ? <section>
      <h2>Also connected</h2>
      <ul className="calm-list">{nearby.map(other => <li key={`${other.facet}/${other.id}`}><Link href={facetHref(other)}>{other.title}</Link><p>{FACETS.find(f => f.id === other.facet)!.title}</p></li>)}</ul>
    </section> : null}
  </div>;
}
