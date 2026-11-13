import Link from "next/link";
import { communityPartHref, type CommunityPartSlug } from "./cp-community-parts";
import "./cp-community-parts.css";

export type CommunityPartSummary = { slug: CommunityPartSlug; label: string; sections: string[] };

/** The overview's list of parts, with the sections each part holds. */
export function CommunityPartsList({ id, parts }: { id: string; parts: CommunityPartSummary[] }) {
  return <section id="community-parts" aria-labelledby="community-parts-title" className="cp-community-parts">
    <h2 id="community-parts-title">Parts of this page</h2>
    <ol>{parts.map(part => <li key={part.slug}>
      <Link href={communityPartHref(id, part.slug)}>{part.label}</Link>
      {part.sections.length ? <p>{part.sections.join(" · ")}</p> : null}
    </li>)}</ol>
  </section>;
}

/** Small navigation shown on every part: the overview, then each part, with the current one marked. */
export function CommunityPartsNav({ id, title, parts, current }: { id: string; title: string; parts: CommunityPartSummary[]; current?: CommunityPartSlug }) {
  return <details className="cp-community-parts-nav">
    <summary>Parts of this page</summary>
    <nav aria-label="Parts of this page">
    <ul>
      <li><Link href={communityPartHref(id)} aria-current={current ? undefined : "page"}>{title} overview</Link></li>
      {parts.map(part => <li key={part.slug}><Link href={communityPartHref(id, part.slug)} aria-current={part.slug === current ? "page" : undefined}>{part.label}</Link></li>)}
    </ul>
    </nav>
  </details>;
}

export function CommunityBreadcrumb({ id, title, current }: { id: string; title: string; current: string }) {
  return <nav aria-label="Breadcrumb" className="cp-community-breadcrumb">
    <ol>
      <li><Link href="/minnesota-communities">Minnesota Communities</Link></li>
      <li><Link href={communityPartHref(id)}>{title}</Link></li>
      <li><span aria-current="page">{current}</span></li>
    </ol>
  </nav>;
}
