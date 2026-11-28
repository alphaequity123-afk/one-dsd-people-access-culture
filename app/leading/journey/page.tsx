
import { SourceLink } from "@/components/app-link";
import type { Metadata } from "next";
import Link from "@/components/app-link";
import { LeadingStartChooser } from "@/components/leading-start-chooser";
import { LEADING_LABEL, LEADING_PATHS, LEADING_PRIVACY_SENTENCE } from "@/lib/content/collections";
import { END_OF_PATH_QUESTIONS, JOURNEY_STEPS, LEARNING_ELSEWHERE, LEARNING_WITH_OTHERS, PATH_JOURNEY, REFLECTION_PROMPTS, SIX_WEEKS, WEEKLY_RHYTHM } from "@/lib/content/leadership-journey";
import base from "@/app/learn/collaboration/collaboration.module.css";
import styles from "@/components/collections.module.css";

export const metadata: Metadata = {
  title: `Your leadership journey | ${LEADING_LABEL}`,
  description: "Connect leadership learning with a work decision, reflection and follow-up. This optional path does not enroll you in assigned training; related learning tools explain what they save.",
};

export default function LeadingJourneyPage() {
  const paths = LEADING_PATHS.map(path => ({ slug: path.slug, title: path.title, description: path.description }));
  return <div className={base.page}><div className={base.content}>
    <p className={base.back}><Link href="/leading">{LEADING_LABEL}</Link></p>
    <header className={base.intro}>
      <p className={base.eyebrow}>Optional</p>
      <h1>Your leadership journey</h1>
      <p className={base.lede}>A way to grow as a leader at your own pace, from a first interest in leading to setting direction for others.</p>
      <p>There is no nomination, no group to join and no deadline. You choose where to start and how fast to go. {LEADING_PRIVACY_SENTENCE} <Link href="/leading/how-this-works">How this works</Link>.</p>
    </header>

    <section className={styles.section} aria-labelledby="journey-round-title">
      <h2 id="journey-round-title">How one round works</h2>
      <p>Each round is small: one lesson, a few lines of reflection, one thing tried in your real work, and a note on what happened. Then you go around again.</p>
      <ol className="list-decimal space-y-2 pl-6">
        {JOURNEY_STEPS.map(step => <li key={step.id}><strong>{step.title}.</strong> {step.body} <Link href={step.href}>{step.link}</Link>.</li>)}
      </ol>
      <p className={styles.plain}>Growth comes from combining structured learning with experience at work and feedback from colleagues. A lesson can introduce an idea; putting it to work means paying attention to the situation, your authority and the people affected. Look back at what happened before you decide what to keep or change.</p>
    </section>

    <section className={styles.section} aria-labelledby="journey-start-title">
      <h2 id="journey-start-title">Find a starting point</h2>
      <p>Answer two or three questions about your work, or simply choose from the list below.</p>
      <LeadingStartChooser paths={paths} />
      <ul className={styles.doors}>
        {LEADING_PATHS.map(path => <li key={path.slug}><Link className={styles.door} href={`/leading/paths/${path.slug}`}>
          <span className={styles.doorTitle}>{path.title}</span>
          {PATH_JOURNEY[path.slug] ? <span>{PATH_JOURNEY[path.slug].question}</span> : <span>{path.description}</span>}
          <span className={styles.doorAction}>Open this path</span>
        </Link></li>)}
      </ul>
    </section>

    <section className={styles.section} aria-labelledby="journey-rhythm-title">
      <h2 id="journey-rhythm-title">A steady rhythm</h2>
      <p>A week that fits inside real work looks something like this. Take less when the week is full.</p>
      <ul className="list-disc pl-6">
        {WEEKLY_RHYTHM.map(item => <li key={item.what}>{item.what}: {item.time}</li>)}
      </ul>
      <details>
        <summary>One way to pace a path over six weeks</summary>
        <ol className="mt-2 space-y-2 pl-0">
          {SIX_WEEKS.map(week => <li key={week.week}><strong>Week {week.week}.</strong> Learn: {week.learn}. Reflect: {week.reflect}. Apply: {week.apply}.</li>)}
        </ol>
        <p className={styles.plain}>This is one example. Any path can be taken faster, slower or in a different order.</p>
      </details>
    </section>

    <section className={styles.section} aria-labelledby="journey-reflect-title">
      <h2 id="journey-reflect-title">Looking back</h2>
      <p>Reflection lets you compare what you meant to do with what happened. Note what you observed, why it matters and what is still uncertain, then decide what to keep, what to revise and what to pass to the person responsible for it. <Link href="/my-work/reflections">Open your reflection notebook</Link>.</p>
      <ul className="list-disc space-y-2 pl-6">
        {REFLECTION_PROMPTS.map(prompt => <li key={prompt.kind}><strong>{prompt.kind}.</strong> {prompt.when} {prompt.questions.join(" ")}</li>)}
      </ul>
      <p className={styles.plain}>When you set a date to look back, the notebook shows it to you the next time you open it. Nothing is sent as a reminder.</p>
    </section>

    <section className={styles.section} aria-labelledby="journey-others-title">
      <h2 id="journey-others-title">Learning with others, if you want to</h2>
      <p>None of this is required. A conversation with someone you trust can deepen what you notice.</p>
      <ul className={styles.doors}>
        {LEARNING_WITH_OTHERS.map(place => <li key={place.href}><Link className={styles.door} href={place.href}><span className={styles.doorTitle}>{place.title}</span><span>{place.body}</span></Link></li>)}
      </ul>
    </section>

    <section className={styles.section} aria-labelledby="journey-elsewhere-title">
      <h2 id="journey-elsewhere-title">Free courses elsewhere</h2>
      <p>For anyone who wants more. These belong to other organizations, open on their sites, and may ask you to create an account there. If you need required-training credit, confirm it through the agency process for that requirement; please don&apos;t assume an outside course counts toward it.</p>
      <ul className="list-disc pl-6">
        {LEARNING_ELSEWHERE.map(course => <li key={course.href}><SourceLink className="underline" href={course.href} target="_blank" rel="noreferrer">{course.title}</SourceLink>, {course.provider}. {course.body}</li>)}
      </ul>
    </section>

    <section className={styles.section} aria-labelledby="journey-end-title">
      <h2 id="journey-end-title">At the end of a path</h2>
      <p>Four questions to ask yourself:</p>
      <ul className="list-disc pl-6">
        {END_OF_PATH_QUESTIONS.map(question => <li key={question}>{question}</li>)}
      </ul>
      <p className={styles.plain}>This path is optional: there is no completion submission or supervisor score report. Related lessons may save progress or practice responses in your browser profile. If you want something to bring to a development conversation, review and download your action plans and reflections from <Link href="/my-work">My work</Link>. What you share, and with whom, is your choice.</p>
    </section>
  </div></div>;
}
