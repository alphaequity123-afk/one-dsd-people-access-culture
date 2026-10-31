import type { Metadata } from "next";
import styles from "@/components/workspace-presentation.module.css";
import Link from "next/link";
import { ProgramContextNote } from "@/components/program-context";
import { SupportContextOptions } from "@/components/support-context-options";
import { PageIntro } from "@/components/ui";
import { ROUTES } from "@/lib/constants";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { stringValue } from "@/lib/content/staff-surface-registry";
import { ExplainerVideo } from "@/components/explainer-video";

export const metadata: Metadata = { title: ROUTES.support.label };

export default async function SupportPage() {
  const surface = await prepareEditableSurface("support.page");
  const copy = surface.values;
  const doors = [ROUTES.ask.href, ROUTES.library.href, ROUTES.rightPerson.href, ROUTES.areas.href].map((href, index) => ({
    href,
    title: stringValue(copy, `door${index}Title`),
    description: stringValue(copy, `door${index}Description`),
  }));
  return (
    <EditableSurfaceRegion surface={surface}>
      <PageIntro kicker={stringValue(copy, "introKicker")} title={stringValue(copy, "introTitle")} lede="Find a practical starting point, or connect with the person who can help you take the next step." />
      <div className="wrap space-y-8 py-8">
        <ProgramContextNote />
        <ExplainerVideo id="right-person" />
        <ul className={styles.supportDirectory}>
          {doors.map((door) => <li key={door.href}><Link href={door.href} className={styles.directoryLink}><strong>{door.title}</strong><span>{door.description}</span><span className={styles.directoryArrow} aria-hidden="true">→</span></Link></li>)}
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
          <p>Use the Library, common questions, or Find the right person for guidance with your work.</p>
        </details>
      </div>
    </EditableSurfaceRegion>
  );
}
