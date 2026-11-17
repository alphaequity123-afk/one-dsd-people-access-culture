
import { SourceLink } from "@/components/app-link";
import type { Metadata } from "next";
import Link from "@/components/app-link";
import { EngagementReferenceMap } from "@/components/multimedia/engagement-reference-map";
import { PageIntro } from "@/components/ui";
import { ResourceDownloads } from "@/components/resource-downloads";
import reference from "@/data/organization/minnesota-dhs.json";
import { DHS_REFERENCE_GROUPS, dhsTopicAnchor } from "@/lib/content/dhs-reference";
export const metadata: Metadata = {title:"Understanding DHS",description:"People, programs and partnerships across Minnesota DHS, including Disability Services, county and Tribal relationships, and original sources."};
export default function UnderstandingDhsPage() {
  return <><PageIntro kicker="People, Access and Culture" title="Understanding DHS" lede="People, programs and partnerships across Minnesota DHS, with a closer look at Disability Services and the work we share." />
    <div className="pilot-topic pilot-reading-width">
      <p className="mt-0 max-w-3xl">Good work connects people across teams and organizations. This reference brings together their responsibilities, services and relationships so it is easier to see how your work fits into the wider picture.</p>
      <details className="pilot-supporting">
        <summary>Two places in our DHS story</summary><div className="pilot-supporting-body space-y-4">
        <p className="max-w-3xl">These are real DHS buildings in St. Paul. The Lafayette photograph is an archival view from 1998; the buildings are shown here for orientation and connection to the department, not as a current visitor guide.</p>
        <div className="grid gap-6 md:grid-cols-2">
          <figure className="m-0 overflow-hidden rounded-xl border border-line bg-white">
            <img src="/images/buildings/andersen.webp" alt="Elmer L. Andersen Human Services Building at the corner of Cedar and 11th Streets in St. Paul" className="aspect-[16/10] w-full object-cover" loading="lazy" />
            <figcaption className="p-5"><strong>Elmer L. Andersen Human Services Building</strong><br />540 Cedar Street, St. Paul. <SourceLink href="https://mn.gov/admin/citizen/buildings-grounds/buildings/andersen.jsp">Photo and building information: Minnesota Department of Administration</SourceLink>.</figcaption>
          </figure>
          <figure className="m-0 overflow-hidden rounded-xl border border-line bg-white">
            <img src="/images/buildings/lafayette-1998.webp" alt="Archival black-and-white photograph of the DHS building at 444 Lafayette Road North in 1998" className="aspect-[16/10] w-full object-cover" loading="lazy" />
            <figcaption className="p-5"><strong>DHS Lafayette Building, archival view (1998)</strong><br />444 Lafayette Road North, St. Paul. <SourceLink href="https://www.lrl.mn.gov/docs/pre2003/other/990473.pdf">Photo: DHS, <cite>Memories of our past</cite>, page 33, via the Minnesota Legislative Reference Library</SourceLink>.</figcaption>
          </figure>
        </div>
      </div></details>
      <details className="my-7 border-y border-line py-4"><summary className="cursor-pointer font-semibold">Download this DHS reference</summary><div className="mt-4"><ResourceDownloads kind="understanding-dhs" id="reference" noun="reference" compact /></div></details>
      <div className="mt-8">{DHS_REFERENCE_GROUPS.map(group=><details key={group.id} id={group.id} className="pilot-supporting scroll-mt-28">
        <summary><h2 style={{ display: "inline", fontSize: "inherit", fontWeight: "inherit", lineHeight: "inherit", color: "inherit", margin: 0 }}>{group.title}</h2></summary>
        <div className="pilot-supporting-body space-y-6">{group.entries.map(entry=><article key={entry.id} id={dhsTopicAnchor(entry.id)} aria-labelledby={dhsTopicAnchor(entry.id)+"-title"} className="scroll-mt-28 rounded-xl border border-line bg-white p-6">
          <h3 id={dhsTopicAnchor(entry.id)+"-title"} className="m-0 text-xl font-bold">{entry.title}</h3>
          <p className="leading-relaxed">{entry.facts}</p>
          <p className="text-sm"><strong>Related teams and partners:</strong> {entry.units.join("; ")}</p>
          <EngagementReferenceMap topicId={entry.id} application={entry.application} />
          <details className="mt-4 border-t border-line pt-3 text-sm">
            <summary className="cursor-pointer font-semibold">Original sources</summary>
            <ul className="mb-0 space-y-2 pl-5">{entry.sourceIds.map(id=>{const source=reference.sources.find(s=>s.id===id)!;return <li key={id}><SourceLink href={source.url}>{source.title}</SourceLink></li>;})}</ul>
          </details>
        </article>)}</div>
      </details>)}</div>
      <footer className="mt-12 border-t border-line pt-6"><p className="text-sm text-muted">Program summaries accompany the original sources, which carry current policy and contact information.</p><p><Link href="/ask">Ask a question</Link> <span aria-hidden="true"> · </span> <Link href="/learn">Learning and resources</Link></p></footer>
    </div></>;
}
