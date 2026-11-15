
import { SourceLink } from "@/components/app-link";
import { WaterFoundationFeature } from "@/components/water-foundation-feature";
import Link from "@/components/app-link";
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
import { Hub2Choices, Hub2More } from "@/components/hub2-choices";
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
      <WaterFoundationFeature />
      <p className="max-w-4xl leading-7">{text("scopeLine")}</p>
      <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="learn-page" id="cultural-intelligence" noun="collection" scope={scope} /></details>
      <Hub2Choices label="Collection sections" className="lg:grid-cols-4" choices={[
        { href: "#learn", title: "Learn", body: interculturalAvailable ? "Courses grouped by capability and community, a guided learning path and short explainers." : "Courses grouped by capability and community, and short explainers.", action: "Open Learn" },
        { href: "#explore", title: "Explore", body: "Begin with your own culture, then read about the communities you serve.", action: "Open Explore" },
        { href: "#apply", title: "Apply", body: "Bring the learning to a notice, meeting, hiring step or team decision.", action: "Open Apply" },
        { href: "#leaders", title: "For leaders", body: "Leadership approaches, a leadership curriculum and questions to ask of the organization.", action: "Open For leaders" },
      ]} />
      <div>
        <Hub2More id="learn" headingId="learn-title" title="Learn">
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
        </Hub2More>
        <Hub2More id="explore" headingId="explore-title" title="Explore">
          {ownCulture.length > 0 && <>
            <h3 className="mt-4 text-xl font-semibold">Begin with your own culture</h3>
            <p className="mt-2 max-w-4xl leading-7">{text("exploreOwnCulture")}</p>
            <ul className="mt-3 space-y-2">{ownCulture.map(community => <li key={community.id}><Link className="underline" href={community.href}>{community.title}</Link></li>)}</ul>
          </>}
          <h3 className="mt-6 text-xl font-semibold">Communities you serve</h3>
          {communities.length ? <>
            <p className="mt-2 max-w-4xl leading-7">Use a brief to prepare questions about what matters to people and what support works for them.</p>
            <p className="mt-3"><Link className="font-semibold underline" href="/minnesota-communities">Find a community brief</Link></p>
            {communities.some(community => community.standingTribalDeference) ? <p className="mt-3 max-w-4xl leading-7">For Tribal consultation, follow the applicable Tribal processes and contact the Office of Indian Affairs or the DHS office responsible for Tribal relations.</p> : null}
          </> : <p className="mt-2">Community briefs are unavailable right now.</p>}
          <h3 className="mt-6 text-xl font-semibold">Community Outreach and Engagement</h3>
          <p className="mt-2 max-w-4xl leading-7">Plan an engagement, find the organizations connected with the division, and see where to reach people. <Link className="font-semibold underline" href="/community-outreach">Open Community Outreach and Engagement</Link></p>
        </Hub2More>
        <Hub2More id="apply" headingId="apply-title" title="Apply">
          <p className="mt-4 max-w-4xl leading-7">Think about an upcoming notice, meeting, hiring step or team decision. Ask what language, format, and support the person wants; check who can make the decision; and make a plan to follow up.</p>
          <p className="mt-3 max-w-4xl leading-7">{text("applyQuestions")}</p>
          <p className="mt-3 max-w-4xl leading-7">{text("applyRoutine")}</p>
          {interculturalAvailable && <p className="mt-4"><Link className="font-semibold underline" href="/learn/intercultural/curriculum">Practice a decision in the learning path</Link></p>}
          {resources.length > 0 && <><h3 className="mt-6 text-xl font-semibold">Related tools</h3><ul className="mt-3 space-y-2">{resources.map(resource => <li key={resource.href}><Link className="underline" href={resource.href}>{resource.title}</Link></li>)}</ul></>}
          {facilitation.length > 0 && <><h3 className="mt-6 text-xl font-semibold">Practice with other people</h3><p className="mt-2 max-w-4xl leading-7">Use these resources to connect a group discussion with a decision in your work, including the evidence, perspectives and responsibilities that need consideration.</p><ul className="mt-3 space-y-3">{facilitation.map(route => <li key={route.href}><Link className="underline" href={route.href}>{route.title}</Link><p className="mt-1">{route.use}</p></li>)}</ul></>}
        </Hub2More>
        <Hub2More id="leaders" headingId="leaders-title" title="For leaders">
          <p className="mt-4 max-w-4xl leading-7"><Link className="font-semibold underline" href={LEADERSHIP_PATHWAY_HREF}>Explore the leadership styles pathway</Link>: sixteen approaches, how each one handles conflict and affects equity and inclusion, scenarios, a practice rubric and a capstone.</p>
          <CulturalLeadershipStyles />
          <CulturalLeadershipCurriculum />
          <p className="mt-4 max-w-4xl leading-7">Leaders begin with the same questions about their own culture, then ask them of the institution. What does this organization treat as normal? Who designed the default? Whose experience is missing, including disabled colleagues and people served, and people at the point where disability, language, race and income meet? Bring these to policy, program and resource decisions and, with equal weight, to workforce decisions and workplace culture.</p>
          {leader.courses.length > 0 && <ul className="mt-4 space-y-2">{leader.courses.map(course => <li key={course.href}><Link className="font-semibold underline" href={course.href}>{course.title}</Link></li>)}</ul>}
          {leader.groups.length > 0 && <div className="mt-6 grid gap-5 md:grid-cols-2">{leader.groups.map(group => <div key={group.title}><h3 className="text-xl font-semibold">{group.title}</h3><ul className="mt-2 space-y-2">{group.links.map(link => <li key={link.href}><Link className="underline" href={link.href}>{link.title}</Link></li>)}</ul></div>)}</div>}
          {leader.divisionRoute && <p className="mt-5"><Link className="underline" href="/one-dsd/leadership">Grow your equity leadership in DSD</Link></p>}
        </Hub2More>
      </div>
      <div>
        <p className="font-semibold text-[#183247]">Background and frameworks</p>
        <Hub2More id="foundation" headingId="foundation-title" title={text("foundationTitle")}>
          <div className="max-w-4xl space-y-4">
            <p className="leading-7">{text("foundationBody")}</p>
            <h3 className="text-xl font-semibold">{text("messageTitle")}</h3>
            <p className="text-lg font-semibold leading-8">{text("centralMessage")}</p>
          </div>
        </Hub2More>
        <Hub2More headingId="broader-practice-title" title={culturalMultidisciplinary.title}>
          <div className="max-w-4xl space-y-4">
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
              {CULTURAL_INTELLIGENCE_PERSPECTIVE_SOURCES.map(source => <li key={source.href}><SourceLink href={source.href} target="_blank" rel="noreferrer" className="underline">{source.title}</SourceLink></li>)}
            </ul>
            </details>
          </div>
        </Hub2More>
        <Hub2More id="start" title="Start from your work"><CulturalIntelligenceWorkJourney resources={journeyResources} /></Hub2More>
        {frameworks.length > 0 && <Hub2More id="frameworks" headingId="frameworks-title" title="The frameworks this collection connects">
          <p className="mt-4 max-w-4xl leading-7">Each one adds something the others do not. Each also carries its own assumptions about the self, independence and family, so ask whether it fits the people you are working with, and check with them.</p>
          <ul className="mt-6 grid gap-5 md:grid-cols-2">{frameworks.map(framework => <li key={framework.id} className="rounded-xl border border-line p-5">
            <h3 className="text-xl font-semibold">{framework.name}</h3>
            <p className="mt-1 text-sm">{framework.kind}</p>
            <p className="mt-3 leading-7">{framework.contributes}</p>
            <ul className="mt-3 space-y-1">{framework.links.map(link => <li key={link.href}><Link className="underline" href={link.href}>{link.title}</Link></li>)}</ul>
          </li>)}</ul>
        </Hub2More>}
      </div>
    </div>
  </EditableSurfaceRegion>;
}
