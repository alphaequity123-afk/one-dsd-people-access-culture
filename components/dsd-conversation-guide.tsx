/** Moved here from the One DSD Communities page so communities have one home (owner decision 2026-11-22). */
const RESOURCES = [
  { title: "Advocating Change Together: Self-Advocates Minnesota", url: "https://www.selfadvocacy.org/self-advocates-of-minnesota" },
  { title: "Autistic Self Advocacy Network: Policy advocacy toolkits", url: "https://autisticadvocacy.org/policy/toolkits/" },
  { title: "Minnesota Disability Law Center", url: "https://mylegalaid.org/disability-law-center/" },
  { title: "Minnesota Statutes: Tribal consultation", url: "https://www.revisor.mn.gov/statutes/cite/10.65" },
];

export function DsdConversationGuide() {
  return <section className="dsd-conversation-guide" aria-labelledby="dsd-conversation-title">
    <h2 id="dsd-conversation-title">Prepare for a DSD conversation</h2>
    <p>People with disabilities belong to every Minnesota community. Race, language, age, geography, gender, family and cultural experience can affect how someone encounters DSD guidance, services and employment opportunities. A community brief can help you prepare; it cannot tell you what an individual wants.</p>
    <ul>
      <li>Name the decision people can influence: a revised form, an employment-support explanation, a service change or an outreach plan.</li>
      <li>Ask about communication and participation preferences. Consider disability access and language access separately, then arrange both where needed.</li>
      <li>Invite people with disabilities to speak for themselves, with supporters they choose. Seek more than one perspective and avoid treating an organization as the voice of every member of a community.</li>
      <li>Explain what happened to people’s input. For matters affecting Tribal governments, use the appropriate government-to-government process; a listening session is not a substitute for consultation.</li>
    </ul>
    <p className="dsd-conversation-plan"><a href="/minnesota-communities/prepare">Prepare for a conversation</a>: choose what it is for, the community and the access needed, and get a plan with questions to copy or print.</p>
    <h3>Disability-led learning and rights resources</h3>
    <ul>{RESOURCES.map(r => <li key={r.url}><a href={r.url}>{r.title}</a></li>)}</ul>
    <style>{`
      .dsd-conversation-guide { max-width: 46rem; margin: 0 0 2rem; }
      .dsd-conversation-guide h2 { margin: 0 0 .5rem; }
      .dsd-conversation-guide h3 { margin: 1.25rem 0 .5rem; font-size: 1.05rem; }
      .dsd-conversation-guide ul { padding-left: 1.25rem; }
      .dsd-conversation-guide li { margin-block: .35rem; }
      .dsd-conversation-plan { padding: .75rem 1rem; border-left: 3px solid #003865; background: #f4f7fb; border-radius: 6px; }
      .dsd-conversation-plan a { font-weight: 700; }
    `}</style>
  </section>;
}
