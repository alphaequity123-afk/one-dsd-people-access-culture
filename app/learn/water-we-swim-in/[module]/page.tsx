import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WaterModuleBody } from "@/components/cl-water";
import { WATER_COURSE_HREF, WATER_COURSE_TITLE, WATER_MODULES, WATER_SUPPORT } from "@/lib/content/water-we-swim-in";
import "@/components/community-editorial.css";
import "@/components/community-research-sections.css";
import { ResourceDownloads } from "@/components/resource-downloads";
import { WaterFigure, WaterLessonOpening, WaterLessonPodcast, WaterLessonPractice, chapterImages, heroOf } from "@/components/water-curriculum";
import { CourseMediaSlot } from "@/components/course-media-for-page";
import { waterLesson, waterModuleId, waterPractice, waterRecall } from "@/lib/content/water-curriculum";
import { WaterLearningAssistant } from "@/components/water-learning-assistant";

export async function generateMetadata({ params }: { params: Promise<{ module: string }> }): Promise<Metadata> {
  const { module: slug } = await params;
  const found = WATER_MODULES.find(item => item.slug === slug);
  return { title: found ? `${found.title} (${WATER_COURSE_TITLE})` : WATER_COURSE_TITLE };
}

export default async function WaterModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module: slug } = await params;
  const index = WATER_MODULES.findIndex(item => item.slug === slug);
  if (index < 0) notFound();
  const current = WATER_MODULES[index];
  const previous = WATER_MODULES[index - 1];
  const next = WATER_MODULES[index + 1];
  const id = waterModuleId(current.number);
  const lesson = waterLesson(id);
  const practice = waterPractice(id);
  const hero = heroOf(lesson);
  return <div className="community-editorial"><div className="community-index-layout community-research">
    <p className="community-eyebrow"><Link href={WATER_COURSE_HREF}>{WATER_COURSE_TITLE}</Link>: module {current.number} of {WATER_MODULES.length}</p>
    <h1 id="top">{current.title}</h1>
    {/* With a podcast, it sits right under the title and goal; the photograph follows it. */}
    {lesson?.podcast ? <>
      <p className="community-opening">{current.goal}</p>
      <WaterLessonPodcast lesson={lesson} moduleTitle={current.title} />
      <CourseMediaSlot />
      {hero && <WaterFigure image={hero} priority />}
    </> : <>
      {hero && <WaterFigure image={hero} priority />}
      <p className="community-opening">{current.goal}</p>
      <CourseMediaSlot />
    </>}
    <WaterLessonOpening practice={practice} recall={waterRecall(id)} previousTitle={previous?.title} previousNumber={previous?.number} />
    <p><a href="#water-learning-assistant">Study this module with the Gemini learning assistant</a></p>
    <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this module</summary><ResourceDownloads kind="water-we-swim-in" id={current.slug} noun="module" /></details>
    <WaterModuleBody markdown={current.body} notesKey={`water-we-swim-in-notes-${current.number}`} images={chapterImages(lesson)} />
    <WaterLessonPractice practice={practice} moduleTitle={current.title} moduleNumber={current.number} />
    <WaterLearningAssistant unit={current.slug} />
    <p>{WATER_SUPPORT}</p>
    <nav className="course-next" aria-label="Course modules">
      {previous ? <Link href={`${WATER_COURSE_HREF}/${previous.slug}`}>Previous: {previous.title}</Link> : <Link href={WATER_COURSE_HREF}>Course overview</Link>}
      {next ? <Link href={`${WATER_COURSE_HREF}/${next.slug}`}>Next: {next.title}</Link> : <Link href={`${WATER_COURSE_HREF}/essay`}>Read the full essay</Link>}
    </nav>
  </div></div>;
}
