import Link from 'next/link';
import { ENGAGEMENT_RESOURCES } from '@/lib/content/engagement-resources';

export function EngagementResourceLinks({kind='all'}:{kind?:'all'|'engagement'|'clas'}) {
  const resources=ENGAGEMENT_RESOURCES.filter(item=>kind==='all'||(kind==='clas')===item.id.startsWith('ref-clas'));
  return <section className="space-y-4 border-t border-line pt-6" aria-labelledby="engagement-source-heading">
    <h2 id="engagement-source-heading" className="text-2xl font-semibold">{kind==='clas'?'CLAS implementation resource':'Engagement guides and planning resources'}</h2>
    <p>Use the original resources alongside your working notes. Each overview explains when to use the resource and links to its PDF.</p>
    <ul className="grid gap-4 md:grid-cols-2">{resources.map(item=><li key={item.id} className="rounded-lg border border-line p-5"><h3 className="text-lg font-semibold"><Link href={`/library/${item.id}`}>{item.title}</Link></h3><p className="mt-2">{item.summary}</p><p className="mt-3"><a href={item.nextActions.find(action=>action.href.startsWith("/documents/engagement/"))?.href}>Open original PDF</a></p></li>)}</ul>
    {kind!=='all'?<p><Link href="/learn/engagement-resources">See how all four resources work together</Link></p>:null}
  </section>;
}
