import Link from "next/link";
import { ResourceDownloads } from "@/components/resource-downloads";
import { notFound } from "next/navigation";
import { culturalMultidisciplinary } from "@/lib/content/cultural-multidisciplinary";
import { CULTURAL_INTELLIGENCE_PERSPECTIVE_SOURCES } from "@/lib/content/learn-page-copy";
import { culturalIntelligenceCollection } from "@/lib/content/cultural-intelligence-collection";
import { CULTURAL_INTELLIGENCE_SURFACE_ID, CULTURAL_INTELLIGENCE_VISIBLE_FIELDS, culturalIntelligenceVisibleText } from "@/lib/content/cultural-intelligence-hub";
import { culturalIntelligenceHubAvailable } from "@/lib/content/cultural-intelligence-publication";
import { stringValue } from "@/lib/content/staff-surface-registry";
import { requestedContentScope } from "@/lib/product/request-context";
import { CulturalIntelligenceExplainerDraft } from "@/components/cultural-intelligence-explainer-draft";
import { CulturalIntelligenceWorkJourney } from "@/components/cultural-intelligence-work-journey";
import { CulturalLeadershipStyles } from "@/components/cultural-leadership-styles";
import { CulturalLeadershipCurriculum } from "@/components/cultural-leadership-curriculum";
import { LEADERSHIP_PATHWAY_HREF } from "@/lib/content/leadership-styles-pathway";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import styles from "../learning-family.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  if (await culturalIntelligenceHubAvailable()) return { title: "Cultural Intelligence collection" };
  // A withdrawn or unavailable hub must not reveal the collection.
  return { title: "Learning and resources" };
}

