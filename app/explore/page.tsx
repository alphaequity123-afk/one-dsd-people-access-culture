import Link from "next/link";
import type { Metadata } from "next";
import { FACETS, facetHref, groupedFacet } from "@/lib/graph/facets";

export const metadata: Metadata = { title: "Explore" };

export default function ExplorePage() {
  return <div className="calm">
    <p className="calm-kicker">Explore</p>
    <h1>Find what connects to your work</h1>
    <p className="calm-lede">Every course, practice, tool, reading, community brief, organization and policy is connected five ways. Start from whichever fits the moment you are in.</p>
    <ul className="calm-choices">
      {FACETS.map(facet => <li key={facet.id}><Link className="calm-choice" href={`/explore/${facet.id}`}><h2>{facet.title}</h2><p>{facet.question}</p></Link></li>)}
    </ul>
    {FACETS.map(facet => {
      const groups = groupedFacet(facet.id);
      return <details key={facet.id}>
        <summary>{facet.title}: see every starting point</summary>
        {groups.map(({ group, values }) => <section key={group}>
          <h3 style={{ marginTop: "1.25rem" }}>{group}</h3>
          <ul className="calm-list">{values.map(value => <li key={value.id}><Link href={facetHref(value)}>{value.title}</Link><span className="calm-count">{value.items.length} connected</span></li>)}</ul>
        </section>)}
      </details>;
    })}
    <p className="calm-note">These connections come from the published content itself. Nothing here records what you open.</p>
  </div>;
}
