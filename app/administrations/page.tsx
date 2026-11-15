import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PageIntro } from "@/components/ui";
import { OrganizationBreadcrumb, OrganizationSourceNote, SharedAgencyResources } from "@/components/organization-navigation";
import { ADMINISTRATION_NAVIGATION } from "@/lib/product/organization-navigation";

export const metadata: Metadata = { title: "DHS administrations", description: "Explore DHS organizational context and the Disability Services Division within Aging and Disability Services." };

export default function AdministrationsPage() {
  return <><PageIntro kicker="One DSD · DHS organizational context" title="DHS administrations" lede="This directory shows where the Disability Services Division (DSD) fits within the Minnesota Department of Human Services (DHS) and how it relates to other DHS administrations. This directory supports context; the standalone One DSD program remains your starting point." />
    <div className="wrap max-w-6xl py-10"><OrganizationBreadcrumb items={[{label:"Home",href:"/"},{label:"Administrations"}]} />
      <div className="grid gap-6 md:grid-cols-2">{ADMINISTRATION_NAVIGATION.map(area => <article key={area.id} className="rounded-xl border border-line bg-white p-6"><h2 className="m-0 text-2xl font-bold"><Link href={`/administrations/${area.id}`}>{area.name}</Link></h2><p>{area.description}</p><Link href={`/administrations/${area.id}`}>Explore this administration</Link>{area.id === "adsa" && <p className="mb-0 text-sm">Includes the Disability Services Division branch of this program.</p>}</article>)}</div>
      <SharedAgencyResources /><OrganizationSourceNote />
    </div></>;
}
