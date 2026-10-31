import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/ui";
import { OrganizationBreadcrumb, OrganizationSourceNote, OrganizationTopicCards, SharedAgencyResources } from "@/components/organization-navigation";

export const metadata: Metadata = { title:"Disability Services Division within ADSA" };

export default function DisabilityServicesBranchPage() {
  return <><PageIntro kicker="Aging and Disability Services Administration" title="Disability Services Division" lede="The Disability Services Division brings together service knowledge, workplace practice and practical equity resources in the standalone One DSD program." />
    <div className="wrap max-w-6xl py-10"><OrganizationBreadcrumb items={[{label:"Home",href:"/"},{label:"Administrations",href:"/administrations"},{label:"Aging and Disability Services Administration",href:"/administrations/adsa"},{label:"Disability Services Division"}]} />
      <section className="mb-12 rounded-xl border border-line bg-white p-6" aria-labelledby="dsd-program"><h2 id="dsd-program" className="m-0 text-2xl font-bold">The One DSD program</h2><p>The complete One DSD program remains available with its programs, examples, team resources and learning connections. Division-specific responsibilities stay identified as such.</p><Link href="/one-dsd?view=one_dsd" className="btn btn--primary">Open the DSD program</Link></section>
      <section aria-labelledby="dsd-service-context"><h2 id="dsd-service-context" className="mb-6 text-2xl font-bold">Disability services context</h2><OrganizationTopicCards ids={["dsd-choice","manuals","assessment","person-centered"]} /></section>
      <SharedAgencyResources /><OrganizationSourceNote />
    </div></>;
}
