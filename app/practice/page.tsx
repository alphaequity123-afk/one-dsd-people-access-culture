import { MEASUREMENT_HREF, MEASUREMENT_RESOURCE_ID } from "@/lib/content/measurement-practice";
import { loadStaffContentSnapshot } from "@/lib/content/staff-publications";
import { WorkOriginLinks } from "@/components/work-origin-links";
import { normalizeWorkOrigin, workOriginForPath, withWorkOrigin, type WorkOriginInput } from "@/lib/product/work-origin";
import { LearningJourneyLink } from "@/components/learning-journey-link";
import { EquityAnalysisLadder } from "@/components/equity-analysis-ladder";
import styles from "@/components/workspace-presentation.module.css";
import type { Metadata } from "next";
import Link from "next/link";
import { ProgramContextNote } from "@/components/program-context";
import { ParticipationNotice } from "@/components/participation-notice";
import { PageIntro } from "@/components/ui";
import { GRADUATION_PATHS } from "@/lib/content/paths";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { applyGraduationPathValues, graduationPathSurfaceId, linkListValue, stringValue } from "@/lib/content/staff-surface-registry";
import { requestedContentScope } from "@/lib/product/request-context";
import { publishedPracticePath, withoutPublishedSaveClaims } from "@/lib/content/published-practice-path";

export const metadata: Metadata = { title: "Practice" };

/** Guided practices grouped by the task in front of the staff member. Every practice appears once. */
const PRACTICE_GROUPS = [
  { title: "Analyze a decision", ids: ["gp-12", "gp-7"] },
  { title: "Plan something new", ids: ["gp-1", "gp-10"] },
  { title: "Change a form, notice, or policy", ids: ["gp-2"] },
  { title: "Engage a community", ids: ["gp-3"] },
  { title: "Hire or design a role", ids: ["gp-6"] },
  { title: "Plan a meeting or session", ids: ["gp-8", "gp-5"] },
  { title: "Review before it goes out", ids: ["gp-9", "gp-13"] },
  { title: "Lead and support a team", ids: ["gp-4", "gp-11"] },
] as const;

export default async function PracticePage({ searchParams }: { searchParams?: Promise<WorkOriginInput> }) {
  const origin = normalizeWorkOrigin(await searchParams ?? {});
  const scope = await requestedContentScope();
  const [surface, ...pathSurfaces] = await Promise.all([
    prepareEditableSurface("practice.page", { scope }),
    ...GRADUATION_PATHS.map((path) => prepareEditableSurface(graduationPathSurfaceId(path.id), { scope, includeOwner: false })),
  ]);
  const [measurement, measurementSources] = await Promise.all([prepareEditableSurface("practice.measurement", { scope, includeOwner: false }), loadStaffContentSnapshot({ scope })]);
  const measurementAvailable = measurement.available && measurementSources.items.some(item => item.id === MEASUREMENT_RESOURCE_ID);
  const copy = surface.values;
  const moreLinks = linkListValue(copy, "moreLinks");
  const paths = GRADUATION_PATHS.flatMap((path, index) => pathSurfaces[index].available ? [publishedPracticePath(applyGraduationPathValues(path, pathSurfaces[index].values))] : []);
  return (
    <EditableSurfaceRegion surface={surface}>
      <PageIntro
        kicker={stringValue(copy, "introKicker")}
        title={stringValue(copy, "introTitle")}
        lede={withoutPublishedSaveClaims(stringValue(copy, "introLede"))}
      />
      <div className="wrap space-y-7 py-8">
        <ProgramContextNote />
        <WorkOriginLinks origin={origin} />
        <aside className="card" aria-label="Equity in practice">
          <p className="font-semibold"><Link href="/learn/equity-in-practice">Equity in practice: watch the two-part story</Link></p>
          <p className="mt-2">Understand the Equity Outcome Map, then follow DSD examples that connect the six goals of the Aging and Disability Services Administration with useful tools and learning. <Link href="/one-dsd#scenarios">See DSD scenarios</Link>.</p>
        </aside>
        <EquityAnalysisLadder />
        <details className="card"><summary className="font-semibold">Check which requirements apply before choosing an action</summary><p className="mt-3">Connect the Program charter, published policies, standards and local priorities to the work in front of you. Separate what is clearly required from the questions that belong with the responsible office.</p><Link href={withWorkOrigin("/practice/requirements", origin)}>Prepare a requirements crosswalk</Link></details>

        <section aria-labelledby="practice-choices-title">
          <p className="kicker">{stringValue(copy, "choicesKicker")}</p>
          <h2 id="practice-choices-title" className="text-2xl font-extrabold">{stringValue(copy, "choicesTitle")}</h2>
          <p className="max-w-3xl text-muted">
            {withoutPublishedSaveClaims(stringValue(copy, "choicesIntro"))}
          </p>
          <p className="max-w-3xl">Bring something real: a meeting plan, a form, a service decision. Choose the practice that fits, try its questions against your work, and decide what you will change.</p>
          {PRACTICE_GROUPS.map(group => {
            const groupPaths = group.ids.flatMap(id => paths.filter(path => path.id === id));
            return groupPaths.length ? <div key={group.title} className="mt-6">
              <h3 className="text-xl font-bold">{group.title}</h3>
              <ul className={styles.practiceList}>
                {groupPaths.map((path) => (
                  <li key={path.id} className={styles.practiceRow}>
                    <div><p className="kicker">{path.staffLabel}</p>
                    <h4 className="text-xl font-extrabold">
                      <Link href={withWorkOrigin(`/practice/${path.id}`, workOriginForPath(origin, path.id))}>{path.title}</Link>
                    </h4>
                    <p>{path.startingCompetence}</p></div>
                    <p className={styles.practiceArtifact}><strong>{stringValue(copy, "createsLabel")}</strong>{path.artifactTitle}</p>
                  </li>
                ))}
              </ul>
            </div> : null;
          })}
        </section>

        <div className={styles.practiceConnections}>
          <LearningJourneyLink scope={scope} compact />
          <p><Link href="/operationalizing-equity">Explore how guided practice connects to operationalizing equity</Link></p>
        </div>

        {measurementAvailable ? <section className={styles.practiceMore}><h2 className="text-2xl font-bold"><Link href={withWorkOrigin(MEASUREMENT_HREF, normalizeWorkOrigin({ ...origin, area: "measurement", task: "evaluation-plan" }))}>{stringValue(measurement.values, "title")}</Link></h2><p>{stringValue(measurement.values, "intro")}</p></section> : null}

        <aside className={styles.practiceMore} aria-labelledby="practice-more-title">
          <p className="kicker">{stringValue(copy, "moreKicker")}</p>
          <h2 id="practice-more-title" className="text-xl font-extrabold">{stringValue(copy, "moreTitle")}</h2>
          <p>
            {stringValue(copy, "moreBody")}
          </p>
          <div className="flex flex-wrap gap-3">
            {moreLinks.map((link, index) => <Link href={withWorkOrigin(link.href, origin)} className={index === 0 ? "btn btn--primary" : "btn btn--light"} key={link.href}>{link.label}</Link>)}
          </div>
        </aside>
        <ParticipationNotice surface="path_practice" />
      </div>
    </EditableSurfaceRegion>
  );
}
