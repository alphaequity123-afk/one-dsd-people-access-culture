import styles from "../toolkit-layout.module.css";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { EquityToolkitWorkedExample } from "@/components/equity-toolkit-worked-example";
import { DecisionWorkspace } from "@/components/decision-workspace";
import { EquityToolkitExperience } from "@/components/equity-toolkit-experience";
import { PageContents } from "@/components/page-contents";
import { requestedContentScope } from "@/lib/product/request-context";
import { linkListValue, stringValue } from "@/lib/content/staff-surface-registry";
import { culturalIntelligenceHubAvailable } from "@/lib/content/cultural-intelligence-publication";
import { ToolDecisionQuestions } from "@/components/tool-decision-questions";
import Link from "next/link";

export const metadata = { title: "Practice with the Equity Analysis Toolkit" };

export default async function ToolkitPracticePage() {
  const scope = await requestedContentScope();
  const [surface, connections, decisionSurface, culturalIntelligenceAvailable] = await Promise.all([
    prepareEditableSurface("equity-toolkit.home", { scope }),
    prepareEditableSurface("community-connections.home", { scope, includeOwner: false }),
    prepareEditableSurface("equity-toolkit.decision", { scope }),
    culturalIntelligenceHubAvailable(scope),
  ]);
  const text = (key: string) => stringValue(surface.values, key);
  return <EditableSurfaceRegion surface={surface}>
    <div className={styles.page}>
      <header className={styles.intro}>
        <Link href="/learn/equity-toolkit">← Equity Analysis Toolkit</Link>
        <h1>Practice with the Equity Analysis Toolkit</h1>
        <p>Explore an example, or work through a question of your own. Keep your analysis, useful resources, and next steps together.</p>
        <nav className={styles.starts} aria-label="Choose where to begin">
          <div><Link href="#toolkit-draft">Work through your decision →</Link><p>Start with a question and save your notes in My Work when you are ready.</p></div>
          <div><Link href="#worked-example">Watch the example →</Link><p>See how an analysis takes shape before trying it yourself.</p></div>
        </nav>
      </header>
      <PageContents items={[
        { href: "#worked-example", label: "Watch the worked example" },
        { href: "#toolkit-practice", label: "Try a practice decision" },
        { href: "#toolkit-draft", label: "Prepare your own analysis" },
        { href: "#toolkit-resources", label: "Supporting resources" },
      ]}>
        <EquityToolkitWorkedExample />
        <EquityToolkitExperience values={surface.values} renderDraft={false} scope={scope} />
        <EditableSurfaceRegion surface={decisionSurface}><ToolDecisionQuestions tool="equity-toolkit-practice" /><DecisionWorkspace values={decisionSurface.values} scope={scope} /></EditableSurfaceRegion>
        {connections.available ? <aside className="space-y-3 border-t border-line pt-6"><h2 className="text-2xl font-semibold"><Link href="/learn/community-connections">{stringValue(connections.values, "title")}</Link></h2><p>{stringValue(connections.values, "intro")}</p></aside> : null}
        <section id="toolkit-resources" className={`${styles.section} ${styles.support} print:hidden`}>
          <h2>{text("resourcesTitle")}</h2>
          <p>{text("resourcesIntro")}</p>
          <p>{text("resourceIntro")}</p>
          <ul className="space-y-3">{linkListValue(surface.values, "supportingResources").map(link => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul>
          {surface.available && decisionSurface.available && culturalIntelligenceAvailable && <p><Link href="/learn/cultural-intelligence">Explore community context for your decision</Link></p>}
        </section>
      <section className={styles.section}><h2>Consider the experience of using a service</h2><p>Use a practice service notice to explore how reading, accessible design and equity analysis can inform the same decision.</p><Link href="/learn/readings/practice/service-notice">Explore the reading and practice example →</Link></section>
      </PageContents>
    </div>
  </EditableSurfaceRegion>;
}
