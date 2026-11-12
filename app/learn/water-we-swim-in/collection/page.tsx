import type { Metadata } from "next";
import Link from "next/link";
import { JobAidActions } from "@/components/clas-curriculum/job-aid-actions";
import { CourseMediaJumpSlot, CourseMediaSlot } from "@/components/course-media-for-page";
import { prepareEditableSurface } from "@/components/editable-surface";
import { GeffenReadAloud } from "@/components/geffen-read-aloud";
import { ResourceCreationLink } from "@/components/resource-creation-link";
import { ResourceLearningAssistant } from "@/components/resource-learning-assistant";
import { WaterFigure, WaterLessonPodcast } from "@/components/water-curriculum";
import { ownerFromCookies } from "@/lib/auth/request";
import { publishedCommunityProfile } from "@/lib/content/community-profile";
import { getAvailableInterculturalCommunities } from "@/lib/content/intercultural-community-list";
import { waterLesson, waterModuleId } from "@/lib/content/water-curriculum";
import {
  WATER_COLLECTION_CASE, WATER_COLLECTION_HREF, WATER_COLLECTION_OUTCOMES, WATER_COLLECTION_PROMPTS,
  WATER_COLLECTION_STEPS, WATER_COLLECTION_TITLE,
} from "@/lib/content/water-learning-collection";
import { WATER_COURSE_HREF, WATER_ESSAY, WATER_MODULES, WATER_SUPPORT } from "@/lib/content/water-we-swim-in";
import { WATER_RESOURCE_COLLECTION_SOURCES } from "@/lib/learning/water-resource-collection";
import { requestedContentScope } from "@/lib/product/request-context";
import styles from "./collection.module.css";

export const metadata: Metadata = {
  title: WATER_COLLECTION_TITLE,
  description: "A self-paced collection connecting The Water We Swim In, two culture briefs and the Equity Analysis Toolkit through a public-service practice case.",
};

const workbook = [
  WATER_COLLECTION_TITLE, "", WATER_COLLECTION_CASE, "",
  "Use this workbook with the readings and recordings in the collection. Keep your work fictional or fully anonymized.",
  ...WATER_COLLECTION_STEPS.flatMap((step, index) => [
    "", `${index + 1}. ${step.title}`, step.caseUpdate, "",
    ...step.activities.flatMap((activity, task) => [`${task + 1}. ${activity}`, "My notes:", ""]),
    `Keep for the next step: ${step.output}`, `Check your work: ${step.check}`, "",
  ]),
].join("\n");

