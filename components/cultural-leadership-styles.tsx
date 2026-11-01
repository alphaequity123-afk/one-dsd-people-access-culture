import { LeadershipStyleVideo } from "./leadership-style-video";

import { culturalLeadershipApproaches } from "@/lib/content/cultural-leadership-learning";

/** A learning comparison, not an assessment or classification of individual people. */
export function CulturalLeadershipStyles() {
  return <section aria-labelledby="leadership-approaches-title" className="space-y-5 border-t border-line pt-8">
    <h3 id="leadership-approaches-title" className="text-2xl font-semibold">Leadership approaches and the decisions they shape</h3>
    <p className="max-w-4xl leading-7">Leadership is part of cultural understanding and organizational change. Leaders, supervisors, managers and directors can use these approaches to examine their own decisions and responsibilities. These approaches describe ways people may lead; they are not labels, scores or a complete list. A person can use different approaches in different situations. Consider what is needed, who has authority, who can influence the decision, and what happens for the people affected.</p>
    <div className="grid gap-4 md:grid-cols-2">{culturalLeadershipApproaches.map(approach => <details id={`leadership-style-${approach.id}`} key={approach.id} className="rounded-xl border border-line p-5">
      <summary className="cursor-pointer font-semibold">{approach.name}</summary>
      <p className="mt-3 leading-7">{approach.description}</p>
      <p className="mt-3 leading-7"><strong>Where it may help:</strong> {approach.possibleUse}</p>
      <p className="mt-3 leading-7"><strong>What to examine:</strong> {approach.watchFor}</p>
      <LeadershipStyleVideo style={approach.id} title={approach.name} />
    </details>)}</div>
    <div className="max-w-4xl space-y-3 leading-7">
      <h4 className="text-xl font-semibold">Bring the comparison to DSD work</h4>
      <p>In a service decision or workplace change, ask: Whose experience shapes the problem? Who has the authority to change the process? Can people disagree without retaliation? How do race, gender, disability, language, income and other circumstances affect access and influence? Ask people what works for them; do not assume a person speaks for a whole community.</p>
      <p>For example, a supervisor, manager and director supporting a team updating a notice could clarify their respective decisions, set a clear safety deadline, invite disabled people and communities affected to identify access barriers, share which choices are open, and report back on changes. Compare the approach taken with the effect on participation and the decision—not with a score on a leader.</p>
      <p>Leadership research uses these terms in different ways, and evidence from one setting does not prove an outcome in another. Use this comparison for reflection and discussion, alongside applicable policies and responsibilities.</p>
    </div>
    <details className="max-w-4xl rounded-xl border border-line p-5">
      <summary className="cursor-pointer font-semibold">Sources for leadership learning</summary>
      <ul className="mt-3 space-y-2 leading-7">
        <li><a className="underline" href="https://greenleaf.org/what-is-servant-leadership/" target="_blank" rel="noreferrer">Greenleaf Center: servant leadership</a></li>
        <li><a className="underline" href="https://www.journals.uchicago.edu/doi/abs/10.1086/218207" target="_blank" rel="noreferrer">Lippitt: research on authoritarian and democratic group settings</a></li>
        <li><a className="underline" href="https://doi.org/10.1080/00224545.1939.9713366" target="_blank" rel="noreferrer">Lewin, Lippitt and White: research on different group climates</a></li>
        <li><a className="underline" href="https://doi.org/10.1016/0090-2616%2890%2990061-S" target="_blank" rel="noreferrer">Bass: transformational leadership</a></li>
        <li><a className="underline" href="https://eric.ed.gov/?id=EJ898247" target="_blank" rel="noreferrer">Shields: transformative leadership and equity</a></li>
        <li><a className="underline" href="https://www.sciencedirect.com/science/article/pii/S1048984317300693" target="_blank" rel="noreferrer">Research on charismatic leadership and influence</a></li>
        <li><a className="underline" href="https://web.mit.edu/curhan/www/docs/Articles/15341_Readings/Organizational_Learning_and_Change/Edmondson_1999_Psychological_safety.pdf" target="_blank" rel="noreferrer">Edmondson: psychological safety and learning in teams</a></li>
      </ul>
    </details>
  </section>;
}
