import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/ui";
import { OrganizationBreadcrumb, OrganizationSourceNote, OrganizationTopicCards, SharedAgencyResources } from "@/components/organization-navigation";
import { administrationNavigation } from "@/lib/product/organization-navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const area = administrationNavigation((await params).id);
  return {title:area?.name || "Administration"};
}

export default async function AdministrationPage({ params }: { params: Promise<{ id: string }> }) {
  const area = administrationNavigation((await params).id);
  if (!area) notFound();
  return <><PageIntro kicker="One DSD · DHS organizational context" title={area.name} lede={area.description} />
    <div className="wrap max-w-6xl py-10"><OrganizationBreadcrumb items={[{label:"Home",href:"/"},{label:"Administrations",href:"/administrations"},{label:area.name}]} />
      {area.divisions.includes("dsd") && <section className="mb-12" aria-labelledby="division-branches"><h2 id="division-branches" className="text-2xl font-bold">Explore a division</h2><article className="mt-5 rounded-xl border border-line bg-white p-6"><h3 className="m-0 text-xl font-bold"><Link href="/administrations/adsa/divisions/dsd">Disability Services Division</Link></h3><p>Explore the DSD program, its service context and its practical learning resources in One DSD.</p><Link href="/administrations/adsa/divisions/dsd">Open the Disability Services branch</Link></article><p className="mt-4"><Link href="/learn/equity-toolkit/goals">ADSA's six equity goals and implementation connections</Link></p></section>}
      <section aria-labelledby="administration-context"><h2 id="administration-context" className="mb-6 text-2xl font-bold">Services and working relationships</h2><OrganizationTopicCards ids={area.topics} /></section>
      <SharedAgencyResources /><OrganizationSourceNote />
    </div></>;
}
