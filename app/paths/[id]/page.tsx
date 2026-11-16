import { WorkOriginLinks } from "@/components/work-origin-links";
import { workOriginForPath, withWorkOrigin, type WorkOriginInput } from "@/lib/product/work-origin";
import type { Metadata } from "next";
import Link from "@/components/app-link";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/ui";
import { ResourceDownloads } from "@/components/resource-downloads";
import { PathBrowse } from "@/components/path-browse";
import { getPath } from "@/lib/content/paths";
import { readingsFor } from "@/lib/content/knowledge-graph";
import { domainForPath, getDomain } from "@/lib/domains";
import { domainSurfaceId } from "@/lib/domains/surfaces";
import { consultationIntakeEnabled } from "@/lib/intelligence/consult/availability";
import { ProgramContextNote } from "@/components/program-context";
import { canonicalStaffHref, contextualizeSupportAction } from "@/lib/product";
import { requestedContentScope, requestedProductContext } from "@/lib/product/request-context";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { applyGraduationPathValues, graduationPathSurfaceId, stringValue } from "@/lib/content/staff-surface-registry";
import { publishedPracticePath } from "@/lib/content/published-practice-path";
import { ExplainerVideo } from "@/components/explainer-video";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = getPath(id);
  return { title: p ? `${p.title} (learning path)` : "Path" };
}

