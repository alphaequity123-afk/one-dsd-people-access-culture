import { notFound } from 'next/navigation';
import InterculturalCurriculum from '@/components/intercultural-curriculum';
import curriculum from '@/lib/content/intercultural-curriculum.json';
import { interculturalRequestData } from '@/lib/content/intercultural-curriculum-data';
import { prepareEditableSurface } from '@/lib/content/prepare-editable-surface';
import { requestedContentScope } from '@/lib/product/request-context';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function generateMetadata({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson } = await params;
  try {
    const surface = await prepareEditableSurface('learn.intercultural', { scope: await requestedContentScope(), includeOwner: false });
    if (surface.available) return { title: curriculum.modules.find(item => item.id === lesson)?.title ?? 'Intercultural learning' };
  } catch { /* No published lesson title should escape an unavailable parent. */ }
  return { title: 'Intercultural learning' };
}
export default async function Page({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson } = await params;
  const data = await interculturalRequestData(lesson);
  if (!data.curriculum.modules.some(item => item.id === lesson)) notFound();
  return <InterculturalCurriculum key={lesson} lessonId={lesson} {...data}/>;
}
