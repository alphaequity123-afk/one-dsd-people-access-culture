
import { SourceLink } from "@/components/app-link";
import Link from "@/components/app-link";

import { culturalLeadershipLessons } from "@/lib/content/cultural-leadership-learning";
import { LEADERSHIP_PATHWAY_HREF } from "@/lib/content/leadership-styles-pathway";

/** A self-directed practice sequence; no responses, scores or personal records are collected. */
export function CulturalLeadershipCurriculum() {
  return <section aria-labelledby="leadership-learning-title" className="space-y-5 border-t border-line pt-8">
    <h3 id="leadership-learning-title" className="text-2xl font-semibold">Leadership learning: from awareness to accountable action</h3>
    <p className="max-w-4xl leading-7">These four connected lessons are for leaders, supervisors, managers and directors. Explore them in any order. Each uses a fictional DSD example to consider leadership, power, access and organizational change. Take notes in your own preferred format; this page does not collect responses or score people. Do not include identifiable case, medical or personnel details in an informal exercise.</p>
    <p className="max-w-4xl leading-7">This learning supports your judgment and responsibilities; it does not replace current policy, a person&apos;s choices, consultation with the responsible office, or required organizational processes.</p>
    <div className="space-y-4">{culturalLeadershipLessons.map(lesson => <details key={lesson.id} id={lesson.id} className="rounded-xl border border-line p-5">
      <summary className="cursor-pointer text-lg font-semibold">{lesson.title}</summary>
      <div className="mt-4 max-w-4xl space-y-4 leading-7">
        <p className="font-semibold">{lesson.question}</p>
        <div><h4 className="font-semibold">What you can practice</h4><ul className="mt-2 list-disc space-y-1 pl-6">{lesson.outcomes.map(item => <li key={item}>{item}</li>)}</ul></div>
        {lesson.reading.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        <div className="rounded-lg bg-slate-50 p-4"><h4 className="font-semibold">A situation to work through</h4><p className="mt-2">{lesson.scenario}</p></div>
        <div><h4 className="font-semibold">Try it</h4><ol className="mt-2 list-decimal space-y-2 pl-6">{lesson.practice.map(item => <li key={item}>{item}</li>)}</ol></div>
        <p><strong>Reflect:</strong> {lesson.check}</p>
      </div>
    </details>)}</div>
    <div className="max-w-4xl space-y-3 leading-7">
      <h4 className="text-xl font-semibold">Continue with the work</h4>
      <p>Use a real decision only in an appropriate setting, involve the people affected and follow up on what changed. These lessons do not award training credit or evaluate an individual&apos;s performance.</p>
      <ul className="list-disc space-y-1 pl-6"><li><Link className="underline" href={LEADERSHIP_PATHWAY_HREF}>Go deeper with the leadership styles pathway</Link></li><li><Link className="underline" href="/leading">Explore supervisor and manager guidance</Link></li><li><Link className="underline" href="/learn/equity-toolkit">Use the Equity Analysis Toolkit</Link></li><li><Link className="underline" href="/my-work/plan">Make a plan in My Work</Link></li></ul>
    </div>
    <details className="max-w-4xl rounded-xl border border-line p-5">
      <summary className="cursor-pointer font-semibold">Sources and further learning</summary>
      <ul className="mt-3 space-y-2 leading-7">
        <li><SourceLink className="underline" href="https://eric.ed.gov/?id=EJ898247" target="_blank" rel="noreferrer">Carolyn Shields: transformative leadership and equity</SourceLink></li>
        <li><SourceLink className="underline" href="https://doi.org/10.1016/0090-2616%2890%2990061-S" target="_blank" rel="noreferrer">Bernard Bass: transformational leadership and shared vision</SourceLink></li>
        <li><SourceLink className="underline" href="https://chicagounbound.uchicago.edu/uclf/vol1989/iss1/8/" target="_blank" rel="noreferrer">Kimberlé Crenshaw: intersectionality and the intersection of race and sex</SourceLink></li>
        <li><SourceLink className="underline" href="https://sinsinvalid.org/10-principles-of-disability-justice/" target="_blank" rel="noreferrer">Sins Invalid: principles of disability justice</SourceLink></li>
        <li><SourceLink className="underline" href="https://web.mit.edu/curhan/www/docs/Articles/15341_Readings/Organizational_Learning_and_Change/Edmondson_1999_Psychological_safety.pdf" target="_blank" rel="noreferrer">Amy Edmondson: psychological safety and learning in teams</SourceLink></li>
        <li><SourceLink className="underline" href="https://www.upliftoregon.org/wp-content/uploads/Continuum_AntiRacist.pdf" target="_blank" rel="noreferrer">Crossroads Ministry and collaborators: continuum toward an anti-racist multicultural organization</SourceLink></li>
        <li><SourceLink className="underline" href="https://www.eeoc.gov/retaliation" target="_blank" rel="noreferrer">EEOC: retaliation and protected activity</SourceLink></li>
      </ul>
    </details>
  </section>;
}
