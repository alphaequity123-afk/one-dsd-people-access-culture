import type { Metadata } from "next";
import { WaterFoundationFeature } from "@/components/water-foundation-feature";
import { culturalIntelligenceHubAvailable } from "@/lib/content/cultural-intelligence-publication";
import Link from "@/components/app-link";
import { WATER_COURSE_HREF, WATER_COURSE_TITLE, WATER_MODULES, WATER_SUPPORT } from "@/lib/content/water-we-swim-in";
import { WATER_RESOURCE_COLLECTION_PATH } from "@/lib/learning/water-resource-collection";
import "@/components/community-editorial.css";
import "@/components/community-research-sections.css";
import { ResourceDownloads } from "@/components/resource-downloads";
import { heroOf, WaterCompanionPodcast, WaterCoursePath, WaterFigure } from "@/components/water-curriculum";
import { waterCompanion, waterLesson, waterModuleId } from "@/lib/content/water-curriculum";
import { WaterLearningAssistant } from "@/components/water-learning-assistant";
import "@/components/water-curriculum.css";

export const metadata: Metadata = { title: WATER_COURSE_TITLE };

export default async function WaterCoursePage() {
  const foundationAvailable = await culturalIntelligenceHubAvailable();
  const companion = waterCompanion();
  const closingPhoto = companion?.podcast ? companion.images.find(img => img.slot === "chapter") : undefined;
  return <div className="community-editorial"><div className="community-index-layout community-research">
    <p className="community-eyebrow"><Link href="/learn">Learn</Link></p>
    <h1>{WATER_COURSE_TITLE}</h1>
    <p className="community-opening"><Link href={WATER_RESOURCE_COLLECTION_PATH}>Open the collection</Link> to connect the course with the American and Minnesota Culture briefs and practice with the Equity Analysis Toolkit.</p>
    {foundationAvailable && <WaterFoundationFeature />}
    <WaterCompanionPodcast companion={companion} />
    <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this course</summary><ResourceDownloads kind="water-we-swim-in" id="home" noun="course" /></details>
    <p className="community-opening">A voluntary course on Minnesota&apos;s mainstream culture: its real strengths, its blind spots, and how it shapes our work with Minnesotans of other cultures and with disabled people and their families.</p>
    <p>There are six modules of about 20 minutes each. Each has a short podcast conversation, practice decisions and a one-page job aid. You can take them in any order. The course activities are ungraded.</p>
    <WaterLearningAssistant />
    <WaterCoursePath hrefFor={n => `${WATER_COURSE_HREF}/${WATER_MODULES.find(m => m.number === n)?.slug ?? ""}`} />
    <h2>Modules</h2>
    <ol className="water-module-grid">{WATER_MODULES.map(module => {
      const lesson = waterLesson(waterModuleId(module.number));
      const hero = heroOf(lesson);
      return <li key={module.slug}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static 4K WebP, sized by CSS */}
        {hero && <img src={hero.src} alt="" width={hero.width} height={hero.height} loading="lazy" decoding="async" />}
        <div className="water-card-body">
          <h3><Link href={`${WATER_COURSE_HREF}/${module.slug}`}>Module {module.number}: {module.title}</Link></h3>
          <p>{module.goal}</p>
          <p>About {module.minutes} minutes{lesson?.podcast ? `, with a ${Math.max(1, Math.round(lesson.podcast.durationSeconds / 60))}-minute podcast` : ""}.</p>
        </div>
      </li>;
    })}</ol>
    {closingPhoto && <WaterFigure image={closingPhoto} />}
    <h2>Go further</h2>
    <p><Link href={`${WATER_COURSE_HREF}/essay`}>Read the full essay</Link>, with every source the course draws on.</p>
    <p>{WATER_SUPPORT}</p>
  </div></div>;
}
