
import { SourceLink } from "@/components/app-link";
import Link from "@/components/app-link";
import { notFound } from 'next/navigation';
import { ResourceDownloads } from '@/components/resource-downloads';
import { JobAidSheet } from '@/components/clas-curriculum/job-aid';
import { JobAidActions } from '@/components/clas-curriculum/job-aid-actions';
import curriculum from '@/lib/content/clas-curriculum.json';
import { loadClasLessonPageData } from '@/lib/content/clas-curriculum-page-data';
import { jobAidText } from '@/lib/content/clas-curriculum-practice';
import '@/components/clas-curriculum.css';

const base = '/learn/clas/curriculum';

export function generateStaticParams() { return curriculum.modules.map(m => ({ lesson: m.id })); }
export async function generateMetadata({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson } = await params;
  const module = curriculum.modules.find(m => m.id === lesson);
  return { title: module ? `Job aid: ${module.title}` : 'CLAS job aid' };
}

/** One printable page per lesson, built from the content file; a short notice when the aid is not written yet. */
export default async function Page({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson } = await params;
  const index = curriculum.modules.findIndex(m => m.id === lesson);
  const module = curriculum.modules[index];
  if (!module) notFound();
  const aid = loadClasLessonPageData(lesson).practice?.jobAid ?? null;
  return (
    <div className="clas-study clas-study--job-aid">
      <nav aria-label="CLAS learning" className="clas-job-aid-nav"><Link prefetch={false} href="/learn/clas">National Culturally and Linguistically Appropriate Services Standards collection</Link><SourceLink href={base}>Curriculum overview</SourceLink><SourceLink href={`${base}/${module.id}`}>Part {index + 1}: {module.title}</SourceLink></nav>
      {aid
        ? <>
          <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this lesson and its job aid</summary><ResourceDownloads kind="clas-lesson" id={module.id} noun="lesson" /></details>
          <JobAidActions fileName={`CLAS-part-${module.id}-job-aid.txt`} text={jobAidText(module.title, aid)} />
          <JobAidSheet aid={aid} lessonTitle={module.title} part={index + 1} standards={module.standards} />
        </>
        : <section aria-labelledby="job-aid-missing"><h1 id="job-aid-missing">Job aid for Part {index + 1} is not available yet</h1><p>The one-page job aid for “{module.title}” has not been published. The lesson page has the full text, the practice decisions and your working note.</p><p><SourceLink href={`${base}/${module.id}`}>Open Part {index + 1}: {module.title}</SourceLink></p></section>}
    </div>
  );
}
