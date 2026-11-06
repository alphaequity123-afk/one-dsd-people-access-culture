import { notFound } from 'next/navigation';
import { ResourceDownloads } from '@/components/resource-downloads';
import EquityDecisionsCurriculum from '@/components/equity-decisions-curriculum';
import { prepareEditableSurface } from '@/lib/content/prepare-editable-surface';
import { requestedContentScope } from '@/lib/product/request-context';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function generateMetadata() {
  return { title: await toolkitAvailable() ? 'Equity in everyday decisions' : 'Learning' };
}

export default async function Page() {
  if (!(await toolkitAvailable())) notFound();
  const scope = await requestedContentScope();
  return <><div className="mx-auto max-w-[1120px] px-4 pt-6 sm:px-6 print:hidden"><details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this curriculum</summary><ResourceDownloads kind="toolkit-curriculum" id="curriculum" noun="curriculum" scope={scope} /></details></div><EquityDecisionsCurriculum /></>;
}
