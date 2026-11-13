import Link from "@/components/app-link";
import { FACETS, facetHref, facetsForHref } from "@/lib/graph/facets";

/** "Connected with": the tasks, roles, standards and communities an item belongs to. Computed from content; stores nothing. */
export function ConnectedWith({ href, limit = 6, collapsed = false }: { href: string; limit?: number; collapsed?: boolean }) {
  const values = facetsForHref(href, limit);
  if (!values.length) return null;
  const list = <ul className="calm-list">{values.map(value => <li key={`${value.facet}/${value.id}`}><Link href={facetHref(value)}>{value.title}</Link><p>{FACETS.find(f => f.id === value.facet)!.title}</p></li>)}</ul>;
  if (collapsed) return <details className="course-more-item"><summary>Connected with: tasks, roles, standards and communities</summary>{list}</details>;
  return <section className="calm" style={{ padding: "1.5rem 1.25rem" }} aria-labelledby="connected-with-title">
    <h2 id="connected-with-title" style={{ marginTop: 0 }}>Connected with</h2>
    <ul className="calm-list">{values.map(value => <li key={`${value.facet}/${value.id}`}><Link href={facetHref(value)}>{value.title}</Link><p>{FACETS.find(f => f.id === value.facet)!.title}</p></li>)}</ul>
  </section>;
}
