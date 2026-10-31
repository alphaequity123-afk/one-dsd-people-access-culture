import { EngagementResourceLinks } from "@/components/engagement-resource-links";
import styles from "./toolkit-layout.module.css";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { ResourceDownloads } from "@/components/resource-downloads";
import { PageContents } from "@/components/page-contents";
import { EquityAnalysisLadder } from "@/components/equity-analysis-ladder";
import { requestedContentScope } from "@/lib/product/request-context";
import Link from "next/link";
import { PODCASTS } from "@/lib/content/podcasts";
import { stringValue } from "@/lib/content/staff-surface-registry";
import { culturalIntelligenceHubAvailable } from "@/lib/content/cultural-intelligence-publication";
import { ToolDecisionQuestions } from "@/components/tool-decision-questions";

export const metadata = { title: "Equity analysis for your work" };

const resources = [
  { title: "Connect an analysis with applicable requirements", href: "/practice/requirements", description: "Use the requirements crosswalk to distinguish the program constitution, published policy, service standards and local implementation priorities. Record what applies, what needs confirmation and who can authorize a decision." },
  { title: "See the toolkit in everyday work", href: "/learn/equity-in-practice", description: "Follow DSD examples connecting the Equity Outcome Map and ADSA goals with a service notice, support planning, contracting, and workforce learning." },
  { title: "Examine barriers in a process", href: "/equity-review/structural", description: "Use the structural analysis workspace to map decision points, examine requirements and responsibilities, and turn evidence into an action with an owner and a review date." },
  { title: "Plan cultural and language access", href: "/practice/clas", description: "Use the National CLAS Standards to prepare service-specific actions, distinguish requirements to confirm, and identify the people responsible and ways to learn from the change." },
  { title: "Equity analysis for policy review", href: "/learn/equity-toolkit/policy-review", description: "Use the One DSD presentation to explore equity analysis in policy work. Read the slides here or download a copy for a team discussion." },
];

export default async function Page() {
  const scope = await requestedContentScope();
  const [surface, podcastSurface, culturalIntelligenceAvailable] = await Promise.all([
    prepareEditableSurface("equity-toolkit.home", { scope }),
    prepareEditableSurface(PODCASTS[0].surfaceId, { scope }),
    culturalIntelligenceHubAvailable(scope),
  ]);
  const text = (key: string) => stringValue(surface.values, key);
  return <EditableSurfaceRegion surface={surface}>
    <div className={styles.page}>
      <header className={styles.intro}>
        <Link href="/learn">{text("backLabel")}</Link>
        <h1>{text("title")}</h1>
        <p>{text("intro")}</p>
        <nav className={styles.starts} aria-label="Start with the toolkit">
          <div><Link href="/learn/equity-toolkit/practice#worked-example">Watch the worked example →</Link><p>Follow a practice CFSS notice revision, see the completed notes, and try a different decision.</p></div>
          <div><Link href="/learn/equity-toolkit/practice#toolkit-draft">Work through a decision →</Link><p>Choose a starting question, compare options, and save your analysis with a practice plan.</p></div>
        </nav>
        <p>Follow one decision through eight connected lessons, individual practice and working notes. <Link href="/learn/equity-toolkit/curriculum">Explore equity in everyday decisions →</Link></p>
      </header>
      <PageContents items={[
        { href: "#analysis-in-practice", label: "What an analysis reveals" },
        { href: "#supporting-tools", label: "Tools for your work" },
        { href: "#toolkit-podcast", label: "Listen to the companion" },
        { href: "#toolkit-context", label: "Goals and context" },
        { href: "#toolkit-downloads", label: "Download or share" },
      ]}>
        <EquityAnalysisLadder />
        <section id="analysis-in-practice" className={`${styles.section} ${styles.insight}`} aria-labelledby="analysis-in-practice-title">
          <p className={styles.exampleLabel}>A practice example</p>
          <h2 id="analysis-in-practice-title">A completed task is only part of the story</h2>
          <p>A team revising a service notice needs to know whether people can understand it and act on it. The toolkit helps connect that question to evidence, possible barriers and a better-supported choice.</p>
          <div className={styles.contrast}>
            <div><h3>What the record shows</h3><p>“The notice was sent.” This records an activity. It does not establish understanding or accessibility.</p></div>
            <div><h3>What the analysis still needs</h3><p>Whose next step is unclear? Which language or format barriers need attention? What do the people receiving the notice say would help?</p></div>
          </div>
          <details className={styles.reasoning}>
            <summary>Why the choice matters</summary>
            <p>A shorter notice can reduce reading effort, but removing an explanation may create confusion. Compare options against required content and people’s experience, state what the evidence does and does not establish, and identify what would show improvement after an authorized change.</p>
          </details>
          <p className={styles.nextStep}><Link href="/learn/equity-toolkit/practice#worked-example">See the reasoning in the worked example <span aria-hidden="true">→</span></Link></p>
        </section>
        <ToolDecisionQuestions tool="equity-toolkit" />
        <section id="supporting-tools" className={styles.section}>
          <h2>Choose the support your work needs</h2>
          <p>Use these resources alongside an analysis. Begin with the question you are working on; you can return to the others as needed.</p>
          <ul className={styles.resources}>{resources.map(resource => <li key={resource.href}>
            <h3><Link href={resource.href}>{resource.title} →</Link></h3>
            <p>{resource.description}</p>
          </li>)}</ul>
        </section>
        <EngagementResourceLinks />
        <div id="toolkit-podcast" className={styles.support}>
          {podcastSurface.available ? <><h2>{stringValue(podcastSurface.values, "title")}</h2><p>The companion podcast walks through the toolkit in conversation, with a full transcript. It plays in the audio library.</p><p><Link href={`/audio-library#podcast-${PODCASTS[0].id}`}>Listen to the companion podcast →</Link></p></> : null}
        </div>
        <section id="toolkit-context" className={`${styles.section} ${styles.support}`}>
          <h2>Connect the analysis with your wider work</h2>
          <p>The ADSA goals and work plan provide context for applying an analysis. They are available whenever useful; you can start the example or your own draft directly.</p>
          {culturalIntelligenceAvailable && <p><Link href="/learn/cultural-intelligence">Explore cultural context for your analysis →</Link></p>}
          <p><Link href="/learn/equity-toolkit/goals">ADSA six goals and work plan →</Link></p>
          <details><summary>About this companion</summary><p>{text("companionNote")}</p><p><Link href="/operationalizing-equity">Explore operationalizing equity in everyday work</Link></p></details>
        </section>
        <section id="toolkit-downloads" className={`${styles.section} ${styles.support} print:hidden`}>
          <h2>Download or share this toolkit</h2>
          <p><Link href="/share/equity-toolkit">Get a link to share this toolkit →</Link></p>
          <p>The shared link opens the Equity Analysis Toolkit on its own, so you can send it to someone without the rest of the program.</p>
          {surface.available ? <ResourceDownloads kind="equity-toolkit" id="companion" noun="toolkit" scope={scope} /> : null}
        </section>
        <nav aria-label="Continue the toolkit" className={`${styles.support} print:hidden`}><Link href="/learn/equity-toolkit/practice">Continue to practice and resources →</Link></nav>
      </PageContents>
    </div>
  </EditableSurfaceRegion>;
}
