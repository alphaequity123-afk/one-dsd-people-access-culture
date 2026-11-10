import { ResourceEvidence } from "@/components/source-evidence";
import styles from "../resource-design.module.css";
import { relatedPublishedResources } from "@/lib/content/corpus-inventory";
import { readingsFor } from "@/lib/content/knowledge-graph";
import { normalizeWorkOrigin, withWorkOrigin } from "@/lib/product/work-origin";
import { WorkOriginLinks } from "@/components/work-origin-links";
import { LearningJourneyLink } from "@/components/learning-journey-link";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {selfDirectedHref, SELF_DIRECTED_COURSES} from '@/lib/content/self-directed';
import { ResourceInlineEditor } from "@/components/resource-inline-editor";
import { ResourceRemove, ResourceShare } from "@/components/resource-tools";
import { ResourceMediaGallery } from "@/components/resource-media-gallery";
import { ResourceDownloads } from "@/components/resource-downloads";
import { ActionList, AuthorityPill, Notice } from "@/components/ui";
import { progressionLabel, resourceProgressionLevel } from "@/lib/content/progression";
import { editingModeFromCookies } from "@/lib/auth/request";
import { loadEditableResourceState } from "@/lib/content/resource-drafts";
import { getPublishedStaffContent } from "@/lib/content/staff-publications";
import { getPath, GRADUATION_PATHS } from "@/lib/content/paths";
import { AUTHORITY, CONTENT_TYPE_LABEL, LAYER_LABEL } from "@/lib/content/types";
import { consultationIntakeEnabled } from "@/lib/intelligence/consult/availability";
import { requestedContentScope } from "@/lib/product/request-context";
import { requestedProductContext } from "@/lib/product/request-context";
import { contextualizeSupportAction } from "@/lib/product";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { stringValue } from "@/lib/content/staff-surface-registry";
import { culturalIntelligenceHubAvailable } from "@/lib/content/cultural-intelligence-publication";
import { ToolDecisionQuestions } from "@/components/tool-decision-questions";
import { RESOURCE_DECISION_QUESTIONS } from "@/lib/content/tool-decision-questions";

export const dynamic = "force-dynamic";

const culturalIntelligenceResourceIds = new Set([
  "tool-idi",
  "tool-lifecourse",
  "lm-disability-rights-and-service-delivery",
  "ja-access-checks",
]);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const course=SELF_DIRECTED_COURSES.find(c=>'self-directed-'+c.number===id);
  if(course)return {title:course.title};
  const c = await getPublishedStaffContent(id, { scope: await requestedContentScope() });
  return { title: c ? c.title : "Resource" };
}

