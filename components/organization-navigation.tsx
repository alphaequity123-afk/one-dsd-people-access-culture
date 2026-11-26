
import { SourceLink } from "@/components/app-link";
import Link from "@/components/app-link";
import { organizationTopics, ORGANIZATION_DIRECTORY_URL, ORGANIZATION_NAVIGATION_SOURCE_NOTE } from "@/lib/product/organization-navigation";
import reference from "@/data/organization/minnesota-dhs.json";

export function OrganizationBreadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return <nav aria-label="Organization breadcrumb" className="mb-7 text-sm"><ol className="flex list-none flex-wrap items-center gap-2 p-0">
    {items.map((item, index) => <li key={item.label} className="flex items-center gap-2">{index > 0 && <span aria-hidden="true">/</span>}{item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}</li>)}
  </ol></nav>;
}

export function OrganizationTopicCards({ ids }: { ids: readonly string[] }) {
  return <div className="space-y-4">{organizationTopics(ids).map(entry => <details key={entry.id} className="rounded-xl border border-line bg-white px-5">
    <summary className="min-h-11 cursor-pointer py-3 font-semibold">{entry.title}</summary>
    <div className="pb-5">
    <p className="leading-relaxed">{entry.facts}</p>
    <Link href={`/understanding-dhs#${entry.id.replace(/^ext-dhs-org-/, "")}`}>Explore this topic and its connections</Link>
    <details className="mt-4 border-t border-line pt-3 text-sm"><summary className="cursor-pointer font-semibold">Original sources</summary><ul className="space-y-2 pl-5">{entry.sourceIds.map(id => { const source = reference.sources.find(item => item.id === id)!; return <li key={id}><SourceLink href={source.url}>{source.title}</SourceLink></li>; })}</ul></details>
    </div>
  </details>)}</div>;
}

export function SharedAgencyResources() {
  return <section className="mt-12 border-t border-line pt-6" aria-labelledby="shared-agency-resources"><h2 id="shared-agency-resources" className="text-2xl font-bold">Resources shared across DHS</h2><p>Use the same learning, practical tools and community knowledge across organizational boundaries, while keeping the responsibilities and circumstances of your work in view.</p><ul className="flex list-none flex-wrap gap-x-7 gap-y-3 p-0"><li><Link href="/learn">Learn</Link></li><li><Link href="/practice">Practice</Link></li><li><Link href="/minnesota-communities">Community knowledge</Link></li><li><Link href="/practice/requirements">Requirements and implementation</Link></li></ul></section>;
}

export function OrganizationSourceNote() {
  return <p className="mt-10 text-sm text-muted">{ORGANIZATION_NAVIGATION_SOURCE_NOTE} <SourceLink href={ORGANIZATION_DIRECTORY_URL}>DHS agencywide directory</SourceLink>.</p>;
}
