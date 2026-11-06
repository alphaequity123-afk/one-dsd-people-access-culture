import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/ui";
import { PageContents } from "@/components/page-contents";
import styles from "@/components/director-toolkit.module.css";
import {
  DIRECTOR_FIRST_90_DAYS, DIRECTOR_STARTER_PACKAGE, DIRECTOR_TEMPLATES_HREF, DIRECTOR_TOOLKIT_INTRO, DIRECTOR_TOOLKIT_SECTIONS,
  directorTemplate, templateHref, type ToolkitItem, type ToolkitSection,
} from "@/lib/content/director-toolkit";
import { ResourceDownloads } from "@/components/resource-downloads";

export const metadata: Metadata = {
  title: "Equity Director toolkit",
  description: "Tools Equity Directors at the Minnesota Department of Human Services can use for equity work across the agency, with a first 90-day plan, a 12-item starter package and printable templates.",
};

function Item({ item }: { item: ToolkitItem }) {
  const template = item.templateId ? directorTemplate(item.templateId) : undefined;
  return <li className={styles.item}>
    <h3>{item.name}</h3>
    {item.publisher ? <p className={styles.publisher}>{item.publisher}</p> : null}
    <dl className={styles.facts}>
      <dt>What it is for</dt><dd>{item.purpose}</dd>
      <dt>How an Equity Director uses it</dt><dd>{item.use}</dd>
    </dl>
    {template || item.href || item.url ? <p className={styles.itemLinks}>
      {template ? <Link href={templateHref(template.id)}>Fill in the {template.title.replaceAll("\"", "")} template</Link> : null}
      {item.href ? <Link href={item.href}>Open the related page</Link> : null}
      {item.url ? <a href={item.url}>Open the published resource</a> : null}
    </p> : null}
  </li>;
}

function FirstNinetyDays() {
  return <div className={styles.tableWrap}><table className={styles.plan}>
    <caption className="sr-only">First 90 days: priority actions and deliverables for each period</caption>
    <thead><tr><th scope="col">Period</th><th scope="col">Priority actions</th><th scope="col">Deliverables</th></tr></thead>
    <tbody>{DIRECTOR_FIRST_90_DAYS.map(period => <tr key={period.id} id={period.id}>
      <th scope="row">{period.period}</th>
      <td><ul>{period.actions.map(action => <li key={action}>{action}</li>)}</ul></td>
      <td><ul>{period.deliverables.map(deliverable => <li key={deliverable}>{deliverable}</li>)}</ul></td>
    </tr>)}</tbody>
  </table></div>;
}

function StarterPackage() {
  return <ol className={styles.starter}>{DIRECTOR_STARTER_PACKAGE.map(item => <li key={item.number}>
    <p><span className={styles.num}>{item.number}.</span><Link href={item.href}>{item.title}</Link></p>
    <p>{item.detail}</p>
  </li>)}</ol>;
}

function Section({ section }: { section: ToolkitSection }) {
  const prominent = section.id === "first-90-days" || section.id === "starter-package";
  return <section id={section.id} aria-labelledby={`${section.id}-title`} className={prominent ? styles.highlight : styles.section}>
    <p className={styles.sectionNumber}>Section {section.number}</p>
    <h2 id={`${section.id}-title`} className="text-2xl font-bold">{section.title}</h2>
    <p className={styles.question}>{section.question}</p>
    {section.intro.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    {section.id === "first-90-days" ? <FirstNinetyDays /> : null}
    {section.id === "starter-package" ? <StarterPackage /> : null}
    {section.items.length ? <ul className={styles.items}>{section.items.map(item => <Item key={item.name} item={item} />)}</ul> : null}
    {section.lists?.map(list => <div key={list.heading} className="mt-5">
      <h3 className="text-xl font-bold">{list.heading}</h3>
      <ul className="list-disc pl-6">{list.items.map(entry => <li key={entry}>{entry}</li>)}</ul>
      {list.note ? <p>{list.note}</p> : null}
    </div>)}
    {section.caution ? <p className={styles.caution}><strong>Important: </strong>{section.caution}</p> : null}
    {section.notes?.map(note => <p key={note}>{note}</p>)}
    {section.related?.length ? <p className={styles.itemLinks}>{section.related.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</p> : null}
  </section>;
}

export default function DirectorToolkitPage() {
  const contents = [
    { href: "#start-here", label: "Start here" },
    ...DIRECTOR_TOOLKIT_SECTIONS.map(section => ({ href: `#${section.id}` as const, label: `${section.number}. ${section.title}` })),
  ] as const;
  return <>
    <PageIntro tone="business" kicker="Equity in practice" title={DIRECTOR_TOOLKIT_INTRO.title} lede={DIRECTOR_TOOLKIT_INTRO.lede}>
      <p className="mt-4 max-w-3xl"><Link href={DIRECTOR_TEMPLATES_HREF}>Open the 14 printable templates</Link></p>
      <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="equity-review" id="director-toolkit" noun="toolkit" /></details>
    </PageIntro>
    <div className="wrap py-10">
      <PageContents items={contents}>
        <section aria-labelledby="overview-title">
          <h2 id="overview-title" className="text-2xl font-bold">Overview</h2>
          {DIRECTOR_TOOLKIT_INTRO.summary.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <p className="notice">{DIRECTOR_TOOLKIT_INTRO.privacy}</p>
        </section>
        <section id="start-here" aria-labelledby="start-here-title" className={styles.highlight}>
          <h2 id="start-here-title" className="text-2xl font-bold">Start here</h2>
          <p>New to the role, or starting a new equity effort? Begin with two things.</p>
          <ul className="list-disc pl-6">
            <li><a href="#first-90-days">The first 90 days</a>: what to do in each 30-day period, and what each period should produce.</li>
            <li><a href="#starter-package">The 12-item priority starter package</a>: three foundational DHS resources and nine practical supports to build with the people responsible for each area.</li>
            <li><Link href={DIRECTOR_TEMPLATES_HREF}>The printable templates</Link>: fill them in on screen, then print, copy or download. Nothing is saved or sent.</li>
          </ul>
        </section>
        {DIRECTOR_TOOLKIT_SECTIONS.map(section => <Section key={section.id} section={section} />)}
        <nav aria-label="Related resources" className="flex flex-wrap gap-6">
          <Link href="/equity-review">Equity review tools</Link>
          <Link href="/equity-policy">DHS equity policy</Link>
          <Link href="/learn/equity-toolkit">Equity Analysis Toolkit companion</Link>
          <Link href="/operationalizing-equity">Operationalizing Equity</Link>
          <Link href="/support/right-person">Find the person or area responsible</Link>
        </nav>
      </PageContents>
    </div>
  </>;
}
