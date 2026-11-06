import { ResourceDownloads } from '@/components/resource-downloads';
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
  const scope = await requestedContentScope();
  return <><div className="mx-auto max-w-[1120px] px-4 pt-6 sm:px-6 print:hidden"><details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this curriculum</summary><ResourceDownloads kind="intercultural-curriculum" id="curriculum" noun="curriculum" scope={scope} /></details></div><InterculturalCurriculum {...data}/></>;
}
