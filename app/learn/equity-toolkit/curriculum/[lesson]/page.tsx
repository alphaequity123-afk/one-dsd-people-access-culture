import { notFound } from 'next/navigation';
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
  return <EquityDecisionsCurriculum key={lesson} lessonId={lesson}/>;
}
