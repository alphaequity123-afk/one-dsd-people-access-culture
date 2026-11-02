import type { JobAid } from '@/lib/content/clas-curriculum-practice';

/** The printable one-page job aid. Server-renderable; the buttons live in JobAidActions. */
export function JobAidSheet({ aid, lessonTitle, part, standards }: { aid: JobAid; lessonTitle: string; part: number; standards: number[] }) {
  return (
    <article className="clas-job-aid" aria-labelledby="job-aid-title">
      <p className="clas-study-eyebrow">ONE-PAGE JOB AID · PART {part}: {lessonTitle.toUpperCase()}</p>
      <h1 id="job-aid-title">{aid.title}</h1>
      {aid.useWhen && <p className="clas-job-aid-use"><strong>Use when:</strong> {aid.useWhen}</p>}
      <div className="clas-job-aid-grid">
        {aid.sections.map(section => <section key={section.heading}><h2>{section.heading}</h2><ul>{section.items.map(item => <li key={item}>{item}</li>)}</ul></section>)}
      </div>
      {aid.remember.length > 0 && <section><h2>Remember</h2><ul>{aid.remember.map(item => <li key={item}>{item}</li>)}</ul></section>}
      {aid.askWho.length > 0 && <section><h2>Who to ask</h2><ul>{aid.askWho.map(item => <li key={item}>{item}</li>)}</ul></section>}
      <p className="clas-job-aid-foot">CLAS standard{standards.length === 1 ? '' : 's'} {standards.join(', ')}. Use the current procedures applicable to your role and program when taking action. Leave names, case details and other private information out of your notes.</p>
    </article>
  );
}
