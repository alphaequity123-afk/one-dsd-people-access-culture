import Link from 'next/link';
import { PageIntro } from '@/components/ui';
import { EngagementResourceLinks } from '@/components/engagement-resource-links';
export const metadata={title:'Community engagement and cultural access resources'};
export default function Page(){return <>
  <PageIntro title="Community engagement and cultural access resources" lede="Move from understanding the approach to planning participation, checking access, and following through." />
  <div className="wrap space-y-8 py-8">
    <section className="space-y-4"><h2 className="text-2xl font-semibold">Choose a starting point</h2><ol className="list-decimal space-y-3 pl-6">
      <li><strong>Orient your team.</strong> Use the ADSA presentation to discuss when engagement is needed and what people can influence.</li>
      <li><strong>Build the plan.</strong> Read the ADSA guide for relationships, responsibilities, participation, accommodations, outreach, and reporting.</li>
      <li><strong>Check readiness.</strong> Use the ADSA checklist to identify missing resources, responsibilities, and arrangements before engagement begins.</li>
      <li><strong>Strengthen cultural and language access.</strong> Use the CLAS checklist and action worksheet to choose three practices and plan their implementation.</li>
    </ol></section>
    <EngagementResourceLinks />
    <section className="space-y-3"><h2 className="text-2xl font-semibold">Put the resources to work</h2><ul className="list-disc space-y-3 pl-6"><li><Link href="/learn/community-connections">Community engagement: from input to action</Link></li><li><Link href="/practice/clas">Cultural and language access planning</Link></li><li><Link href="/learn/equity-toolkit">Equity Analysis Toolkit</Link></li><li><Link href="/practice/measurement">Plan how to learn from results</Link></li><li><Link href="/ask">Ask a question about these resources</Link></li></ul></section>
    <p className="text-sm text-muted">The original documents are preserved. ADSA materials describe their administration’s context, including internal processes and contacts. Their inclusion for staff and public readers does not make every example a requirement for every service. Use the source dates and applicable current processes when planning.</p>
  </div>
  </>;}
