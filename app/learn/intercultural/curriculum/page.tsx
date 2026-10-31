import InterculturalCurriculum from '@/components/intercultural-curriculum';
import { interculturalRequestData } from '@/lib/content/intercultural-curriculum-data';
import { prepareEditableSurface } from '@/lib/content/prepare-editable-surface';
import { requestedContentScope } from '@/lib/product/request-context';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function generateMetadata() {
  try {
    const surface = await prepareEditableSurface('learn.intercultural', { scope: await requestedContentScope(), includeOwner: false });
    if (surface.available) return { title: 'Intercultural understanding in everyday work' };
  } catch { /* No published curriculum title should escape an unavailable parent. */ }
  return { title: 'Intercultural learning' };
}
export default async function Page() {
  const data = await interculturalRequestData();
  return <InterculturalCurriculum {...data}/>;
}
