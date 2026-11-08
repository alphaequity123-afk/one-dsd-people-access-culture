import completedPodcasts from "@/lib/content/courses/completed-podcasts.json";
import { historicalIntroductionLink } from "@/lib/content/courses/historical-course-editorial";
import { GeffenCourseReadAloud } from "@/components/geffen-course-read-aloud";
import { LearningAudio } from "@/components/learning-audio";
import { isRetiredCulturalWorkshop } from '@/lib/program/retired-features';
import Image from "next/image";
import { RelatedReadings } from "@/components/related-readings";
import styles from "../course-design.module.css";
import { LearningJourneyLink } from "@/components/learning-journey-link";
import { TRAINING_CREDIT_NOTICE } from "@/lib/program/learning-credit";
import { progressionLabel, resourceProgressionLevel } from "@/lib/content/progression";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prepareEditableSurface, EditableSurfaceRegion } from "@/components/editable-surface";
import { CoursePackSchema } from "@/lib/content/courses/contract";
import { withCourseCover } from "@/lib/content/courses/cover-overrides";
import { courseHref, courseLink, courseSummary } from "@/lib/content/courses/published";
import { getEditableSurfaceDefinition } from "@/lib/content/staff-surface-registry";
import { requestedContentScope } from "@/lib/product/request-context";
import { CourseResume } from "@/components/course-resume";
import { ResourceShare } from "@/components/resource-tools";
import { ResourceDownloads } from "@/components/resource-downloads";
import type { Metadata } from "next";
import "../courses.css";
export const dynamic="force-dynamic";
/** A shared course link previews with the course's own title and summary. */
export async function generateMetadata({params}:{params:Promise<{courseId:string}>}):Promise<Metadata> {
  const {courseId}=await params;
  if(!getEditableSurfaceDefinition(`course.${courseId}`))return {};
  const surface=await prepareEditableSurface(`course.${courseId}`,{scope:await requestedContentScope(),includeOwner:false});
  if(!surface.available)return {};
  const pack=CoursePackSchema.parse(surface.values.pack);
  return {title:pack.course.title,description:courseSummary(pack)};
}
export default async function CoursePage({params}:{params:Promise<{courseId:string}>}) {
  const {courseId}=await params;
  if(!getEditableSurfaceDefinition(`course.${courseId}`))notFound();
  const scope=await requestedContentScope();
  const surface=await prepareEditableSurface(`course.${courseId}`,{scope});
  if(!surface.available)notFound();
  const pack=withCourseCover(CoursePackSchema.parse(surface.values.pack));const podcast=(completedPodcasts as Record<string,{src:string;transcript:string;seconds:number}>)[pack.course.id];const course=podcast?{...pack.course,introAudio:podcast.src,introTranscript:podcast.transcript}:pack.course;const introductionLink=historicalIntroductionLink(course.id);if(isRetiredCulturalWorkshop(course))redirect('/courses/cv-understanding-your-lens');
  return <div className={`course-page ${styles.page} ${styles.courseLanding}`}><Link className={styles.breadcrumb} href="/learn">← Learn</Link><EditableSurfaceRegion surface={surface}>
    <header className={styles.hero}><div><p className={styles.eyebrow}>{course.seriesLabel}{resourceProgressionLevel(`course-${course.id}`) ? <> · <Link href={`/learn/paths#level-${resourceProgressionLevel(`course-${course.id}`)}`}>{progressionLabel(resourceProgressionLevel(`course-${course.id}`)!)}</Link></> : null}</p><h1>{course.title}</h1><p className={styles.description}>{courseSummary(pack)}</p><p className={styles.duration}>{course.duration ? <>{course.duration} · </> : null}{course.lessons.length} lessons · Voluntary learning</p><CourseResume courseId={course.id} lessons={course.lessons.map(({id,title})=>({id,title}))}/>{introductionLink?<p><Link href={introductionLink.href}>{introductionLink.label}</Link></p>:null}{course.introAudio?<p><a href="#course-audio">{(!!podcast||/^(ei-|cv-)/.test(course.id))?"Listen to the podcast":"Listen to the introduction"}</a></p>:null}</div><div className={styles.cover}><Image src={course.coverImage} alt={course.coverAlt} fill sizes="(max-width: 700px) 90vw, 480px" style={{objectFit:"contain"}} unoptimized /></div></header>
    {/^(ei-|cv-)/.test(course.id) ? <p><Link href="/learn/emotions-and-values">Explore all four courses in Emotions, Values, and Everyday Practice</Link></p> : null}
    {/^div-[fia]/.test(course.id) ? <p><Link href="/learn/diversity">All diversity courses: Foundation, Intermediate, and Advanced</Link></p> : null}
    {course.introAudio?<section id="course-audio" className={styles.introduction} aria-labelledby="course-audio-title"><h2 id="course-audio-title">{(!!podcast||/^(ei-|cv-)/.test(course.id))?"Listen to the podcast":"Listen to the introduction"}</h2><LearningAudio src={course.introAudio} title={course.title} />{course.introTranscript?<details><summary>{(!!podcast||/^(ei-|cv-)/.test(course.id))?"Read the conversation":"Read the introduction"}</summary>{course.introTranscript.split(/\n\n/).map((paragraph,i)=><p key={i}>{paragraph}</p>)}</details>:null}</section>:course.introTranscript?<details className={styles.introduction}><summary>{(!!podcast||/^(ei-|cv-)/.test(course.id))?"Read the conversation":"Read the introduction"}</summary>{course.introTranscript.split(/\n\n/).map((paragraph,i)=><p key={i}>{paragraph}</p>)}</details>:null}
    {course.learning ? <section id="outcomes" className={styles.outcomes} aria-labelledby="course-outcomes-title">
      <h2 id="course-outcomes-title">Put this learning to use</h2>
      <p className={styles.appliedNextStep}>{course.learning.appliedNextStep}</p>
      <div className={styles.outcomeBody}>
        <div><h3>What you’ll be able to do</h3><ul>{course.learning.objectives.map((item,i)=><li key={i}>{item}</li>)}</ul></div>
        <div><h3>What you’ll practice and prepare</h3><ul>{course.learning.evidence.map((item,i)=><li key={i}>{item}</li>)}</ul></div>
      </div>
    </section> : null}
    {course.scope && /^sm-/.test(course.id) ? <div className={styles.credit} data-course-scope={course.id}><p>{course.scope}</p></div> : null}
    <section id="lessons"><h2>Course outline</h2><ol className={styles.lessons}>{course.lessons.map((lesson,i)=><li key={lesson.id}><span className={styles.lessonNumber} aria-hidden="true">{String(i+1).padStart(2,"0")}</span><div><h3><Link href={courseHref(course.id,lesson.id)}>{lesson.title}</Link></h3><p>{lesson.summary}</p></div>{lesson.minutes > 0 ? <span className={styles.lessonTime}>{lesson.minutes} minutes</span> : null}</li>)}</ol></section>
    <details className={styles.supporting}><summary>Download or share this course</summary><ResourceDownloads kind="course" id={course.id} noun="course" scope={scope} share={false} /><ResourceShare title={course.title} href={`/share/courses/${encodeURIComponent(course.id)}`} noun="course" /></details>
    <details id="job-aid" className={styles.jobAid}><summary><h2>{pack.jobAid.title}</h2><span>{pack.jobAid.subtitle}</span></summary><div className={styles.jobAidBody}><GeffenCourseReadAloud pack={pack} />{pack.jobAid.quote?<blockquote>{pack.jobAid.quote}</blockquote>:null}{pack.jobAid.use?<><p>{pack.jobAid.use.purpose}</p><ul>{pack.jobAid.use.remember.map((item,i)=><li key={i}>{item}</li>)}</ul><p>{pack.jobAid.use.doNext}</p></>:null}<div className={styles.jobSections}>{pack.jobAid.sections.map((section,i)=><div key={i}><h3>{section.heading}</h3><ul>{section.items.map((item,n)=><li key={n}>{item}</li>)}</ul></div>)}</div></div></details>
    <RelatedReadings courseId={course.id} collapsed />
    <LearningJourneyLink scope={scope} resourceId={"course-"+course.id} />
    <p className={styles.credit}>{TRAINING_CREDIT_NOTICE}</p>
    <details id="sources" className={`${styles.sources} course-more-item`}><summary>Sources and further reading</summary><ul>{pack.sources.map((source,i)=><li id={`source-${i+1}`} key={i}>{courseLink(source.href)?<a href={courseLink(source.href)}>{source.title}</a>:<span>{source.title}</span>}<p>{source.note}</p></li>)}</ul><p><Link href="/learn/sources">All research and sources across the program</Link></p></details>
  </EditableSurfaceRegion></div>;
}
