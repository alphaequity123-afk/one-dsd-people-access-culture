import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PageIntro } from "@/components/ui";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { linkListValue, stringListValue, stringValue } from "@/lib/content/staff-surface-registry";
import { PROGRAM } from "@/lib/constants";
import { ResourceDownloads } from "@/components/resource-downloads";
import { Hub2More } from "@/components/hub2-choices";
import { USER_GUIDE } from "@/lib/program/user-guide";
import { foundationArticles, foundationProvisions } from "@/lib/program/constitution";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "About and help" };

/**
 * v2 rebuild (owner decision 2026-11-25, Gemini overhaul): About, How to use this site, Support and the Program
 * charter come together on this one page, so the menu can be Home plus four pillars. Nothing is dropped: the guide
 * sections, the support doors and every charter provision appear here in full, and the original pages stay open
 * at their own addresses for links and bookmarks.
 */
const SUPPORT_DOORS = [
  { href: ROUTES.ask.href, title: "Ask", text: "Put a question in your own words and get an answer with the sources behind it." },
  { href: ROUTES.library.href, title: "Library", text: "Guides, policy summaries and resources, each with its source." },
  { href: ROUTES.rightPerson.href, title: "Find the right person", text: "Some questions need a person with the authority to answer them. Here is who to contact." },
  { href: "/support/directory", title: "DHS offices and guidance", text: "Offices across DHS and the guidance they publish." },
  { href: "/support?view=guidance", title: "When another team can help", text: "Referrals, access barriers and questions about support." },
] as const;

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

        <section aria-labelledby="dhs-connection-title" className="border-t border-line pt-6"><h2 id="dhs-connection-title" className="text-2xl font-extrabold">Our connection to DHS</h2><p>One DSD People, Access and Culture supports the Disability Services Division within the Aging and Disability Services Administration at Minnesota DHS. Understanding our programs, partners and shared responsibilities helps connect equity, accessibility and inclusion with service delivery and workplace decisions.</p><Link href="/understanding-dhs" className="font-semibold">Explore Understanding DHS</Link></section>

        <section aria-labelledby="how-it-works-title" className="border-t border-line pt-6"><h2 id="how-it-works-title" className="text-2xl font-extrabold">How the program works</h2><p>The program connects learning, practice and review, with three pillars of equity practice and commitments to the people who use it. Read the program model alongside the proposed charter. The charter is a planning framework; applicable law, policy and assigned responsibilities continue to govern the work.</p><p><Link href="/program/model" className="font-semibold">Read how the program works</Link> · <Link href="/program-foundation" className="font-semibold">Read the Program charter</Link></p></section>

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

        <section id="how-to-use" className="border-t border-line pt-6" aria-labelledby="how-to-use-title">
          <h2 id="how-to-use-title" className="text-2xl font-extrabold">How to use this site</h2>
          <p className="max-w-3xl">{USER_GUIDE.lede} <Link href={USER_GUIDE.download} download>Download the guide as text</Link>.</p>
          <div>{USER_GUIDE.sections.map(section => <Hub2More key={section.id} id={section.id} title={section.title}>
            {section.paras.map(text => <p key={text} className="max-w-3xl leading-7">{text}</p>)}
            {section.links.length ? <p className="flex flex-wrap gap-x-6 gap-y-2">{section.links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}</p> : null}
          </Hub2More>)}</div>
        </section>

        <section id="support" className="border-t border-line pt-6" aria-labelledby="support-doors-title">
          <h2 id="support-doors-title" className="text-2xl font-extrabold">When you need support</h2>
          <p className="max-w-3xl">Most questions start with Ask. When a matter needs a formal answer or an official decision, these will get you to the right place.</p>
          <ul className="pilot-topic-rows">{SUPPORT_DOORS.map(door => <li key={door.href}><Link href={door.href}><strong>{door.title}</strong><span>{door.text}</span></Link></li>)}</ul>
        </section>

        <section id="charter" className="border-t border-line pt-6" aria-labelledby="charter-title">
          <h2 id="charter-title" className="text-2xl font-extrabold">Program charter</h2>
          <p className="max-w-3xl">The principles and responsibilities that guide One DSD People, Access and Culture. This is a proposed charter. Applicable law, approved DHS policies and existing decision authority continue to govern official work.</p>
          {foundationArticles.map(article => <details className="dsd-model-note" key={article.id}><summary><strong>Article {article.id}. {article.title}</strong></summary>{foundationProvisions.filter(provision => provision.article === article.id).map(provision => <section key={provision.id} style={{ marginBlock: "1.5rem" }}><h3>{provision.id} {provision.title}</h3><p>{provision.summary}</p></section>)}</details>)}
          <p><Link href="/charter">Open the charter on its own page, with its explainer video</Link></p>
        </section>
      </div>
    </EditableSurfaceRegion>
  );
}
