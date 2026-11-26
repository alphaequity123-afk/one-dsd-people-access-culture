import Image from "next/image";
import Link from "@/components/app-link";
import { LivePage } from "@/components/dsd-live/live-page";
import { EquityIntroductionPractice } from "@/components/dsd-live/equity-introduction-practice";
import "./equity.css";

export const metadata = { title: "Begin with equity" };
const values = [
  ["Dignity", "Treat people as people with knowledge, preferences, and choices.", "Address the person with a disability directly. Ask how they want to communicate and who they want involved."],
  ["Fairness", "Examine how a decision affects people with different circumstances.", "Examine whether a DSD form, assessment or hiring step measures what matters or creates an avoidable barrier."],
  ["Access", "Make it possible for people to understand, participate, and use what is offered.", "Plan accessible documents, interpretation, captions, usable systems and alternatives for people who cannot use a digital channel."],
  ["Belonging", "Create conditions where people can contribute and be taken seriously.", "Include colleagues and community members with disabilities in decisions, training and leadership opportunities."],
  ["Accountability", "Follow through, explain decisions, and learn from their effects.", "Name who will remove a barrier, check whether people can use the change, and explain what happened to their feedback."],
];
export default function EquityIntroduction() {
  return <LivePage><div className="equity-introduction">
    <div className="shell"><p className="crumbs"><Link href="/home">One DSD</Link> / Begin with equity</p></div>
    <header className="equity-intro-hero shell">
      <div><p className="equity-eyebrow">A starting point for everyone</p><h1>Equity begins in everyday practice.</h1><p className="equity-lede">In the Disability Services Division, equity takes shape in a service decision, a conversation about work, an accessible document and the opportunities we offer colleagues. Start with five values, then practise applying them to the lives and choices of people with disabilities.</p><a className="button" href="#understand-equity">Begin the introduction</a><p className="meta">Read at your own pace. The reflection is optional.</p></div>
      <Image src="/images/home/people-access-culture-hero.webp" width={3840} height={1748} sizes="(min-width: 850px) 48vw, 100vw" priority alt="Colleagues sharing perspectives around a conference table." />
    </header>
    <div className="shell equity-intro-body">
      <nav className="equity-jump-links" aria-label="In this introduction"><a href="#understand-equity">Understand equity</a><a href="#values">Put values into practice</a><a href="#try-it">Try a situation</a><a href="#your-next-step">Choose a next step</a></nav>
      <section id="understand-equity"><h2>An opportunity needs to be usable</h2><p>Imagine someone receives information about a job they would like to pursue. The application is online, but they cannot complete it with their assistive technology. The opportunity exists; the path to it is still closed.</p><p>Equity asks us to notice that difference and respond. In DSD, that may mean changing a form, making room for someone to communicate in their own way or asking whether a service decision reflects the person’s goals. We begin by listening, then examine the process that created the barrier and what we can do to improve it.</p><aside className="equity-note"><h3>A question to carry into a conversation</h3><p>“What would make it possible for you to take part, and what are we missing?”</p></aside></section>
      <section id="values"><h2>Five values to guide the work</h2><p>These values can help you reflect, talk through a decision and decide what to do next.</p><ul className="equity-values">{values.map(([name, meaning, action], i) => <li key={name}><span className="equity-value-number" aria-hidden="true">0{i + 1}</span><h3>{name}</h3><p>{meaning}</p><p className="equity-value-action">{action}</p></li>)}</ul></section>
      <EquityIntroductionPractice />
    </div>
  </div></LivePage>;
}