export default async function CulturalIntelligencePage() {
  const scope = await requestedContentScope();
  const surface = await prepareEditableSurface(CULTURAL_INTELLIGENCE_SURFACE_ID, { scope }).catch(() => null);
  if (!surface || (!surface.available && !surface.canEdit)) notFound();
  // Owners keep the editing and withdrawal controls on a withdrawn hub; everyone else gets a real not found.
  if (!surface.available) return <EditableSurfaceRegion surface={surface} className={styles.page}>{null}</EditableSurfaceRegion>;
  const { communities, ownCulture, courseGroups, frameworks, leader, facilitation, resources, journeyResources, interculturalAvailable } = await culturalIntelligenceCollection();
  // Keep the stored publication schema intact, but retire the previous book-specific
  // editor fields and fall back to the new framing for legacy published wording.
  const displaySurface = { ...surface, definition: { ...surface.definition, fields: surface.definition.fields.filter(field => {
    if (!CULTURAL_INTELLIGENCE_VISIBLE_FIELDS.has(field.key)) return false;
    const current = stringValue(surface.values, field.key);
    return culturalIntelligenceVisibleText(field.key, current) === current;
  }) } };
  const text = (key: string) => culturalIntelligenceVisibleText(key, stringValue(surface.values, key));
  // Capability before culture-specific content, while every community guide stays openable.
  const orderedCourseGroups = [...courseGroups].sort((a, b) => Number(b.id === "capabilities") - Number(a.id === "capabilities"));
  return <EditableSurfaceRegion surface={displaySurface} className={styles.page}>
    <header className={styles.hero}><div className={styles.heroInner}>
      <p className={styles.eyebrow}>{text("eyebrow")}</p>
      <h1>{text("title")}</h1>
      <p className={styles.intro}>{text("intro")}</p>
    </div></header>
    <div className={`${styles.content} space-y-10`}>
      <nav aria-label="Collection sections" className="flex flex-wrap gap-5"><a href="#foundation">Foundation</a><a href="#start">Start from your work</a><a href="#frameworks">Frameworks</a><a href="#learn">Learn</a><a href="#explore">Explore</a><a href="#apply">Apply</a><a href="#leaders">Leaders</a></nav>
      <p className="max-w-4xl leading-7">{text("scopeLine")}</p>
      <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="learn-page" id="cultural-intelligence" noun="collection" scope={scope} /></details>
      <section id="foundation" aria-labelledby="foundation-title" className="max-w-4xl space-y-4">
        <h2 id="foundation-title" className="text-3xl font-semibold">{text("foundationTitle")}</h2>
        <p className="leading-7">{text("foundationBody")}</p>
        <h3 className="text-xl font-semibold">{text("messageTitle")}</h3>
        <p className="text-lg font-semibold leading-8">{text("centralMessage")}</p>
      </section>
      <section aria-labelledby="broader-practice-title" className="border-t border-line pt-8 max-w-4xl space-y-4">
        <h2 id="broader-practice-title" className="text-3xl font-semibold">{culturalMultidisciplinary.title}</h2>
        {culturalMultidisciplinary.introduction.map(paragraph => <p className="leading-7" key={paragraph}>{paragraph}</p>)}
        <h3 className="text-xl font-semibold">{culturalMultidisciplinary.progressionTitle}</h3>
        {culturalMultidisciplinary.progression.map(paragraph => <p className="leading-7" key={paragraph}>{paragraph}</p>)}
        <h3 className="text-xl font-semibold">{culturalMultidisciplinary.lensesTitle}</h3>
        <ul className="grid gap-4 md:grid-cols-2">
          {culturalMultidisciplinary.lenses.map(lens => <li className="rounded-xl border border-line p-4" key={lens.title}><h4 className="font-semibold">{lens.title}</h4><p>{lens.body}</p></li>)}
        </ul>
        <p className="leading-7">{culturalMultidisciplinary.closing}</p>
        <details className="rounded-xl border border-line p-5">
        <summary className="cursor-pointer font-semibold">Explore sources behind these perspectives</summary>
        <ul className="mt-4 space-y-2">
          {CULTURAL_INTELLIGENCE_PERSPECTIVE_SOURCES.map(source => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer" className="underline">{source.title}</a></li>)}
        </ul>
        </details>
      </section>
      <div id="start"><CulturalIntelligenceWorkJourney resources={journeyResources} /></div>
      {frameworks.length > 0 && <section id="frameworks" aria-labelledby="frameworks-title" className="border-t border-line pt-8">
        <h2 id="frameworks-title" className="text-3xl font-semibold">The frameworks this collection connects</h2>
        <p className="mt-4 max-w-4xl leading-7">Each one adds something the others do not. Each also carries its own assumptions about the self, independence and family, so ask whether it fits the people you are working with, and check with them.</p>
        <ul className="mt-6 grid gap-5 md:grid-cols-2">{frameworks.map(framework => <li key={framework.id} className="rounded-xl border border-line p-5">
          <h3 className="text-xl font-semibold">{framework.name}</h3>
          <p className="mt-1 text-sm">{framework.kind}</p>
          <p className="mt-3 leading-7">{framework.contributes}</p>
          <ul className="mt-3 space-y-1">{framework.links.map(link => <li key={link.href}><Link className="underline" href={link.href}>{link.title}</Link></li>)}</ul>
        </li>)}</ul>
      </section>}
      <section id="learn" aria-labelledby="learn-title" className="border-t border-line pt-8">
        <h2 id="learn-title" className="text-3xl font-semibold">Learn</h2>
        {interculturalAvailable && <>
          <p className="mt-4 max-w-4xl leading-7">Explore your own perspective and build skills for everyday interactions. The seven-part path includes optional video, captions, transcript, and individual practice.</p>
          <p className="mt-4"><Link className="font-semibold underline" href="/learn/intercultural/curriculum">Start the intercultural learning path</Link></p>
        </>}
        {orderedCourseGroups.map(group => <details key={group.id} className="mt-6 rounded-xl border border-line p-5"><summary className="cursor-pointer font-semibold">{group.title}</summary>
          <p className="mt-4 leading-7">{group.intro}</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">{group.courses.map(course => <li key={course.href}><Link className="underline" href={course.href}>{course.title}</Link></li>)}</ul>
        </details>)}
        {courseGroups.length === 0 && <p className="mt-4">No courses are available here right now.</p>}
        <section aria-labelledby="collection-explainers-title" className="mt-10">
          <h3 id="collection-explainers-title" className="text-xl font-semibold">Explore the collection</h3>
          {/* Rewritten scripts need newly verified media; older narration must not play. */}
          <CulturalIntelligenceExplainerDraft />
        </section>
      </section>
      <section id="explore" aria-labelledby="explore-title" className="border-t border-line pt-8">
        <h2 id="explore-title" className="text-3xl font-semibold">Explore</h2>
        {ownCulture.length > 0 && <>
          <h3 className="mt-4 text-xl font-semibold">Begin with your own culture</h3>
          <p className="mt-2 max-w-4xl leading-7">Everyone works from inside a culture, including people whose background is treated as the default.</p>
          <p className="mt-2 max-w-4xl leading-7">{text("exploreOwnCulture")}</p>
          <ul className="mt-3 space-y-2">{ownCulture.map(community => <li key={community.id}><Link className="underline" href={community.href}>{community.title}</Link></li>)}</ul>
          <h3 className="mt-6 text-xl font-semibold">Communities you serve</h3>
        </>}
        <p className="mt-4 max-w-4xl leading-7">Choose a community brief when it helps you understand context. You do not need to read every brief. Ask people directly what matters to them and what support works for them. Disability is part of every community, so look for it in each brief.</p>
        <p className="mt-3 max-w-4xl leading-7">The existing Tribal and Native community pages include guidance about Tribal authority and the appropriate relationships for this work. Follow that guidance and the applicable processes.</p>
        {communities.length ? <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{communities.map(community => <li key={community.id}><Link className="underline" href={community.href}>{community.title}</Link>{community.standingTribalDeference && <span> (we defer to the Office of Indian Affairs and the DHS offices that handle Tribal relations and consultation)</span>}</li>)}</ul> : <p className="mt-4">Community briefs are not available here right now.</p>}
      </section>
      <section id="apply" aria-labelledby="apply-title" className="border-t border-line pt-8">
        <h2 id="apply-title" className="text-3xl font-semibold">Apply</h2>
        <p className="mt-4 max-w-4xl leading-7">Think about an upcoming notice, meeting, hiring step or team decision. Ask what language, format, and support the person wants; check who can make the decision; and make a plan to follow up.</p>
        <p className="mt-3 max-w-4xl leading-7">{text("applyQuestions")}</p>
        <p className="mt-3 max-w-4xl leading-7">{text("applyRoutine")}</p>
        {interculturalAvailable && <p className="mt-4"><Link className="font-semibold underline" href="/learn/intercultural/curriculum">Practice a decision in the learning path</Link></p>}
        {resources.length > 0 && <><h3 className="mt-6 text-xl font-semibold">Related tools</h3><ul className="mt-3 space-y-2">{resources.map(resource => <li key={resource.href}><Link className="underline" href={resource.href}>{resource.title}</Link></li>)}</ul></>}
        {facilitation.length > 0 && <><h3 className="mt-6 text-xl font-semibold">Practice with other people</h3><p className="mt-2 max-w-4xl leading-7">Courses alone are not the work. These bring people together around a real decision.</p><ul className="mt-3 space-y-3">{facilitation.map(route => <li key={route.href}><Link className="underline" href={route.href}>{route.title}</Link><p className="mt-1">{route.use}</p></li>)}</ul></>}
      </section>
      <section id="leaders" aria-labelledby="leaders-title" className="border-t border-line pt-8">
        <h2 id="leaders-title" className="text-3xl font-semibold">For leaders</h2>
        <p className="mt-4 max-w-4xl leading-7"><Link className="font-semibold underline" href={LEADERSHIP_PATHWAY_HREF}>Explore the leadership styles pathway</Link>: sixteen approaches, how each one handles conflict and affects equity and inclusion, scenarios, a practice rubric and a capstone.</p>
        <CulturalLeadershipStyles />
        <CulturalLeadershipCurriculum />
        <p className="mt-4 max-w-4xl leading-7">Leaders begin with the same questions about their own culture, then ask them of the institution. What does this organization treat as normal? Who designed the default? Whose experience is missing, including disabled colleagues and people served, and people at the point where disability, language, race and income meet? Bring these to policy, program and resource decisions and, with equal weight, to workforce decisions and workplace culture.</p>
        {leader.courses.length > 0 && <ul className="mt-4 space-y-2">{leader.courses.map(course => <li key={course.href}><Link className="font-semibold underline" href={course.href}>{course.title}</Link></li>)}</ul>}
        {leader.groups.length > 0 && <div className="mt-6 grid gap-5 md:grid-cols-2">{leader.groups.map(group => <div key={group.title}><h3 className="text-xl font-semibold">{group.title}</h3><ul className="mt-2 space-y-2">{group.links.map(link => <li key={link.href}><Link className="underline" href={link.href}>{link.title}</Link></li>)}</ul></div>)}</div>}
        {leader.divisionRoute && <p className="mt-5"><Link className="underline" href="/one-dsd/leadership">Grow your equity leadership in DSD</Link></p>}
      </section>
    </div>
  </EditableSurfaceRegion>;
}
