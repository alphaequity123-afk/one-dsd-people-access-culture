import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PageIntro } from "@/components/ui";
import { OrganizationBreadcrumb, OrganizationSourceNote, OrganizationTopicCards, SharedAgencyResources } from "@/components/organization-navigation";
import { DIVISION_BRANCH_TOPICS } from "@/lib/product/organization-navigation";
import { ResourceDownloads } from "@/components/resource-downloads";

export const metadata: Metadata = { title:"Disability Services Division within ADSA" };

export default function DisabilityServicesBranchPage() {
  return <><PageIntro kicker="Aging and Disability Services Administration" title="Disability Services Division" lede="One DSD brings together what the Disability Services Division knows about services, workplace practice and practical equity resources, all in one place." />
    <div className="wrap max-w-6xl py-10"><OrganizationBreadcrumb items={[{label:"Home",href:"/"},{label:"Administrations",href:"/administrations"},{label:"Aging and Disability Services Administration",href:"/administrations/adsa"},{label:"Disability Services Division"}]} />
      <section className="mb-12 rounded-xl border border-line bg-white p-6" aria-labelledby="dsd-program"><h2 id="dsd-program" className="m-0 text-2xl font-bold">The One DSD program</h2><p>Everything in One DSD is here for you: its programs, examples, team resources and learning connections. Where a responsibility belongs to the division alone, we say so.</p><Link href="/one-dsd?view=one_dsd" className="btn btn--primary">Open the DSD program</Link></section>
      <section aria-labelledby="dsd-service-context"><h2 id="dsd-service-context" className="mb-6 text-2xl font-bold">Disability services context</h2><OrganizationTopicCards ids={DIVISION_BRANCH_TOPICS} /></section>
      <SharedAgencyResources /><OrganizationSourceNote />
      <details className="mt-6 border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="equity-review" id="administration~dsd" noun="page" /></details>
    </div></>;
}
