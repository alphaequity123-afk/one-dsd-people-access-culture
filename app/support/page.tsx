import type { Metadata } from "next";
import styles from "@/components/workspace-presentation.module.css";
import Link from "@/components/app-link";
import { ProgramContextNote } from "@/components/program-context";
import { SupportContextOptions } from "@/components/support-context-options";
import { PageIntro } from "@/components/ui";
import { ROUTES } from "@/lib/constants";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { stringValue } from "@/lib/content/staff-surface-registry";
import { ExplainerVideo } from "@/components/explainer-video";

export const metadata: Metadata = { title: ROUTES.support.label };

export default async function SupportPage({ searchParams }: { searchParams?: Promise<{ view?: string }> }) {
  const surface = await prepareEditableSurface("support.page");
  const copy = surface.values;
  const doors = [ROUTES.ask.href, ROUTES.library.href, ROUTES.rightPerson.href, ROUTES.areas.href].map((href, index) => ({
    href,
    title: stringValue(copy, `door${index}Title`),
    description: stringValue(copy, `door${index}Description`),
  })).filter(door => door.href !== ROUTES.ask.href);
  if ((await searchParams)?.view !== "guidance") return (
    <EditableSurfaceRegion surface={surface} className="pilot-topic">
      <header>
        <h1>{stringValue(copy, "introTitle")}</h1>
        <p>This page helps staff of the Disability Services Division (DSD) find a practical starting point, or reach the person who can help with the next step.</p>
      </header>
      <section aria-label="Support resources">
        <ul className="pilot-topic-rows">
          {doors.map(door => <li key={door.href}><Link href={door.href}><strong>{door.title}</strong><span>{door.description}</span></Link></li>)}
          <li><Link href="/support/directory"><strong>DHS offices and guidance</strong><span>Look up the DHS office or guidance that covers your question.</span></Link></li>
          <li><Link href="/support?view=guidance"><strong>When another team can help</strong><span>Find out where to send a referral, report an access barrier, or ask a question about support.</span></Link></li>
        </ul>
      </section>
    </EditableSurfaceRegion>
  );
  return (
    <EditableSurfaceRegion surface={surface}>
      <PageIntro title="When another team can help" lede="This page lists ways to get support for DSD work. Use it to find the right person, the right office, or the right resource." />
      <div className="wrap space-y-8 py-8">
        <Link href="/support">Back to Support</Link>
        <ProgramContextNote />
        <ExplainerVideo id="right-person" />
        <ul className={styles.supportDirectory}>
          {doors.map((door) => <li key={door.href}><Link href={door.href} className={styles.directoryLink}><strong>{door.title}</strong><span>{door.description}</span></Link></li>)}
        </ul>
        <p><Link href="/support/directory">DHS offices and guidance</Link></p>
        <div className={styles.supportLower}>
        <SupportContextOptions copy={copy} />
        <aside className={styles.supportNotes}>
        <div>
          <p className="kicker">{stringValue(copy, "boundaryKicker")}</p>
          <p className="m-0">{stringValue(copy, "boundaryBody")}</p>
          <p className="mt-2">
            <Link href="/support/right-person">{stringValue(copy, "boundaryLink")}</Link>
          </p>
        </div>
        <div>
          <p className="kicker">{stringValue(copy, "accessKicker")}</p>
          <p className="m-0 text-sm">{stringValue(copy, "accessBody")}</p>
        </div>
        </aside>
        </div>
        <details className={styles.resultInvitation}>
          <summary className="cursor-pointer font-semibold">About support</summary>
          <p>For help with your work, use the Library, the common questions, or Find the right person.</p>
        </details>
      </div>
    </EditableSurfaceRegion>
  );
}
