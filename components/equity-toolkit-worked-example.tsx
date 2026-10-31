import Link from "next/link";
import SequenceVideo from "@/app/learn/equity-in-practice/sequence-video";
import example from "@/lib/program/equity-toolkit-example.json";
import media from "@/lib/program/equity-toolkit-tutorial-media.json";
import styles from "./equity-toolkit-worked-example.module.css";

export function EquityToolkitWorkedExample() {
  return <section id="worked-example" className={styles.section} aria-labelledby="worked-example-title">
    <p className={styles.eyebrow}>An optional worked example</p>
    <h2 id="worked-example-title">See how a useful analysis takes shape</h2>
    <p className={styles.intro}>See how a team could review a Community First Services and Supports (CFSS) notice, then try the approach with a different decision.</p>
    {media.src ? <div className={styles.video}>
      <h3>{example.title}</h3>
      <p className={styles.runtime}>{media.runtime}</p>
      <SequenceVideo className={styles.player} src={media.src} poster={media.poster} title={example.title} />
      {media.transcript ? <p className={styles.runtime}><a href={media.transcript}>Read the video transcript</a></p> : null}
    </div> : null}
    <p className={styles.note}>Use these five questions to build confidence alongside the Equity Analysis Toolkit training. For an actual review, follow the official toolkit and the approval steps that apply to your work.</p>
    <details className={styles.example}>
      <summary>Read the completed example</summary>
      <p className={styles.exampleIntro}>This example shows how a notice review could begin. The notes raise questions for the team to explore; they are not findings about CFSS participants or an approved decision.</p>
      <ol className={styles.fields}>
        {example.fields.map(field => <li key={field.fieldId}>
          <h3>{field.label}</h3>
          <p className={styles.startingPoint}><span>Starting point:</span> “{field.weakResponse}”</p>
          <blockquote>{field.fieldResponse}</blockquote>
          <p className={styles.reason}><strong>Why this is more useful:</strong> {field.reasoning}</p>
        </li>)}
      </ol>
      <p className={styles.synthesis}>Together, these notes can inform an equity impact statement. Evidence and engagement are still needed. Check alignment with current guidance, assign responsibility, and plan the resources needed to sustain the change.</p>
    </details>
    <div className={styles.next}>
      <h3>Now try a different decision</h3>
      <p>Consider a service team that wants to replace mailed appointment reminders with texts. What might become easier, and who might need another way to respond? Explore the choices below, using the CFSS review as a guide rather than copying its answers.</p>
      <a href="#toolkit-practice">Try the appointment-reminder example <span aria-hidden="true">↓</span></a>
      <p className={styles.actualWork}>For your own work, the <a href="#toolkit-draft">working draft</a> starts empty. Keep practice separate from actual work, and leave out identifying or confidential details.</p>
    </div>
    <p className={styles.resources}>Return to the <Link href="/library/ext-dhs-equity-toolkit">official toolkit and access details</Link> and the <Link href="/learn/equity-toolkit/policy-review">equity analysis training</Link> for the broader framework and the review your work requires. For communication choices, use the <Link href="/library/ja-plain-language">plain-language guide</Link> and <Link href="/library/ja-language-access-checklist">language-access checklist</Link>.</p>
  </section>;
}
