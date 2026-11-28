"use client";

import { useId, useState } from "react";
import Link from "@/components/app-link";
import { HomeAsk } from "@/components/home-ask";
import type { EditableSurfaceValues } from "@/lib/content/editable-surface-contract";

/**
 * The Home command center (v2 prototype, owner decision 2026-11-26): Ask, Search and Review a draft in one place,
 * where the landing page's task buttons used to be. It uses this application's own Ask, site search and draft review.
 * The tabs follow the WAI-ARIA tabs pattern: arrow keys move between them, and only the chosen panel is shown.
 */
type Tab = "ask" | "search" | "review";
const TABS: { id: Tab; label: string }[] = [
  { id: "ask", label: "Ask" },
  { id: "search", label: "Search" },
  { id: "review", label: "Review a draft" },
];
/** Example questions from the prototype, worded as a person would ask them. Each opens Ask with the question filled in. */
const EXAMPLES = [
  { label: "Plan an accessible listening session", question: "How do I plan an accessible community listening session?" },
  { label: "When does an equity analysis apply?", question: "When does a decision need an equity analysis under the DHS Equity Policy?" },
  { label: "Accommodations and access", question: "Where do I go with a question about a reasonable accommodation or ADA access?" },
  { label: "Plan a legislative working group", question: "How do I plan a legislatively required working group?" },
];

export function HomeCommandCenter({ copy, askAvailable, researchAvailable }: { copy: EditableSurfaceValues; askAvailable: boolean; researchAvailable: boolean }) {
  const [tab, setTab] = useState<Tab>("ask");
  const id = useId();
  function onKey(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1 : (index + step + TABS.length) % TABS.length;
    setTab(TABS[next].id);
    document.getElementById(`${id}-tab-${TABS[next].id}`)?.focus();
  }
  return <section className="pilot-section home-command" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>What do you need today?</h2>
    <p className="home-command-lede">Ask a question in your own words, search everything in the program, or get feedback on a draft before it goes out.</p>
    <div className="home-command-tabs" role="tablist" aria-label="Ask, search or review a draft">
      {TABS.map((item, index) => <button key={item.id} id={`${id}-tab-${item.id}`} type="button" role="tab" aria-selected={tab === item.id} aria-controls={`${id}-panel-${item.id}`} tabIndex={tab === item.id ? 0 : -1} className={tab === item.id ? "is-chosen" : undefined} onClick={() => setTab(item.id)} onKeyDown={event => onKey(event, index)}>{item.label}</button>)}
    </div>

    <div id={`${id}-panel-ask`} role="tabpanel" aria-labelledby={`${id}-tab-ask`} hidden={tab !== "ask"} className="home-command-panel">
      {askAvailable ? <HomeAsk copy={copy} researchAvailable={researchAvailable} /> : <p><Link href="/ask">Open Ask</Link> to ask a question in your own words.</p>}
      <p className="home-command-examples-title">Or start from an example</p>
      <ul className="home-command-examples">{EXAMPLES.map(example => <li key={example.label}><Link href={`/ask?q=${encodeURIComponent(example.question)}`}>{example.label}</Link></li>)}</ul>
    </div>

    <div id={`${id}-panel-search`} role="tabpanel" aria-labelledby={`${id}-tab-search`} hidden={tab !== "search"} className="home-command-panel">
      <form action="/search" method="get" role="search" className="home-command-search">
        <label htmlFor={`${id}-q`}>Search courses, tools, community briefs and guides</label>
        <div><input id={`${id}-q`} name="q" type="search" autoComplete="off" placeholder="For example: plain language, Connect 700, listening session" /><button type="submit" className="pilot-primary">Search</button></div>
      </form>
    </div>

    <div id={`${id}-panel-review`} role="tabpanel" aria-labelledby={`${id}-tab-review`} hidden={tab !== "review"} className="home-command-panel">
      <p>Paste or attach a public or de-identified draft, such as a notice, letter or request for proposals. Ask reviews it for plain language, access and the questions in the DHS equity analysis, and suggests rewrites you can use.</p>
      <p>Please leave out names, case details and anything private before you share a draft.</p>
      <p><Link className="pilot-primary" href="/ask?mode=review">Review a draft</Link></p>
    </div>
  </section>;
}