export default async function WaterCollectionPage() {
  const scope = await requestedContentScope();
  const [american, minnesota, toolkit, owner, communities] = await Promise.all([
    publishedCommunityProfile("american"),
    publishedCommunityProfile("minnesota"),
    prepareEditableSurface("equity-toolkit.home", { scope, includeOwner: false }).catch(() => ({ available: false })),
    ownerFromCookies(),
    getAvailableInterculturalCommunities(scope).catch(() => []),
  ]);
  const available = { water: true, american: Boolean(american), minnesota: Boolean(minnesota), toolkit: toolkit.available };
  const studyReady = Boolean(process.env.GEMINI_API_KEY?.trim()) && available.american && available.minnesota && available.toolkit;
  const picture = waterLesson("01")?.images.find(image => image.src.endsWith("/image-4.webp"));
  const otherBriefs = communities.filter(brief => brief.id !== "american" && brief.id !== "minnesota" && !brief.standingTribalDeference);
  const referralPages = communities.filter(brief => brief.standingTribalDeference);

  return <article className={styles.collection}>
    <header className={styles.hero}>
      <div>
        <p className={styles.back}><Link href={WATER_COURSE_HREF}>Back to The Water We Swim In course</Link></p>
        <h1>{WATER_COLLECTION_TITLE}</h1>
        <p className={styles.lede}>Everyday routines can be hard to see when they feel familiar. Explore how culture shapes those routines, then use what you learn to make one public service easier to use.</p>
        <p>Six self-paced steps. Set aside about 6 to 8 hours for the readings, recordings and practice. You can work through one step at a time.</p>
        <div className={styles.actions}>
          <a className="btn btn--primary" href="#step-1">Start with step 1</a>
          <CourseMediaJumpSlot label="Watch the curriculum overview" />
          {studyReady ? <a href="#resource-learning-assistant">Ask about this collection</a> : null}
          {otherBriefs.length || referralPages.length ? <a href="#collection-briefs">Browse the culture briefs</a> : null}
          {owner && studyReady ? <ResourceCreationLink resourcePath={WATER_COLLECTION_HREF} /> : null}
        </div>
      </div>
      {picture ? <WaterFigure image={picture} priority /> : null}
    </header>
    <CourseMediaSlot />

    <div className={styles.orientation}>
      <section aria-labelledby="collection-goals">
        <h2 id="collection-goals">What you’ll practice</h2>
        <ul>{WATER_COLLECTION_OUTCOMES.map(outcome => <li key={outcome}>{outcome}</li>)}</ul>
        <p>Keep one workbook as you go. The notes you make in each step will help you build a recommendation in the last one.</p>
        <JobAidActions text={workbook} fileName="the-water-we-swim-in-practice-workbook.txt" />
      </section>
      <section aria-labelledby="collection-sources">
        <h2 id="collection-sources">The readings and tools</h2>
        <ul>{WATER_RESOURCE_COLLECTION_SOURCES.filter(source => available[source.family]).map(source =>
          <li key={source.family}><Link href={source.resourcePath} prefetch={false}>{source.title}</Link></li>)}</ul>
        {!Object.values(available).every(Boolean) ? <p>One or more sources are unavailable right now. You can continue with the readings and activities listed below.</p> : null}
      </section>
    </div>

    <section className={styles.case} aria-labelledby="collection-case">
      <h2 id="collection-case">The North Crossing appointment notice</h2>
      <p>{WATER_COLLECTION_CASE}</p>
      <GeffenReadAloud text={WATER_COLLECTION_CASE} label="North Crossing appointment notice" />
    </section>

    {studyReady ? <ResourceLearningAssistant resourcePath={WATER_COLLECTION_HREF} prompts={WATER_COLLECTION_PROMPTS} /> : null}

    <nav className={styles.path} aria-label="Collection steps">
      <ol>{WATER_COLLECTION_STEPS.map((step, index) => <li key={step.title}>
        <a href={`#step-${index + 1}`}>{step.title}</a>
        <span>{step.minutes} minutes</span>
      </li>)}</ol>
    </nav>

    {WATER_COLLECTION_STEPS.map((step, index) => {
      const number = index + 1;
      const courseModule = WATER_MODULES[index];
      const moduleHref = `${WATER_COURSE_HREF}/${courseModule.slug}`;
      const lesson = waterLesson(waterModuleId(number));
      const readings = step.essay.flatMap(id => {
        const section = WATER_ESSAY.sections.find(item => item.id === id);
        return section ? [{ href: `${WATER_COURSE_HREF}/essay/${section.id}`, label: section.heading }] : [];
      });
      const briefs = [
        { id: "american", profile: american, label: "American Culture Brief" },
        { id: "minnesota", profile: minnesota, label: "Minnesota Culture Brief" },
      ].flatMap(({ id, profile, label }) => {
        const section = profile?.sections.find(item => item.id === step.briefChapter);
        return section ? [{ href: `/minnesota-communities/${id}/profile#profile-${section.id}`, label: `${label} · ${section.heading}` }] : [];
      });
      const voiceText = [step.title, step.idea, step.caseUpdate, ...step.activities, step.output, step.check].join("\n\n");

      return <section id={`step-${number}`} key={step.title} className={styles.step} aria-labelledby={`step-title-${number}`}>
        <header>
          <p className={styles.timing}>Step {number} of {WATER_COLLECTION_STEPS.length} · About {step.minutes} minutes</p>
          <h2 id={`step-title-${number}`}>{step.title}</h2>
          <p>{step.idea}</p>
        </header>
        <CourseMediaSlot itemId={`water-collection-bridge-0${number}`} />
        {lesson?.podcast ? <details className={styles.podcast}>
          <summary>Listen to the module {number} podcast</summary>
          <WaterLessonPodcast lesson={lesson} moduleTitle={courseModule.title} readingHref={moduleHref} />
        </details> : null}
        <div className={styles.stepBody}>
          <section aria-labelledby={`readings-${number}`}>
            <h3 id={`readings-${number}`}>Read and connect</h3>
            <p><Link href={moduleHref}>Original module · {courseModule.title}</Link></p>
            <ul>{[...readings, ...briefs, ...(available.toolkit ? step.tools ?? [] : [])].map(item =>
              <li key={item.href}><Link href={item.href} prefetch={false}>{item.label}</Link></li>)}</ul>
          </section>
          <section aria-labelledby={`apply-${number}`}>
            <h3 id={`apply-${number}`}>Try it at North Crossing</h3>
            <p>{step.caseUpdate}</p>
            <GeffenReadAloud text={voiceText} label={step.title} />
            <ol>{step.activities.map(activity => <li key={activity}>{activity}</li>)}</ol>
            <p className={styles.output}><strong>Keep in your workbook</strong> {step.output}</p>
            <p><strong>Check your work</strong> {step.check}</p>
          </section>
        </div>
      </section>;
    })}
    <section className={styles.case} aria-labelledby="collection-next">
      <h2 id="collection-next">Take one change into your work</h2>
      <p>Choose a routine where a clearer next step or an added access choice could help. Bring your decision brief to the person responsible for that routine and ask what a small, authorized trial could look like.</p>
      {available.toolkit ? <p><Link href="/learn/equity-toolkit/practice#toolkit-draft">Open the Equity Analysis Toolkit worksheet</Link></p> : null}
    </section>
    {otherBriefs.length || referralPages.length ? <section className={styles.briefs} id="collection-briefs" aria-labelledby="collection-briefs-heading">
      <h2 id="collection-briefs-heading">Explore the other culture briefs</h2>
      <p>Choose a brief that connects with a question from your work. Use what you learn to prepare a better question about your service. People can tell you which details matter to them.</p>
      {otherBriefs.length ? <details open>
        <summary>Browse {otherBriefs.length} published briefs</summary>
        <ul>{otherBriefs.map(brief => <li key={brief.id}><Link href={brief.href} prefetch={false}>{brief.title}</Link></li>)}</ul>
      </details> : null}
      {referralPages.length ? <>
        <h3>Tribal consultation and referral</h3>
        <p>These pages direct you to the Office of Indian Affairs and the DHS offices that handle Tribal relations and consultation.</p>
        <ul>{referralPages.map(page => <li key={page.id}><Link href={page.href} prefetch={false}>{page.title}</Link></li>)}</ul>
      </> : null}
      <p><Link href="/minnesota-communities">Search the Minnesota Communities directory</Link></p>
    </section> : null}
    <p className={styles.support}>{WATER_SUPPORT}</p>
  </article>;
}
