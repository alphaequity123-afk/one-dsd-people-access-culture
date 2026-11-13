
import { SourceLink } from "@/components/app-link";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/app-link";
import { JobAidActions } from "@/components/clas-curriculum/job-aid-actions";
import { CourseMediaJumpSlot, CourseMediaSlot } from "@/components/course-media-for-page";
import { prepareEditableSurface } from "@/components/editable-surface";
import { GeffenReadAloud } from "@/components/geffen-read-aloud";
import { PracticeVideo } from "@/components/practice-video";
import { ResourceCreationLink } from "@/components/resource-creation-link";
import { ResourceLearningAssistant } from "@/components/resource-learning-assistant";
import { WaterLessonPodcast } from "@/components/water-curriculum";
import { ownerFromCookies } from "@/lib/auth/request";
import { publishedCommunityProfile } from "@/lib/content/community-profile";
import { getGeffenPassageRecordings } from "@/lib/content/geffen-volume";
import { getAvailableInterculturalCommunities } from "@/lib/content/intercultural-community-list";
import { waterLesson, waterModuleId } from "@/lib/content/water-curriculum";
import {
  WATER_COLLECTION_CASE, WATER_COLLECTION_HREF, WATER_COLLECTION_OUTCOMES, WATER_COLLECTION_PROMPTS,
  WATER_COLLECTION_READ_ALOUD, WATER_COLLECTION_READ_ALOUD_KEY, WATER_COLLECTION_STEPS, WATER_COLLECTION_TITLE,
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

export default async function WaterCollectionPage({ searchParams }: { searchParams?: Promise<{ step?: string }> }) {
  const stepParam = (await searchParams)?.step;
  const focusedStep = typeof stepParam === "string" && /^[1-6]$/.test(stepParam) ? Number(stepParam) : null;
  const scope = await requestedContentScope();
  const [american, minnesota, toolkit, owner, communities, recordings] = await Promise.all([
    publishedCommunityProfile("american"),
    publishedCommunityProfile("minnesota"),
    prepareEditableSurface("equity-toolkit.home", { scope, includeOwner: false }).catch(() => ({ available: false })),
    ownerFromCookies(),
    getAvailableInterculturalCommunities(scope).catch(() => []),
    getGeffenPassageRecordings(WATER_COLLECTION_READ_ALOUD_KEY, WATER_COLLECTION_READ_ALOUD),
  ]);
  const available = { water: true, american: Boolean(american), minnesota: Boolean(minnesota), toolkit: toolkit.available };
  const studyReady = Boolean(process.env.GEMINI_API_KEY?.trim()) && available.american && available.minnesota && available.toolkit;
  const otherBriefs = communities.filter(brief => brief.id !== "american" && brief.id !== "minnesota" && !brief.standingTribalDeference);
  const referralPages = communities.filter(brief => brief.standingTribalDeference);
  const [notice, ...stepReadAloud] = WATER_COLLECTION_READ_ALOUD;

  return <article className={styles.collection}>
    {focusedStep ? <p className={styles.back}><Link href={WATER_COLLECTION_HREF}>Back to The Water We Swim In</Link></p> : <>
    <header className={styles.hero}>
      <div>
        <p className={styles.back}><Link href={WATER_COURSE_HREF}>Back to the course</Link></p>
        <h1>{WATER_COLLECTION_TITLE}</h1>
        <p className={styles.lede}>Explore how culture shapes everyday work and affects access to services.</p>
        <div className={styles.actions}>
          <Link className="btn btn--primary" href={`${WATER_COLLECTION_HREF}?step=1`}>Start with step 1</Link>
          <CourseMediaJumpSlot label="Watch" />
          {otherBriefs.length || referralPages.length ? <SourceLink href="#collection-briefs">Culture briefs</SourceLink> : null}
          {owner && studyReady ? <ResourceCreationLink resourcePath={WATER_COLLECTION_HREF} /> : null}
        </div>
      </div>
      <Image className={styles.pilotPhoto} src="/images/pilot-home/water-we-swim-in.jpg"
        alt="Two staff members meet with a family around a table in a bright room." width={1000} height={667}
        sizes="(min-width: 1080px) 1040px, 100vw" preload />
    </header>
    <CourseMediaSlot />

    <nav className={styles.path} aria-label="Collection steps">
      <h2>Six steps, in order</h2>
      <ol>{WATER_COLLECTION_STEPS.map((step, index) => <li key={step.title}>
        <Link href={`${WATER_COLLECTION_HREF}?step=${index + 1}`}>{step.title}</Link>
        <span>{step.minutes} minutes</span>
      </li>)}</ol>
    </nav>

    <div className={styles.orientation}>
      <section aria-labelledby="collection-goals">
        <h2 id="collection-goals">What you’ll practice</h2>
        <ul>{WATER_COLLECTION_OUTCOMES.map(outcome => <li key={outcome}>{outcome}</li>)}</ul>
        <JobAidActions text={workbook} fileName="the-water-we-swim-in-practice-workbook.txt" downloadLabel="Download workbook" />
      </section>
      <section aria-labelledby="collection-sources">
        <h2 id="collection-sources">Readings and tools</h2>
        <ul>{WATER_RESOURCE_COLLECTION_SOURCES.filter(source => available[source.family]).map(source =>
          <li key={source.family}><Link href={source.resourcePath} prefetch={false}>{source.title}</Link></li>)}</ul>
        {!Object.values(available).every(Boolean) ? <p>One or more sources are unavailable right now. You can continue with the readings and activities listed below.</p> : null}
      </section>
    </div>

    <section className={styles.case} aria-labelledby="collection-case">
      <h2 id="collection-case">The North Crossing appointment notice</h2>
      <p>{WATER_COLLECTION_CASE}</p>
      <GeffenReadAloud text={notice.text} recordingSrc={recordings.get(notice.id)} label="North Crossing appointment notice" />
    </section>

    {studyReady ? <details className={styles.disclosure}>
      <summary>Ask about the readings</summary>
      <ResourceLearningAssistant resourcePath={WATER_COLLECTION_HREF} prompts={WATER_COLLECTION_PROMPTS} embedded />
    </details> : null}
    </>}

    <details className={styles.disclosure} open={Boolean(focusedStep)}>
    <summary>Read or review the collection steps</summary>
    {WATER_COLLECTION_STEPS.map((step, index) => {
      const number = index + 1;
      if (focusedStep && number !== focusedStep) return null;
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
      const passage = stepReadAloud[index];

      return <section id={`step-${number}`} key={step.title} className={styles.step} aria-labelledby={`step-title-${number}`}>
        <header>
          <p className={styles.timing}>Step {number}</p>
          {focusedStep ? <h1 id={`step-title-${number}`}>{step.title}</h1> : <h2 id={`step-title-${number}`}>{step.title}</h2>}
        </header>
        <CourseMediaSlot itemId={`water-collection-bridge-0${number}`} />
        <details className={styles.disclosure} open={focusedStep === number}>
          <summary>Read and practice</summary>
          <p className={styles.stepIdea}>{step.idea}</p>
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
              {number === 1 && <PracticeVideo clip="north-crossing" />}
              <GeffenReadAloud text={passage.text} recordingSrc={recordings.get(passage.id)} label={step.title} />
              <ol>{step.activities.map(activity => <li key={activity}>{activity}</li>)}</ol>
              <p className={styles.output}><strong>Keep in your workbook</strong> {step.output}</p>
              <p><strong>Check your work</strong> {step.check}</p>
            </section>
          </div>
          {lesson?.podcast ? <details className={styles.podcast}>
            <summary>Module podcast</summary>
            <WaterLessonPodcast lesson={lesson} moduleTitle={courseModule.title} readingHref={moduleHref} />
          </details> : null}
        </details>
        {focusedStep ? <nav className={styles.actions} aria-label="Collection step navigation">
          {number > 1 ? <Link href={`${WATER_COLLECTION_HREF}?step=${number - 1}`}>Previous step</Link> : null}
          {number < WATER_COLLECTION_STEPS.length ? <Link href={`${WATER_COLLECTION_HREF}?step=${number + 1}`}>Next step</Link> : <Link href={`${WATER_COLLECTION_HREF}#collection-next`}>Take one change into your work</Link>}
        </nav> : null}
      </section>;
    })}
    </details>
    {!focusedStep ? <><section className={styles.case} aria-labelledby="collection-next">
      <h2 id="collection-next">Take one change into your work</h2>
      <p>Share your decision brief with the person responsible for the routine. Ask what a small trial could look like.</p>
      {available.toolkit ? <p><Link href="/learn/equity-toolkit/practice#toolkit-draft">Open the Equity Analysis Toolkit worksheet</Link></p> : null}
    </section>
    {otherBriefs.length || referralPages.length ? <section className={styles.briefs} id="collection-briefs" aria-labelledby="collection-briefs-heading">
      <h2 id="collection-briefs-heading">Culture briefs</h2>
      {otherBriefs.length ? <details>
        <summary>Browse briefs</summary>
        <ul>{otherBriefs.map(brief => <li key={brief.id}><Link href={brief.href} prefetch={false}>{brief.title}</Link></li>)}</ul>
      </details> : null}
      {referralPages.length ? <details>
        <summary>Tribal consultation and referral</summary>
        <p>Find the offices responsible for Tribal relations and consultation.</p>
        <ul>{referralPages.map(page => <li key={page.id}><Link href={page.href} prefetch={false}>{page.title}</Link></li>)}</ul>
      </details> : null}
      <p><Link href="/minnesota-communities">Search the Minnesota Communities directory</Link></p>
    </section> : null}
    <p className={styles.support}>{WATER_SUPPORT}</p>
    </> : null}
  </article>;
}
