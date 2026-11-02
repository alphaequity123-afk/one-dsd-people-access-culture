import Link from 'next/link';
import curriculum from '@/lib/content/clas-curriculum.json';
import { loadClasFrontPageData } from '@/lib/content/clas-curriculum-page-data';
import { ShareClasCollection } from '@/components/clas-curriculum/share-collection';
import '@/components/clas-curriculum.css';

export const metadata = {
  title: 'CLAS curriculum collection — One DSD',
  description: 'Nine connected CLAS lessons, videos, discussion audio, transcripts, practice activities and planning resources in one shareable collection.',
};

export default function Page() {
  const { jobAidIds } = loadClasFrontPageData();
  return <div className="clas-study">
    <nav aria-label="CLAS learning"><Link prefetch={false} href="/learn/clas">All CLAS resources</Link></nav>
    <header><h1>CLAS curriculum collection</h1><Link className="clas-study-primary text-white" href="/learn/clas/curriculum/01">Start with Part 1</Link> <Link href="/learn/clas/curriculum">Curriculum and listening overview</Link></header>
    <section className="clas-welcome" aria-label="One DSD welcome"><a href="/" className="clas-welcome-image"><img src="/images/welcome/one-dsd-entry-larger-text-4k.png" alt="One DSD People, Access and Culture welcome" width="960" height="540" /></a><div><a href="/home"><img src="/images/welcome/one-dsd-home-qr.svg" alt="Scan to open the One DSD app" width="320" height="320" /></a><p>Scan to open One DSD</p></div></section>
    <ShareClasCollection />
    <section aria-labelledby="collection-lessons"><h2 id="collection-lessons">The nine-part curriculum</h2><p>Each lesson includes a video, discussion audio, full text, captions and individual practice. Pause and return at your own pace.</p><ol className="clas-study-path">{curriculum.modules.map(m => <li key={m.id}><span>Part {Number(m.id)} · Standards {m.standards.join(', ')}</span><h2><Link href={`/learn/clas/curriculum/${m.id}`}>{m.title}</Link></h2><p>{m.deliverable}</p>{jobAidIds.includes(m.id) && <Link href={`/learn/clas/curriculum/${m.id}/job-aid`}>Open the one-page job aid</Link>}</li>)}</ol></section>
    <section><h2>Put your learning into practice</h2><ul><li><Link href="/practice/clas">Cultural and language access planning worksheet</Link></li><li><a href="/documents/engagement/clas-implementation-checklist.pdf">Implementation checklist and action worksheet (PDF)</a></li><li><a href="https://thinkculturalhealth.hhs.gov/clas/standards">Original National CLAS Standards</a></li></ul><p>Use a non-sensitive work example. Keep official records in approved systems and confirm the current requirements and procedures for your role.</p></section>
  </div>;
}
