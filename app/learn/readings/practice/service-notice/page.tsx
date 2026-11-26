import type { Metadata } from 'next';
import Link from "@/components/app-link";
import { PageIntro } from '@/components/ui';
import { ReadingPractice } from '@/components/reading-practice';
import { PracticeVideo } from '@/components/practice-video';
import { readingById, readingHref } from '@/lib/content/reading-collection';
import { requestedContentScope } from '@/lib/product/request-context';
import styles from '../../reading.module.css';
export const metadata:Metadata={title:'Make a service notice easier to use'};
export default async function ServiceNoticePractice(){
  const scope=await requestedContentScope();
  const books=['reading-196','reading-198','reading-105'].map(readingById).filter(b=>Boolean(b));
  return <div className={styles.page}><div className={styles.body}><Link href="/learn/readings" className={styles.back}>Books and ideas for your work</Link></div><PageIntro kicker="Reading into practice" title="Make a service notice easier to use" lede="Follow a practice example, consider three useful perspectives, then try a decision of your own."/>
    <div className={styles.body}><article className={styles.article}>
      <p className={styles.note}>This example was written for practice. It illustrates a way to think through a decision; it is not an actual DHS notice, a program requirement or a finding about people who use services.</p>
      <section><h2>Begin with the person’s task</h2><p>{scope==='dsd'?'Imagine a person receiving disability services who gets a notice about updating their contact information.':'Imagine someone using a public service who gets a notice about updating their contact information.'} The notice is accurate, but the main action is buried in several paragraphs. It points to a website without explaining how to get help or respond another way.</p><p>The team’s question is: “Can people understand what they need to do and complete it in a way that works for them?”</p></section>
      <PracticeVideo clip="north-crossing" />
      <section><h2>Look at the decision from three perspectives</h2><ul>{books.map(book=>book?<li key={book.id}><Link href={readingHref(book.id)}>{book.title}</Link><p>{book.number===196?'Consider the learning, practical effort and stress involved in completing the task.':book.number===198?'Look at the whole service experience, including the points where responsibility passes from one team to another.':'Consider accessibility throughout the design, rather than as a final check.'}</p></li>:null)}</ul><p>These connections are our application of the readings to this practice situation. The books provide the fuller arguments.</p></section>
      <section><h2>Work through one possible response</h2><ol><li><strong>Clarify the purpose.</strong> Work out what information is really needed, why it is needed, and which requirements apply.</li><li><strong>Learn where the difficulty occurs.</strong> Ask people with different communication and access needs to explain what they would do after reading the notice. Offer the language and access support people need.</li><li><strong>Compare practical changes.</strong> Put the requested action first, explain the response options clearly, and test whether people can use those options. Confirm which changes the responsible program can make.</li><li><strong>Make the reasoning visible.</strong> Note the alternatives, what participants told you, what is still uncertain and the action you propose, in the Equity Analysis Toolkit.</li><li><strong>Check the result.</strong> Look for clearer understanding and successful responses, alongside unresolved questions or barriers. Ask whose experience is missing from the evidence.</li></ol></section>
      <section><h2>Tools that support the work</h2><ul><li><Link href="/learn/equity-toolkit/practice">Work through the Equity Analysis Toolkit</Link></li><li><Link href="/practice/gp-13">Check a communication</Link></li><li><Link href="/practice/clas">Consider cultural and language access</Link></li><li><Link href="/practice/measurement">Plan how to learn from the result</Link></li></ul>{scope==='dsd'?<p>This work can support the ADSA goal on communication and accessibility. <Link href="/program/implementation#goal-6">Explore its action steps and related work.</Link></p>:<p>Think about how the proposed change fits the priorities and responsibilities of your own program.</p>}</section>
      <ReadingPractice/>
    </article></div></div>;
}
