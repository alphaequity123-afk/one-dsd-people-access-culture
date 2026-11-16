import type { Metadata } from 'next';
import { ResourceDownloads } from "@/components/resource-downloads";
import Image from 'next/image';
import Link from "@/components/app-link";
import { PageIntro } from '@/components/ui';
import { publishedCourses } from '@/lib/content/courses/published';
import { requestedContentScope } from '@/lib/product/request-context';
import styles from './series.module.css';
import { EMOTIONS_AND_VALUES_COURSE_IDS } from '@/lib/content/learn-page-copy';
export const metadata: Metadata = {title:'Emotions, Values, and Everyday Practice'};
export const dynamic='force-dynamic';
const ids=EMOTIONS_AND_VALUES_COURSE_IDS;
export default async function Page(){
 const scope=await requestedContentScope();
 const available=await publishedCourses(scope);
 const courses=ids.flatMap(id=>available.filter(({pack})=>pack.course.id===id));
 return <div>
  <PageIntro kicker="Learn at your own pace" title="Emotions, Values, and Everyday Practice" lede="Understand your responses, explore different perspectives, and put that understanding to work in conversations and decisions."/>
  <div className={`wrap ${styles.body}`}>
   <p><Link href="/learn">Learn</Link></p><details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="learn-page" id="emotions-and-values" noun="series" scope={scope} /></details>
   <section aria-labelledby="start-title"><h2 id="start-title">Choose a starting point</h2><p>Begin with emotional awareness or your own cultural-value lens, then move into conversations and practical decisions. Each course stands on its own. Directors, managers, supervisors, and staff can use the same cases from the perspective of their responsibilities.</p><p>Each course offers seven lessons, situations you may recognize, choices with helpful feedback, and a guide to take into your work. Listen to the two-person conversation or read it, then try an activity at your own pace. Allow about 75–90 minutes per course, including practice, or return for one lesson at a time.</p></section>
   <div className={styles.grid}>{courses.map(({pack},i)=><article className={styles.card} key={pack.course.id}>
    <div className={styles.image}><Image src={pack.course.coverImage} alt={pack.course.coverAlt} fill sizes="(max-width: 760px) 90vw, 520px" unoptimized/></div>
    <div className={styles.cardBody}><p className={styles.kicker}>Course {i+1} · {i<2?'Emotional intelligence':'Cultural values'}</p><h2><Link href={`/courses/${pack.course.id}`}>{pack.course.title}</Link></h2><p>{pack.course.subtitle}</p><details><summary>What you will explore</summary><ol>{pack.course.lessons.map(l=><li key={l.id}><Link href={`/courses/${pack.course.id}/${l.id}`}>{l.title}</Link></li>)}</ol></details><Link className={styles.action} href={`/courses/${pack.course.id}`}>Explore this course</Link></div>
   </article>)}</div>
   <section className={styles.practice} aria-labelledby="work-title"><h2 id="work-title">Connect the learning to your work</h2><ul><li><Link href="/learn/equity-toolkit/practice">Use the Equity Analysis Toolkit</Link> to examine a decision, its assumptions, and its effects.</li><li><Link href="/practice/clas">Explore culturally and linguistically appropriate services</Link> when planning communication and participation.</li><li><Link href="/courses?browse=all&amp;q=collaboration">Continue with team and collaboration learning</Link> for shared responsibilities and cross-division work.</li><li><Link href="/support/right-person">Find the person or area responsible</Link> when a concern needs formal advice or a decision beyond your role.</li></ul><p>Start with one change and see what you learn. You can use the examples provided for every exercise, and choose what you want to reflect on privately. There is no personal assessment to complete.</p></section>
   <section id="sources" className={styles.sources} aria-labelledby="sources-title"><h2 id="sources-title">About the learning</h2><p>The emotional-intelligence courses draw on research about emotional abilities, regulation, and the limits of assessment. The cultural-values courses combine values research with cultural humility and original public-service examples. Each course includes its sources and explains what those sources can support.</p><p><em>Cultural Values: Understanding Your Own Lens</em> adapts values-reflection material from a DHS workshop presented by Verona Mitchell. The course does not reproduce the workshop's proprietary profile.</p></section>
  </div>
 </div>;
}
