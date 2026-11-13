
import { SourceLink } from "@/components/app-link";
import Link from "@/components/app-link";
import { ENGAGEMENT_RESOURCES } from '@/lib/content/engagement-resources';
import { resourceStudyHref } from "@/lib/client/resource-study-links";

export function EngagementResourceLinks({kind='all'}:{kind?:'all'|'engagement'|'clas'}) {
  const resources=ENGAGEMENT_RESOURCES.filter(item=>kind==='all'||(kind==='clas')===item.id.startsWith('ref-clas'));
  return <section className="space-y-4 border-t border-line pt-6" aria-labelledby="engagement-source-heading">
    <h2 id="engagement-source-heading" className="text-2xl font-semibold">{kind==='clas'?'CLAS implementation resource':'Engagement guides and planning resources'}</h2>
    <p>Use the original resources alongside your working notes. Each overview explains when to use the resource and links to its PDF.</p>
    <ul className="grid gap-4 md:grid-cols-2">{resources.map(item => {
      const resourcePath = `/library/${item.id}`;
      return <li key={item.id} className="rounded-lg border border-line p-5">
        <h3 className="text-lg font-semibold"><Link href={resourcePath}>{item.title}</Link></h3>
        <p className="mt-2">{item.summary}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4">
          <SourceLink className="inline-flex min-h-11 items-center" href={item.nextActions.find(action => action.href.startsWith("/documents/engagement/"))?.href}>Open original PDF</SourceLink>
          {process.env.GEMINI_API_KEY?.trim() ? <Link className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4" href={resourceStudyHref(resourcePath)} prefetch={false} aria-label={`Study ${item.title}`}>Study this document</Link> : null}
        </div>
      </li>;
    })}</ul>
    {kind!=='all'?<p><Link href="/learn/engagement-resources">See how all four resources work together</Link></p>:null}
  </section>;
}
