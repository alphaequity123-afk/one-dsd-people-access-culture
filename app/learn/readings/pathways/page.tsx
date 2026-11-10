import Link from 'next/link';
import { PageIntro } from '@/components/ui';
import { readingPathways } from '@/lib/content/reading-pathways';
import { readingSections } from '@/lib/content/reading-collection';
import styles from '../reading.module.css';
import { ResourceDownloads } from "@/components/resource-downloads";
export const metadata={title:'Put a reading to work'};
export default function ReadingPathwaysPage(){
 return <div className={styles.page}><div className={styles.body}><Link className={styles.back} href="/learn/readings">Books and ideas for your work</Link></div>
 <PageIntro kicker="Choose a question that matters to you" title="Put a reading to work" lede="Start with a situation, explore a few perspectives and try a thoughtful next step. There is no required reading order."/>
 <div className={styles.body}><details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this reading guide</summary><ResourceDownloads kind="reading" id="pathways" noun="reading guide" /></details><article className={styles.article}>
 <p>Directors, managers, supervisors and staff can use these suggestions individually or with colleagues. Choose by the work you are doing, not by your job title. Use practice examples or information appropriate to share.</p>
 <nav aria-label="Reading questions"><ul>{readingPathways.map(path=><li key={path.section}><a href={`#collection-${path.section}`}>{path.title}</a></li>)}</ul></nav>
 {readingPathways.map(path=><section id={`collection-${path.section}`} key={path.section} className={styles.path}>
 <p className={styles.label}>{readingSections[path.section-1]}</p><h2>{path.title}</h2><p><strong>{path.question}</strong></p>
 <p>{path.tryIt}</p><h3>Check your thinking</h3><p>{path.check}</p>
 <p><Link href={`/learn/readings?section=${path.section}`}>Choose readings from this collection</Link></p>
 <ul><li><Link href={`/courses/${path.course}`}>{path.courseTitle}</Link></li><li><Link href={path.tool}>{path.toolTitle}</Link></li></ul>
 </section>)}
 <section><h2>Return to what you tried</h2><p>Before reopening your notes, explain the idea in your own words. After trying it, write down what happened, what remains uncertain and one adjustment you would make. Revisit the question after your next relevant task or team conversation.</p><p>These activities are suggestions written for this program. They do not replace the authors’ arguments, official guidance or the perspectives of people affected by a decision.</p></section>
 </article></div></div>;
}
