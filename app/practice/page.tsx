import type { Metadata } from "next";
import Link from "@/components/app-link";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { LearningJourneyLink } from "@/components/learning-journey-link";
import { ParticipationNotice } from "@/components/participation-notice";
import { ProgramContextNote } from "@/components/program-context";
import { PageIntro } from "@/components/ui";
import { WorkOriginLinks } from "@/components/work-origin-links";
import { MEASUREMENT_HREF, MEASUREMENT_RESOURCE_ID } from "@/lib/content/measurement-practice";
import { GRADUATION_PATHS } from "@/lib/content/paths";
import { publishedPracticePath, withoutPublishedSaveClaims } from "@/lib/content/published-practice-path";
import { loadStaffContentSnapshot } from "@/lib/content/staff-publications";
import { applyGraduationPathValues, graduationPathSurfaceId, linkListValue, stringValue } from "@/lib/content/staff-surface-registry";
import { requestedContentScope } from "@/lib/product/request-context";
import { normalizeWorkOrigin, workOriginForPath, withWorkOrigin, type WorkOriginInput } from "@/lib/product/work-origin";
import styles from "./practice-entry.module.css";

export const metadata: Metadata = { title: "Practice" };

const DECISION_IDS = ["gp-12", "gp-7"] as const;
const PRACTICE_GROUPS = [
  { title: "Plan a program or service", ids: ["gp-1", "gp-10"] },
  { title: "Change a form or policy", ids: ["gp-2"] },
  { title: "Engage a community", ids: ["gp-3"] },
  { title: "Hire or design a role", ids: ["gp-6"] },
  { title: "Plan a meeting or training", ids: ["gp-8", "gp-5"] },
  { title: "Review a draft", ids: ["gp-9", "gp-13"] },
  { title: "Support a team", ids: ["gp-4", "gp-11"] },
] as const;
const groupedIds = new Set<string>([...DECISION_IDS, ...PRACTICE_GROUPS.flatMap(group => group.ids)]);

export default async function PracticePage({ searchParams }: { searchParams?: Promise<WorkOriginInput & { topic?: string }> }) {
  const query = await searchParams ?? {};
  const origin = normalizeWorkOrigin(query);
  const scope = await requestedContentScope();
  const [surface, measurement, measurementSources, ...pathSurfaces] = await Promise.all([
    prepareEditableSurface("practice.page", { scope }),
    prepareEditableSurface("practice.measurement", { scope, includeOwner: false }),
    loadStaffContentSnapshot({ scope }),
    ...GRADUATION_PATHS.map(path => prepareEditableSurface(graduationPathSurfaceId(path.id), { scope, includeOwner: false })),
  ]);
  const measurementAvailable = measurement.available && measurementSources.items.some(item => item.id === MEASUREMENT_RESOURCE_ID);
  const copy = surface.values;
  const paths = GRADUATION_PATHS.flatMap((path, index) => pathSurfaces[index].available
    ? [publishedPracticePath(applyGraduationPathValues(path, pathSurfaces[index].values))] : []);
  const byId = new Map(paths.map(path => [path.id, path]));
  const groups = [
    ...PRACTICE_GROUPS.map(group => ({
      title: group.title,
      paths: group.ids.flatMap(id => {
        const path = byId.get(id);
        return path ? [path] : [];
      }),
    })),
    { title: "Other practices", paths: paths.filter(path => !groupedIds.has(path.id)) },
  ].filter(group => group.paths.length);
  const practiceHref = (id: typeof paths[number]["id"]) => withWorkOrigin(`/practice/${id}`, workOriginForPath(origin, id));
  const selectedGroup = groups.find(group => group.paths[0]?.id === query.topic);

  if (selectedGroup) return <article className="pilot-topic">
    <header>
      <Link href={withWorkOrigin("/practice", origin)}>Back to Practice</Link>
      <h1>{selectedGroup.title}</h1>
    </header>
    <section aria-label="Guided practices">
      <ul className="pilot-topic-rows">{selectedGroup.paths.map(path => <li key={path.id}>
        <Link href={practiceHref(path.id)}><strong>{path.title}</strong></Link>
      </li>)}</ul>
    </section>
  </article>;

  return (
    <EditableSurfaceRegion surface={surface}>
      <PageIntro title={stringValue(copy, "introTitle")} lede={withoutPublishedSaveClaims(stringValue(copy, "introLede"))} />
      <div className="pilot-topic space-y-6">
        <WorkOriginLinks origin={origin} />
        <section className={styles.choices} aria-labelledby="practice-choices-title">
          <h2 id="practice-choices-title" className="mb-3 text-2xl font-bold">{stringValue(copy, "choicesTitle")}</h2>
          <details className={styles.group} id="equity-analysis">
            <summary>Analyze a decision</summary>
            <div className={styles.groupBody}>
              <ul className={styles.links}>
                {byId.has("gp-12") ? <li><Link href={practiceHref("gp-12")}>Quick check</Link><span className={styles.context}>Routine decisions</span></li> : null}
                {byId.has("gp-7") ? <li><Link href={practiceHref("gp-7")}>Standard analysis</Link><span className={styles.context}>Changes that affect access</span></li> : null}
                <li><Link href={withWorkOrigin("/equity-review", origin)}>In-depth review</Link><span className={styles.context}>Policy or system changes</span></li>
              </ul>
              <p className={styles.related}><Link href="/learn/equity-toolkit#equity-analysis">Compare the three levels</Link><Link href="/equity-policy">Equity analysis policy</Link></p>
              <p className={styles.related}><Link href={withWorkOrigin("/practice/requirements", origin)}>Check requirements</Link><Link href={withWorkOrigin("/learn/equity-toolkit/practice", origin)}>Open the toolkit worksheet</Link></p>
            </div>
          </details>
          <ul className="pilot-topic-rows">{groups.map(group => <li key={group.title}>
            <Link href={group.paths.length === 1 ? practiceHref(group.paths[0].id) : withWorkOrigin(`/practice?topic=${group.paths[0].id}`, origin)}>
              <strong>{group.title}</strong>
            </Link>
          </li>)}</ul>
        </section>

        <details className={styles.group}>
          <summary>More tools and guidance</summary>
          <div className={`${styles.groupBody} space-y-3`}>
            <p>{withoutPublishedSaveClaims(stringValue(copy, "moreBody"))}</p>
            <p>{withoutPublishedSaveClaims(stringValue(copy, "choicesIntro"))}</p>
            <ul className={styles.links}>
              <li><Link href="/learn/equity-in-practice">Equity in practice</Link></li>
              <li><Link href="/one-dsd#scenarios">One DSD scenarios</Link></li>
              {measurementAvailable ? <li><Link href={withWorkOrigin(MEASUREMENT_HREF, normalizeWorkOrigin({ ...origin, area: "measurement", task: "evaluation-plan" }))}>{stringValue(measurement.values, "title")}</Link></li> : null}
              <li><Link href="/operationalizing-equity">Operationalizing equity</Link></li>
              {linkListValue(copy, "moreLinks").map(link => <li key={link.href}><Link href={withWorkOrigin(link.href, origin)}>{link.label}</Link></li>)}
            </ul>
            <LearningJourneyLink scope={scope} compact />
            <ProgramContextNote />
            <ParticipationNotice surface="path_practice" />
          </div>
        </details>
      </div>
    </EditableSurfaceRegion>
  );
}
