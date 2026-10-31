import { notFound } from 'next/navigation';
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
  return <EquityDecisionsCurriculum />;
}
