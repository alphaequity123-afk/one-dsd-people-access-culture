import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageIntro } from '@/components/ui';
import { readingById, readingSections } from '@/lib/content/reading-collection';
import { RESOURCE_THEMES } from '@/lib/content/resource-organization';
import connections from '@/lib/content/reading-connections.json';
import { usesOfReading, briefsSuggestingReading } from '@/lib/content/knowledge-graph';
import { getAvailableInterculturalResources } from '@/lib/content/intercultural-resource-resolver';
import { requestedContentScope } from '@/lib/product/request-context';
import styles from '../reading.module.css';
import { ResourceDownloads } from "@/components/resource-downloads";
import { PrintOpenPanels } from "@/components/rp-print-open-panels";
const KIND_LABEL: Record<string, string> = { resource: 'Course or resource', path: 'Guided practice', brief: 'Community brief' };
/** These pages have no withdrawal gate of their own; the Cultural Intelligence hub shows them the same way. */
const UNGATED_GUIDE_PATHS = new Set(['/learn/clas','/practice/clas','/one-dsd/leadership']);
type GuideLink = {href:string;dsdOnly?:boolean};
/** A chapter guide links only to what this viewer's scope can open. A failed lookup hides the checked links rather than showing an unchecked one. */
async function guideLinkFilter(links:GuideLink[]) {
  if(!links.length)return ()=>false;
  const scope=await requestedContentScope();
  const paths=[...new Set(links.map(link=>link.href.split('#')[0]))].filter(path=>!UNGATED_GUIDE_PATHS.has(path));
  const available=await getAvailableInterculturalResources(scope,paths.map(href=>({title:'',href,note:''}))).catch(()=>[]);
  const open=new Set([...UNGATED_GUIDE_PATHS,...available.map(item=>item.href)]);
  return (link:GuideLink)=>(!link.dsdOnly||scope==='dsd')&&open.has(link.href.split('#')[0]);
}
export async function generateMetadata({params}:{params:Promise<{readingId:string}>}):Promise<Metadata> {
  const book=readingById((await params).readingId);
  return {title:book?.title??'Reading not found'};
}
export default async function ReadingPage({params}:{params:Promise<{readingId:string}>}) {
  const book=readingById((await params).readingId);if(!book)notFound();
  const showGuideLink=await guideLinkFilter(book.chapterGuide?.flatMap(item=>item.usedIn)??[]);
  return <div className={styles.page}><div className={styles.body}><Link className={styles.back} href="/learn/readings">Books and ideas for your work</Link></div>
    <PageIntro kicker={readingSections[book.section-1]} title={book.title} lede={book.authors}/>
    <div className={styles.body}><details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this reading</summary><ResourceDownloads kind="reading" id={book.id} noun="reading" /></details><article className={styles.article}>
      {book.citation?<section><div className="flex flex-col gap-6 sm:flex-row">{book.cover?<figure className="shrink-0"><img src={book.cover.src} alt={book.cover.alt} width={book.cover.width} height={book.cover.height} loading="lazy" className="h-auto w-40" /><figcaption className="mt-2 max-w-40 text-sm">{book.cover.credit}</figcaption></figure>:null}<div><p>{book.citation}</p>{book.bookLinks?<ul className={styles.related}>{book.bookLinks.map(link=><li key={link.href}><a href={link.href}>{link.label}</a></li>)}</ul>:null}{book.bookAccess?<p>{book.bookAccess}</p>:null}{book.trademarkNote?<p>{book.trademarkNote}</p>:null}</div></div></section>:null}
      <section><h2>About this book</h2>{book.overview.map((p,i)=><p key={i}>{p}</p>)}</section>
      <section><h2>Key ideas</h2><p>These reading notes present the author&apos;s arguments for reflection and discussion. They are not statements of DHS policy.</p><ul>{book.mainPoints.map((p,i)=><li key={i}>{p}</li>)}</ul></section>
      <details><summary>Read the full summary</summary>{book.summary.map((p,i)=><p key={i}>{p}</p>)}</details>
      {book.chapterGuide?<section><h2>Chapter guide</h2><p>{book.chapterGuideIntro}</p>{book.chapterGuide.map(item=><details key={item.chapter}><summary><strong>{item.chapter}: {item.title}</strong><span> · {item.part}, about pp. {item.pages}</span></summary><p>{item.about}</p><ul>{item.ideas.map((idea,i)=><li key={i}>{idea}</li>)}</ul><p><strong>What these applications add or do differently.</strong> {item.ours}</p>{item.usedIn.some(showGuideLink)?<><p><strong>Where you meet it</strong></p><ul className={styles.related}>{item.usedIn.filter(showGuideLink).map(link=><li key={link.label}><Link href={link.href}>{link.label}</Link></li>)}</ul></>:null}<p><strong>To discuss</strong></p><ol>{item.discuss.map((question,i)=><li key={i}>{question}</li>)}</ol>{item.related?<p><a href={item.related.href}>{item.related.label}</a></p>:null}</details>)}</section>:null}
      <section><h2>Use this reading</h2>
        <details className="course-more-item"><summary>Connections to your work</summary>{book.relevance.map((p,i)=><p key={i}>{p}</p>)}<p><Link href={`/learn/readings/pathways#collection-${book.section}`}>Explore a practical question with this collection</Link></p></details>
        {briefsSuggestingReading(book.id).length?<details className="course-more-item"><summary>Suggested reading for a community brief</summary><p>This book is one of two suggested to deepen understanding of {briefsSuggestingReading(book.id).length>1?'these communities':'this community'}. The brief offers context for better questions and access planning, never a description of any one person.</p><ul className={styles.related}>{briefsSuggestingReading(book.id).map(item=><li key={item.id}><Link href={item.href}>{item.title}</Link></li>)}</ul></details>:null}
        {usesOfReading(book.id).filter(item=>item.kind!=='brief').length?<details className="course-more-item"><summary>Where these ideas live in the program</summary><p>The courses, guided practices and community briefs below work with the ideas in this book. Each one is a place to take the reading further in your own work.</p><ul className={styles.related}>{usesOfReading(book.id).filter(item=>item.kind!=='brief').map(item=><li key={item.id}><Link href={item.href}>{item.title}</Link><span> · {KIND_LABEL[item.kind]??item.kind}</span>{item.why?<span className={styles.related}> {item.why}</span>:null}</li>)}</ul></details>:null}
        <details className="course-more-item"><summary>Reflect or discuss with your team</summary><ol>{book.questions.map((p,i)=><li key={i}>{p}</li>)}</ol><p>Choose one question that matters to your work. You can reflect privately, use a practice example or discuss the ideas with colleagues.</p></details>
      </section>
      {connections.filter(item=>item.book===book.number).map(item=><section key={item.course} className={styles.path}><h2>Put an idea into practice</h2><p>{item.reason}</p><p>{item.practice}</p><p>This activity is a learning suggestion inspired by the reading.</p><Link href={`/courses/${item.course}`}>Continue with the related course</Link><p>Return to your reflection after trying the idea. What evidence would help you judge whether it made a difference?</p></section>)}
      {[105,196,198].includes(book.number)?<section className={styles.path}><h2>Try an example</h2><p>Explore how a service notice can create work for the person receiving it, then consider a more accessible approach.</p><Link href="/learn/readings/practice/service-notice">Improve a service notice</Link></section>:null}
      <details className="course-more-item"><summary>Keep exploring</summary><ul className={styles.related}>{book.themes.map(id=><li key={id}><Link href={`/learn/readings?theme=${id}`}>{RESOURCE_THEMES.find(t=>t.id===id)?.title??id}</Link></li>)}</ul></details>
      <details><summary>About these reading notes</summary><p>These notes summarize and discuss the book; they do not reproduce the full text. Ideas attributed to the author are perspectives for consideration, not statements of DHS policy. Consult the book for its complete argument and the applicable guidance for decisions in your work.</p><p><a href={book.sourceUrl}>Find the original book and available editions</a></p>{book.editionNote?<p>{book.editionNote}</p>:null}</details>
    </article><PrintOpenPanels /></div></div>;
}
