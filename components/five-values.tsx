import Link from "@/components/app-link";
import styles from "./five-values.module.css";

/**
 * Five shared values on Practice (v2 prototype, "Begin with equity · Five shared values"). The words are the
 * live One DSD site's own (one-dhs-pac app/start/page.tsx); the full introduction and its practice situation
 * are at /begin-with-equity.
 */
export const VALUES = [
  ["Dignity", "Treat people as people with knowledge, preferences, and choices.", "Address the person with a disability directly. Ask how they want to communicate and who they want involved."],
  ["Fairness", "Examine how a decision affects people with different circumstances.", "Examine whether a DSD form, assessment or hiring step measures what matters or creates an avoidable barrier."],
  ["Access", "Make it possible for people to understand, participate, and use what is offered.", "Plan accessible documents, interpretation, captions, usable systems and alternatives for people who cannot use a digital channel."],
  ["Belonging", "Create conditions where people can contribute and be taken seriously.", "Include colleagues and community members with disabilities in decisions, training and leadership opportunities."],
  ["Accountability", "Follow through, explain decisions, and learn from their effects.", "Name who will remove a barrier, check whether people can use the change, and explain what happened to their feedback."],
] as const;

export function FiveValues() {
  return <section className={styles.values} aria-labelledby="five-values-title">
    <p className={styles.kicker}>Begin with equity</p>
    <h2 id="five-values-title">Five values to guide the work</h2>
    <p className={styles.lede}>These values can help you reflect, talk through a decision and decide what to do next.</p>
    <ol>{VALUES.map(([name, meaning, action]) => <li key={name}>
      <h3>{name}</h3>
      <p>{meaning}</p>
      <p className={styles.action}>{action}</p>
    </li>)}</ol>
    <p><Link className={styles.primary} href="/begin-with-equity#try-it">Practise with a situation</Link></p>
  </section>;
}