export default async function PathPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<WorkOriginInput> }) {
  const { id } = await params;
  const rawPath = getPath(id);
  if (!rawPath) notFound();
  const scope = await requestedContentScope();
  const [pathSurface, shellSurface] = await Promise.all([
    prepareEditableSurface(graduationPathSurfaceId(id), { scope }),
    prepareEditableSurface("practice.path-shell", { scope }),
  ]);
  const p = publishedPracticePath(applyGraduationPathValues(rawPath, pathSurface.values));
  const shell = shellSurface.values;
  const intakeEnabled = consultationIntakeEnabled();
  const context = await requestedProductContext();
  const origin = workOriginForPath(await searchParams ?? {}, p.id);
  const domain = (origin.area ? getDomain(origin.area) : undefined) ?? domainForPath(p.id);
  const domainSurface = domain ? await prepareEditableSurface(domainSurfaceId(domain.id), { scope }) : undefined;
  return (
    <EditableSurfaceRegion surface={shellSurface}>
      <EditableSurfaceRegion surface={pathSurface}>
      <PageIntro kicker={`${stringValue(shell, "introKicker")} · ${p.staffLabel}`} title={p.title} lede={p.startingCompetence}>
        <p className="mt-3 text-sm text-muted">
          {/^By the end\b/i.test(p.graduatedLooksLike) ? "" : `${stringValue(shell, "outcomeLead")}: `}{p.graduatedLooksLike}
        </p>
        {domainSurface?.available ? (
          <p className="mt-2 text-sm">
            <Link href={withWorkOrigin(domainSurface.definition.route, origin)} className="font-semibold">{stringValue(domainSurface.values, "staffLabel")}</Link>
          </p>
        ) : null}
      </PageIntro>
      <div className="wrap py-8">
        {p.id === "gp-12" ? <ExplainerVideo id="equity-pause" /> : p.id === "gp-9" ? <ExplainerVideo id="draft-review" /> : null}
        <div className="mb-6 space-y-3"><ProgramContextNote /><WorkOriginLinks origin={origin} domainAvailable={domainSurface?.available} />{pathSurface.available ? <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download this practice path</summary><ResourceDownloads kind="path" id={p.id} noun="practice path" scope={scope} /></details> : null}</div>
        <section className="grid gap-4 md:grid-cols-2" aria-labelledby="steps-title">
          <div className="border-t border-line pt-5">
            <p className="kicker">{stringValue(shell, "pathKicker")}</p>
            <h2 id="steps-title" className="text-xl font-extrabold">
              {stringValue(shell, "stepsTitle")}
            </h2>
            <ol className="mt-2 list-decimal space-y-2 pl-6">
              {p.steps.map((s) => (
                <li key={s.key}>
                  <strong>{s.links.some((link) => link.href.startsWith("/support/request")) ? "Find the right person when needed" : s.title}</strong>
                  {s.required ? <span className="label-pill ml-2">{stringValue(shell, "requiredLabel")}</span> : s.optional ? <span className="label-pill ml-2">{stringValue(shell, "optionalLabel")}</span> : null}
                  <span className="block text-sm">{s.links.some((link) => link.href.startsWith("/support/request"))
                    ? "If another perspective would help, use Find the right person to identify the person or area responsible. Staff consultation request forms are closed."
                    : s.guidance}</span>
                  {s.links.length ? (
                    <span className="block text-sm">
                      {s.links.map((l, i) => (
                        <span key={l.href}>
                          {i ? " · " : ""}
                          {(() => {
                            const action = contextualizeSupportAction(
                              { ...l, href: canonicalStaffHref(l.href) },
                              context,
                              intakeEnabled,
                            );
                            return <Link href={withWorkOrigin(action.href, origin)}>{action.label}</Link>;
                          })()}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
          <div className="border-t border-line pt-5">
            <p className="kicker">{stringValue(shell, "meaningKicker")}</p>
            <h2 className="text-xl font-extrabold">{stringValue(shell, "meaningTitle")}</h2>
            <p className="font-bold">{stringValue(shell, "needsWorkLabel")}:</p>
            <ul className="list-disc pl-6 text-sm">
              {p.antiPerformative.fake.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <p className="mt-2 font-bold">{stringValue(shell, "readyLabel")}:</p>
            <ul className="list-disc pl-6 text-sm">
              {p.antiPerformative.real.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            {p.privacy ? <p className="mt-3 text-sm text-muted">{stringValue(shell, "privacyLabel")}: {p.privacy}</p> : null}
            {p.hrWall ? <p className="mt-2 text-sm font-bold" style={{ color: "var(--red-strong)" }}>{stringValue(shell, "confidentialRouteNote")}</p> : null}
          </div>
        </section>

        <section className="mt-8" aria-labelledby="artifact-title">
          <p className="kicker">Published checklist</p>
          <h2 id="artifact-title" className="text-2xl font-extrabold">
            {p.artifactTitle}
          </h2>
          <p className="notice mt-2" role="note">
            <strong>Read it here, then download it to use. </strong>
            Keep your notes in your own working file.
          </p>
          <PathBrowse path={p} />
        </section>
        {readingsFor(p.id, 4).length ? <section className="mt-8" aria-labelledby="path-readings-title">
          <h2 id="path-readings-title" className="text-xl font-extrabold">Books that inform this practice</h2>
          <p className="mt-2">Reading notes from the program&apos;s collection, for the thinking behind these steps.</p>
          <ul className="mt-3 list-disc pl-6">{readingsFor(p.id, 4).map(item => <li key={item.id}><Link href={item.href}>{item.title}</Link>{item.why ? <span className="block text-sm">{item.why}</span> : null}</li>)}</ul>
        </section> : null}
        <details className="card mt-8"><summary className="font-semibold">Carry this preparation into practice</summary><p className="mt-3">Use the downloaded checklist to prepare your working notes. A draft does not authorize a change; confirm the applicable requirements and responsible decision before implementation. Keep identifying information out of practice notes.</p><p className="mt-3"><Link href={withWorkOrigin("/my-work/plan", origin)}>Prepare an action and review plan</Link> for a step within your responsibility. After an approach is used, <Link href={withWorkOrigin("/program/reflection", origin)}>record what happened and what remains uncertain</Link>.</p>{p.id === "gp-2" ? <p className="mt-3">Before recommending a policy change, <Link href={withWorkOrigin("/practice/requirements", origin)}>prepare a requirements crosswalk</Link> to identify source authority, affected work and unresolved questions for the person responsible.</p> : null}{p.id === "gp-3" ? <p className="mt-3">The optional report-back draft in the engagement checklist helps explain what was heard, what changed, what could not change and why. Return the appropriate summary to participants through an approved accessible channel.</p> : null}{p.id === "gp-4" ? <p className="mt-3">The optional expertise brief can help a workgroup describe the knowledge it needs, a proposed contribution and the review required before engaging someone. <Link href={withWorkOrigin("/support/right-person", origin)}>Find the person or area responsible</Link> for program requirements, procurement, professional advice or access support. No provider, qualification, permission or funding is established by completing the brief.</p> : null}</details>
      </div>
      </EditableSurfaceRegion>
    </EditableSurfaceRegion>
  );
}
