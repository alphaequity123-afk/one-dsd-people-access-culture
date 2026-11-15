import { FocusedSections } from "@/components/focused-sections";

import { SourceLink } from "@/components/app-link";
import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PageIntro } from "@/components/ui";
import { DirectorToolkitTemplate } from "@/components/director-toolkit-template";
import styles from "@/components/director-toolkit.module.css";
import { DIRECTOR_TEMPLATES, DIRECTOR_TOOLKIT_HREF, DIRECTOR_TOOLKIT_SECTIONS, TEMPLATE_KEEP_OUT, templateAnchor } from "@/lib/content/director-toolkit";
import { ResourceDownloads } from "@/components/resource-downloads";

export const metadata: Metadata = {
  title: "Equity Director toolkit templates",
  description: "Fourteen printable fill-in templates for equity reviews at the Minnesota Department of Human Services. The app does not autosave or submit template entries.",
};

export default function DirectorToolkitTemplatesPage() {
  const sectionTitle = (id: string) => DIRECTOR_TOOLKIT_SECTIONS.find(section => section.id === id)?.title ?? "Equity Director toolkit";
  return <>
    <div className={styles.printHide}>
      <PageIntro tone="business" kicker="Equity Director toolkit" title="Printable templates" lede="Fill-in templates for equity reviews at the Minnesota Department of Human Services (DHS). Fill them in on screen, then print, copy or download.">
        <p className="mt-4 max-w-3xl"><Link href={DIRECTOR_TOOLKIT_HREF}>Back to the Equity Director toolkit</Link></p>
        <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="equity-review" id="templates" noun="set of blank templates" /></details>
      </PageIntro>
    </div>
    <div className="wrap max-w-5xl space-y-10 py-10"><FocusedSections>
      <section aria-labelledby="templates-about" className={styles.printHide}>
        <h2 id="templates-about" className="text-2xl font-bold">Before you start</h2>
        <p>These templates put the DHS Equity Policy, the DHS Equity Analysis Toolkit and the State of Minnesota Equity Analysis Toolkit into practice. They do not replace them. Adapt each one with the people responsible for the work it covers.</p>
        <p className="notice">These templates run in your browser. The app does not autosave or submit your entries. Copy, download or print if you need a record before leaving this page. {TEMPLATE_KEEP_OUT}</p>
        <h3 className="mt-6 text-xl font-bold">The 14 templates</h3>
        <ol className={styles.templateIndex}>{DIRECTOR_TEMPLATES.map(template => <li key={template.id}><SourceLink href={`#${templateAnchor(template.id)}`}>{template.title}</SourceLink></li>)}</ol>
      </section>
      {DIRECTOR_TEMPLATES.map(template => <section key={template.id} id={`topic-${template.id}`} data-topic-title={template.title}><DirectorToolkitTemplate template={template} sectionTitle={sectionTitle(template.sectionId)} /></section>)}
      <nav aria-label="Related resources" className={`flex flex-wrap gap-6 ${styles.printHide}`}>
        <Link href={DIRECTOR_TOOLKIT_HREF}>Equity Director toolkit</Link>
        <Link href="/equity-review">Equity review tools</Link>
        <Link href="/equity-review/structural">Structural equity analysis</Link>
        <Link href="/practice/measurement">Measurement and evaluation</Link>
      </nav>
    </FocusedSections></div>
  </>;
}
