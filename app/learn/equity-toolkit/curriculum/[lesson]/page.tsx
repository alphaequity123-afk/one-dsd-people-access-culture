import { notFound } from 'next/navigation';
import { ResourceDownloads } from '@/components/resource-downloads';
import EquityDecisionsCurriculum from '@/components/equity-decisions-curriculum';
import data from '@/lib/content/equity-everyday-decisions.json';
import type { Curriculum } from '@/lib/content/equity-decisions-model';
import { prepareEditableSurface } from '@/lib/content/prepare-editable-surface';
import { requestedContentScope } from '@/lib/product/request-context';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
const curriculum = data as unknown as Curriculum;

async function toolkitAvailable(): Promise<boolean> {
  try {
    const scope = await requestedContentScope();
    if (scope !== 'dsd' && scope !== 'one-dhs') return false;
    const surface = await prepareEditableSurface('equity-toolkit.home', { scope, includeOwner: false });
    return surface.available === true;
  } catch {
    return false;
  }
}

export function generateStaticParams() {
  return curriculum.modules.map(module => ({ lesson: module.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ lesson: string }> }) {
  if (!(await toolkitAvailable())) return { title: 'Learning' };
  const { lesson } = await params;
  return { title: curriculum.modules.find(module => module.id === lesson)?.title || 'Learning' };
}

export default async function Page({ params }: { params: Promise<{ lesson: string }> }) {
  if (!(await toolkitAvailable())) notFound();
  const { lesson } = await params;
  if (!curriculum.modules.some(module => module.id === lesson)) notFound();
  const scope = await requestedContentScope();
  return <><div className="mx-auto max-w-[1120px] px-4 pt-6 sm:px-6 print:hidden"><details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this lesson</summary><ResourceDownloads kind="toolkit-lesson" id={lesson} noun="lesson" scope={scope} /></details></div><EquityDecisionsCurriculum key={lesson} lessonId={lesson}/></>;
}
