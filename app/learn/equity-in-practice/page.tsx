
import { SourceLink } from "@/components/app-link";
import type { Metadata } from "next";
import { ResourceDownloads } from "@/components/resource-downloads";
import Link from "@/components/app-link";
import styles from "./equity-in-practice.module.css";
import SequenceVideo from "./sequence-video";
import { CourseMediaSlot } from "@/components/course-media-for-page";
import { FeaturedMediaPanel } from "@/components/featured-media-panel";
import media from "@/lib/program/equity-video-media.json";
import { EQUITY_IN_PRACTICE_EXAMPLES, EQUITY_IN_PRACTICE_POLICY_LINKS } from "@/lib/content/learn-page-copy";

export const metadata: Metadata = { title: "People, Access and Culture in Practice", description: "Understand the Equity Outcome Map and explore DSD examples connecting ADSA goals with practical learning and resources." };

const examples = EQUITY_IN_PRACTICE_EXAMPLES;

export default function EquityInPracticePage() {
  return <article className={styles.page}><div className={styles.content}>
    <p className={styles.back}><Link href="/learn">Learn</Link></p>
    <header className={styles.intro}><p className={styles.eyebrow}>People, Access and Culture</p><h1>From shared purpose to everyday work.</h1><p className={styles.lede}>Begin with the Equity Outcome Map. Then follow examples from disability services to see how people, decisions, and practical resources connect.</p><p>Use the DSD examples to connect the six Aging and Disability Services Administration goals with your responsibilities, relevant learning, and the resources already available in One DSD.</p></header>
    <FeaturedMediaPanel kind="video"><section id="understand-the-map" className={styles.videoSection} aria-labelledby="map-title">
      <p className={styles.eyebrow}>Part one · Understand the map</p><h2 id="map-title">Equity Outcome Map</h2><p className={styles.videoDescription}>Explore the shared direction for equity work across the Department of Human Services, the intended outcomes, and why everyday decisions matter.</p><p className={styles.runtime}>{media.foundation.runtime}</p>
      <SequenceVideo className={styles.player} src={media.foundation.src} poster={media.foundation.poster} title="Equity Outcome Map" />
      <p className={styles.next}><SourceLink href="#put-it-into-practice">Continue to the DSD example</SourceLink></p>
    </section></FeaturedMediaPanel>
    <FeaturedMediaPanel kind="video"><section id="put-it-into-practice" className={styles.videoSection} aria-labelledby="practice-title">
      <p className={styles.eyebrow}>Part two · Put it into practice</p><h2 id="practice-title">People, Access and Culture in Practice: A Disability Services Division Example</h2><p className={styles.videoDescription}>Follow four situations in Disability Services Division work. See how the six Aging and Disability Services Administration goals, policy, learning, and practical tools can help a team examine a decision and its effects.</p><p className={styles.runtime}>{media.companion.runtime}</p>
      <SequenceVideo className={styles.player} src={media.companion.src} poster={media.companion.poster} title="People, Access and Culture in Practice: A Disability Services Division Example" />
    </section></FeaturedMediaPanel>
    {/* Published listening for this page follows the two videos, before the examples and downloads. */}
    <CourseMediaSlot />
    <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share this page</summary><ResourceDownloads kind="learn-page" id="equity-in-practice" noun="lesson" /></details>
    <aside className={styles.connection}><p>The Outcome Map describes intended outcomes. The six implementation goals belong to the Aging and Disability Services Administration. The Disability Services Division situations are illustrative examples that other teams can adapt to their responsibilities and applicable goals.</p></aside>
    <section aria-labelledby="examples-title"><p className={styles.eyebrow}>Bring the learning into your work</p><h2 id="examples-title">Choose the example that connects with your work.</h2><p className={styles.videoDescription}>The links below open existing guidance, learning, and practical tools. Begin with a real question, use the resources that fit, and involve the people whose experience can help.</p>
      <div className={styles.examples}>{examples.map(example => <section key={example.id} id={example.id} className={styles.example}><h3>{example.title}</h3><p className={styles.situation}>{example.situation}</p><p>{example.action}</p><p className={styles.goals}><strong>ADSA goals:</strong> {example.goals}</p><ul className={styles.resourceList}>{example.links.map(link => <li key={link.href}><Link href={link.href}>{link.title}</Link><span>{link.use}</span></li>)}</ul><p className={styles.lookFor}>{example.evidence}</p></section>)}</div>
    </section>
    <section className={styles.footer} aria-labelledby="policy-title"><h2 id="policy-title">When the question involves policy or legislation</h2><p>Distinguish a proposed change, enacted law, and current program guidance. Clarify who could be affected and which choices remain open. Separate the source policy or legislation from analysis, learning, and recommendations.</p><ul className={styles.resourceList}>{EQUITY_IN_PRACTICE_POLICY_LINKS.map(link => <li key={link.href}><Link href={link.href}>{link.title}</Link><span>{link.use}</span></li>)}</ul></section>
    <section className={styles.footer} aria-labelledby="next-title"><h2 id="next-title">Start with one useful next step.</h2><p>Choose a decision or piece of work. Name a barrier worth examining, involve relevant perspectives, and use one resource to develop a possible improvement. Ask what would tell you whether it helped, for whom, and what still needs attention.</p><p>Directors, managers, supervisors, and staff contribute through their responsibilities, knowledge, and relationships. These resources support preparation and learning; decisions remain with the people or areas responsible.</p><nav aria-label="Continue into practice"><Link href="/learn/equity-toolkit/goals">Explore the six Aging and Disability Services Administration goals</Link><Link href="/program/implementation">Connect goals to implementation</Link><Link href="/practice/measurement">Consider evidence of progress</Link></nav></section>
  </div></article>;
}