export default async function ResourcePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<Record<string,string|string[]|undefined>> }) {
  const { id } = await params;
  const courseHref=selfDirectedHref(id);
  if(courseHref)redirect(courseHref);
  const origin=normalizeWorkOrigin(await searchParams??{});
  const [scope, context] = await Promise.all([requestedContentScope(), requestedProductContext()]);
  const [c, owner, shellSurface] = await Promise.all([
    getPublishedStaffContent(id, { scope }),
    editingModeFromCookies(),
    prepareEditableSurface("library.resource-shell", { scope }),
  ]);
  if (!c || c.status !== "approved") notFound();
  let culturalIntelligenceAvailable = false;
  if (culturalIntelligenceResourceIds.has(id) && shellSurface.available) {
    culturalIntelligenceAvailable = await culturalIntelligenceHubAvailable(scope);
  }
  const shell = shellSurface.values;
  let related: Awaited<ReturnType<typeof relatedPublishedResources>>=[]; let relatedUnavailable=false;
  try { related=await relatedPublishedResources(scope,id); } catch { relatedUnavailable=true; }
  // Some library items (learning modules, question banks) are not draft-editable in the
  // database. That must never take the page down: fall back to the read-only view.
  let editable: Awaited<ReturnType<typeof loadEditableResourceState>> | undefined;
  let editorUnavailable = false;
  if (owner) {
    try { editable = await loadEditableResourceState(id, { scope }); } catch (error) {
      editable = undefined;
      // Learning modules and question banks are expected to fail here; anything
      // else is a real failure the owner must be able to see.
      if (c.type !== "learning_module" && c.type !== "question_bank") {
        editorUnavailable = true;
        console.error("Resource editor could not be loaded.", error instanceof Error ? `${error.name}: ${error.message}` : error);
      }
    }
  }
  const paths = (c.pathIds ?? []).map((p) => getPath(p)).filter(Boolean);
  const isList = c.type === "checklist" || c.type === "question_bank";
  const intakeEnabled = consultationIntakeEnabled();
  const nextActions = c.nextActions.map((action) =>
    (()=>{const result=contextualizeSupportAction(action, context, intakeEnabled);return {...result,href:withWorkOrigin(result.href,origin)};})(),
  );
  const correctionAction = contextualizeSupportAction(
    { label: stringValue(shell, "consultationActionLabel"), href: "/support/right-person" },
    context,
    intakeEnabled,
  );

  return (
    <EditableSurfaceRegion surface={shellSurface} className={styles.page}>
      <header className={styles.hero}><div className={styles.heroInner}><Link href="/learn" className={styles.back}>Learn</Link><p className={styles.eyebrow}>{CONTENT_TYPE_LABEL[c.type]} · {LAYER_LABEL[c.layer]}</p><h1>{c.title}</h1><p className={styles.lede}>{c.summary}</p><div className={styles.resourceActions}><a href="#resource-reading" className={`${styles.primaryAction} text-white`}>Read this resource</a>{c.href ? <a href={c.href} rel="noreferrer">Open {c.sourceName || "the original source"}</a> : null}</div><details className={styles.downloadOptions}><summary>Download or share</summary><ResourceDownloads kind="library" id={c.id} scope={scope} share={false} /><ResourceShare title={c.title} href={"/share/library/" + encodeURIComponent(c.id)} /></details>{owner ? <ResourceRemove contentItemId={c.id} title={c.title} /> : null}<ResourceMediaGallery contentItemId={c.id} owner={owner} />
      </div></header>
      <div className={styles.content}>
        <WorkOriginLinks origin={origin} />
        {culturalIntelligenceAvailable && <p><Link href="/learn/cultural-intelligence">Explore Cultural Intelligence and related learning</Link></p>}
        <p className={styles.authority}>
          <AuthorityPill authority={c.authority} /> <span className="text-sm text-muted">{AUTHORITY[c.authority].staffNote}</span>{resourceProgressionLevel(c.id) ? <> <Link href={`/learn/paths#level-${resourceProgressionLevel(c.id)}`} className="text-sm font-semibold">{progressionLabel(resourceProgressionLevel(c.id)!)}</Link></> : null}
        </p>
        {c.authority === "external_verify" ? (
          <Notice tone="warn">
            {stringValue(shell, "outsideSourceNote")}
            {c.href ? (
              <>
                {" "}
                <a href={c.href} rel="noreferrer">
                  {stringValue(shell, "openSourceLabel")} ({c.sourceName ?? stringValue(shell, "sourceWebsiteLabel")})
                </a>
                .
              </>
            ) : (
              <> {stringValue(shell, "intranetSourceNote")}</>
            )}
          </Notice>
        ) : null}
        {c.whyItMatters ? (
          <div className={styles.why}>
            <p className="kicker">{stringValue(shell, "whyKicker")}</p>
            <p className="m-0">{c.whyItMatters}</p>
          </div>
        ) : null}
        <section id="resource-reading" className={styles.reading} aria-label="Content"><h2>{c.type === "checklist" ? "Use the checklist" : c.type === "question_bank" ? "Questions to consider" : "Read and explore"}</h2>
          {isList ? (
            <ol className="list-decimal space-y-2 pl-6">
              {c.body.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
          ) : (
            <div className="space-y-3">
              {c.body.map((p) => (
                <p key={p} className="m-0">
                  {p}
                </p>
              ))}
            </div>
          )}
        </section>
        {RESOURCE_DECISION_QUESTIONS[id] ? <ToolDecisionQuestions tool={RESOURCE_DECISION_QUESTIONS[id]} className="my-6" /> : null}
        <div className={styles.next}>
          <div>
            <ActionList heading={stringValue(shell, "nextStepsTitle")} actions={nextActions} />
            {paths.length ? (
              <>
                <h3 className="mt-3 text-lg font-bold">{stringValue(shell, "pathsTitle")}</h3>
                <ul className="list-disc pl-6">
                  {paths.map((p) => (
                    <li key={p!.id}>
                      <Link href={withWorkOrigin(`/practice/${p!.id}`,origin)}>{p!.title}</Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
          <div className="text-sm">
            <p className="kicker">{stringValue(shell, "questionsKicker")}</p>
            <p className="m-0">
              {stringValue(shell, "correctionsLead")} <Link href={withWorkOrigin(correctionAction.href,origin)}>{correctionAction.label.toLowerCase()}</Link>.
            </p>
          </div>
        </div>
        {related.length ? <section className="my-6 border-t border-line pt-5" aria-label="Related resources"><details className={styles.relatedReading}><summary>Related resources ({related.length})</summary><ul className="mt-3 space-y-2">{related.map(item=><li key={item.id}><Link href={withWorkOrigin("/library/"+encodeURIComponent(item.id),origin)}>{item.title}</Link></li>)}</ul></details></section> : null}
        {readingsFor(c.id).length ? <section className="my-6 border-t border-line pt-5" aria-labelledby="books-inform-title"><h2 id="books-inform-title" className="text-xl font-semibold">Books that inform this work</h2><p className="mt-2">Reading notes from the program&apos;s collection, for a deeper look at the ideas behind this resource.</p><ul className="mt-3 space-y-2">{readingsFor(c.id).map(item=><li key={item.id}><Link href={item.href}>{item.title}</Link>{item.why ? <span className="block text-sm text-muted">{item.why}</span> : null}</li>)}</ul></section> : null}
        {relatedUnavailable ? <p role="status">Related reading is temporarily unavailable. You can continue exploring the Library.</p> : null}
        <details className="my-6 border-t border-line py-4"><summary className="cursor-pointer font-semibold">About this resource</summary><dl className="mt-3 space-y-2"><div><dt className="font-semibold">Responsible team or person</dt><dd>{c.owner || "Not recorded"}</dd></div></dl><p className="mt-3">Check the original source for the decision in front of you.</p></details>
        <ResourceEvidence resourceType={["corpus_item","domain_corpus_item"]} resourceId={c.id} />
        <LearningJourneyLink scope={scope} resourceId={c.id} />
        {editorUnavailable ? <p className="notice notice--warn mt-6" role="status" data-resource-editor-unavailable="true">Editing controls for this resource could not be loaded right now. The published resource is unaffected. Reload the page to try again.</p> : null}
        {editable ? (
          <ResourceInlineEditor
            initial={editable}
            pathOptions={GRADUATION_PATHS.map((path) => ({ id: path.id, label: path.staffLabel }))}
          />
        ) : null}
      </div>
    </EditableSurfaceRegion>
  );
}
