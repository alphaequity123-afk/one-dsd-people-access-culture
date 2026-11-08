import Link from 'next/link';
import { readingsFor } from '@/lib/content/knowledge-graph';

/** Books connected to a course: the chosen connections carry a reason and a practice; the computed ones share the course's ideas. */
export function RelatedReadings({courseId,collapsed=false}:{courseId:string;collapsed?:boolean}) {
  const related=readingsFor(`course-${courseId}`, 5);
  if(!related.length)return null;
  if(collapsed)return <details className="course-more-item"><summary>Explore another perspective</summary><RelatedReadingsBody related={related}/></details>;
  return <section aria-labelledby="related-readings-title">
    <h2 id="related-readings-title">Explore another perspective</h2>
    <RelatedReadingsBody related={related}/>
  </section>;
}

function RelatedReadingsBody({related}:{related:ReturnType<typeof readingsFor>}) {
  return <>
    <p>These optional readings can deepen your reflection on this course. The connections and practice prompts below are suggestions for learning, not DHS policy.</p>
    <ul>{related.map(item=><li key={item.id}>
      <h3><Link href={item.href}>{item.title}</Link></h3>
      {item.why ? <p>{item.why}</p> : null}{item.practice ? <p><strong>Try this:</strong> {item.practice}</p> : null}
    </li>)}</ul>
    <p>After trying an idea, revisit your notes. What changed, what surprised you and what would you do differently?</p>
  </>;
}
