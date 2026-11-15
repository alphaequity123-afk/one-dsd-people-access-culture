import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PageIntro } from "@/components/ui";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { linkListValue, stringListValue, stringValue } from "@/lib/content/staff-surface-registry";
import { PROGRAM } from "@/lib/constants";
import { ResourceDownloads } from "@/components/resource-downloads";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const surface = await prepareEditableSurface("about.page");
  const copy = surface.values;
  const supportLinks = linkListValue(copy, "supportLinks");
  const sourcesBody = stringValue(copy, "sourcesBody").replace(/\b(?:its\s+)?review date,\s*/gi, "");
  return (
    <EditableSurfaceRegion surface={surface}>
      <PageIntro
        kicker={stringValue(copy, "introKicker")}
        title={stringValue(copy, "introTitle")}
        lede={stringValue(copy, "introLede")}
      />
      <div className="wrap max-w-5xl space-y-10 py-10">
        {surface.available ? <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="equity-review" id="about" noun="page" /></details> : null}
        <section className="grid gap-x-12 gap-y-8 lg:grid-cols-2" aria-labelledby="purpose-title">
          <div>
            <p className="kicker">{stringValue(copy, "purposeKicker")}</p>
            <h2 id="purpose-title" className="text-2xl font-extrabold">
              {stringValue(copy, "purposeTitle")}
            </h2>
            <p>
              {stringValue(copy, "purposeBody")}
            </p>
            <p>{PROGRAM.leadershipStatement}</p>
            <p className="m-0">
              {stringValue(copy, "purposeBoundary")}
            </p>
          </div>
          <div>
            <p className="kicker">{stringValue(copy, "federationKicker")}</p>
            <h2 className="text-2xl font-extrabold">{stringValue(copy, "federationTitle")}</h2>
            <p>
              {stringValue(copy, "federationBody")}
            </p>
            <p className="m-0">
              {stringValue(copy, "federationBoundary")}
            </p>
          </div>
        </section>

        <section aria-labelledby="dhs-connection-title" className="border-t border-line pt-6"><h2 id="dhs-connection-title" className="text-2xl font-extrabold">This program supports one division inside DHS</h2><p>One DSD People, Access and Culture supports the Disability Services Division. The division sits within the Aging and Disability Services Administration (ADSA) at the Minnesota Department of Human Services (DHS).</p><p>Knowing our programs, partners, and shared responsibilities helps connect equity, accessibility, and inclusion to service delivery and workplace decisions.</p><Link href="/understanding-dhs" className="font-semibold">Explore Understanding DHS</Link></section>

        <section aria-labelledby="how-it-works-title" className="border-t border-line pt-6"><h2 id="how-it-works-title" className="text-2xl font-extrabold">The program links learning, practice, and review</h2><p>The program connects learning, practice, and review in a set order. It rests on three pillars of equity practice, and it makes specific commitments to the people who use it.</p><p>Those commitments are set out on their own page, together with the charter. The charter is the written set of principles that governs the whole program.</p><p><Link href="/program/model" className="font-semibold">Read how the program works</Link> · <Link href="/program-foundation" className="font-semibold">Read the Program charter</Link></p></section>

        <section aria-labelledby="participation-title">
          <p className="kicker">{stringValue(copy, "participationKicker")}</p>
          <h2 id="participation-title" className="text-2xl font-extrabold">
            {stringValue(copy, "participationTitle")}
          </h2>
          <div className="mt-4 grid gap-x-12 gap-y-6 md:grid-cols-2">
            <div className="border-t border-line pt-4">
              <h3 className="text-xl font-bold">{stringValue(copy, "voluntaryTitle")}</h3>
              <p className="m-0">
                {stringValue(copy, "voluntaryBody")}
              </p>
            </div>
            <div className="border-t border-line pt-4">
              <h3 className="text-xl font-bold">{stringValue(copy, "requiredTitle")}</h3>
              <p className="m-0">
                {stringValue(copy, "requiredBody")}
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-4xl border-t border-line pt-5" aria-labelledby="sources-title">
          <p className="kicker">{stringValue(copy, "sourcesKicker")}</p>
          <h2 id="sources-title" className="text-2xl font-extrabold">
            {stringValue(copy, "sourcesTitle")}
          </h2>
          <p>
            {sourcesBody}
          </p>
          <p className="m-0">
            {stringValue(copy, "sourcesBoundary")}
          </p>
        </section>

        <section className="grid gap-x-12 gap-y-8 border-t border-line pt-5 md:grid-cols-2" aria-labelledby="boundaries-title">
          <div>
            <p className="kicker">{stringValue(copy, "boundariesKicker")}</p>
            <h2 id="boundaries-title" className="text-2xl font-extrabold">
              {stringValue(copy, "boundariesTitle")}
            </h2>
            <ul className="mt-3 list-disc pl-6">
              {stringListValue(copy, "boundaries").map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div>
            <p className="kicker">{stringValue(copy, "supportKicker")}</p>
            <h2 className="text-xl font-extrabold">{stringValue(copy, "supportTitle")}</h2>
            <p>
              {stringValue(copy, "supportBody")}
            </p>
            <div className="flex flex-wrap gap-3">
              {supportLinks.map((link, index) => <Link href={link.href} className={index === 0 ? "btn btn--primary" : "btn btn--light"} key={link.href}>{link.label}</Link>)}
            </div>
          </div>
        </section>
      </div>
    </EditableSurfaceRegion>
  );
}
