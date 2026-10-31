import Link from 'next/link';
import { WORK_EXAMPLES } from '@/lib/program/work-examples';
import styles from './work-examples.module.css';

export function WorkExamples({dsd=false}:{dsd?:boolean}) {
  return <section className={styles.section} id="work-examples" aria-labelledby="work-examples-title">
    <p className={styles.eyebrow}>Ideas you can put to work</p>
    <h2 id="work-examples-title">Start with a situation that feels familiar</h2>
    <p>These practice examples connect useful resources with everyday decisions. Choose one to see what you could do and how you might learn from it.</p>
    {WORK_EXAMPLES.map(example=><details className={styles.example} key={example.id} open={example.id === 'notice'} name="work-example">
      <summary>{example.title}</summary>
      <div className={styles.body}>
        <p>{dsd && example.dsdSituation ? example.dsdSituation : example.situation}</p>
        <ol className={styles.steps}>{example.links.map(link=><li key={link.href}><Link href={link.href}>{link.label}</Link><p>{link.purpose}</p></li>)}</ol>
        <div className={styles.outcome}><h3>What you can take back</h3><p>{example.takeaway}</p><h3>How you’ll know more</h3><p>{example.check}</p></div>
      </div>
    </details>)}
    <p className={styles.note}>Use the resources that fit your responsibility. Confirm applicable requirements and the appropriate review before changing a service or policy.</p>
  </section>;
}
