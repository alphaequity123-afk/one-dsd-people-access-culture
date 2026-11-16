import type { Metadata } from 'next';
import Link from "@/components/app-link";
import { notFound } from 'next/navigation';
import { PageIntro } from '@/components/ui';
import { PageContents } from '@/components/page-contents';
import { WorkOriginLinks } from '@/components/work-origin-links';
import { MeasurementWorksheet } from '@/components/measurement-worksheet';
import { ResourceDownloads } from '@/components/resource-downloads';
import { EditableSurfaceRegion, prepareEditableSurface } from '@/components/editable-surface';
import { loadStaffContentSnapshot } from '@/lib/content/staff-publications';
import { MEASUREMENT_RESOURCE_ID, measurementText } from '@/lib/content/measurement-practice';
import { requestedContentScope } from '@/lib/product/request-context';
import { normalizeWorkOrigin, withWorkOrigin, type WorkOriginInput } from '@/lib/product/work-origin';

export const metadata: Metadata = { title: 'Evaluation plan' };

export default async function MeasurementPage({ searchParams }: { searchParams?: Promise<WorkOriginInput> }) {
  const scope = await requestedContentScope();
  const origin = normalizeWorkOrigin(await searchParams ?? {}, 'measurement');
  const [surface, parent, snapshot] = await Promise.all([
    prepareEditableSurface('practice.measurement', { scope }),
    prepareEditableSurface('practice.page', { scope, includeOwner: false }),
    loadStaffContentSnapshot({ scope }),
  ]);
  const source = snapshot.items.find(item => item.id === MEASUREMENT_RESOURCE_ID);
  if (!source || !surface.available || !parent.available) notFound();
  const href = withWorkOrigin('/library/' + source.id, origin);
  return <EditableSurfaceRegion surface={surface}>
    <PageIntro title={measurementText(surface.values, 'title')} lede={measurementText(surface.values, 'intro')} />
    <div className="wrap" style={{ paddingBlock: "2rem 4rem" }}>
      <PageContents items={[
        { href: '#measurement-example', label: 'Explore an example' },
        { href: '#measurement-notes-title', label: 'Prepare your plan' },
        { href: '#measurement-reference', label: 'Reference and downloads' },
      ]}>
        <WorkOriginLinks origin={origin} />
        <div id="measurement-example"><MeasurementWorksheet copy={surface.values} source={{ title: source.title, href }} /></div>
        <section id="measurement-reference" className="space-y-4 border-t border-line pt-6">
          <h2 className="text-xl font-semibold">Reference and downloads</h2>
          <p><Link href={href}>{measurementText(surface.values, 'sourceLabel')}: {source.title}</Link></p>
          <details className="print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold">Download this evaluation plan</summary><ResourceDownloads kind="measurement" id="worksheet" noun="evaluation plan" scope={scope} /></details>
        </section>
      </PageContents>
    </div>
  </EditableSurfaceRegion>;
}
