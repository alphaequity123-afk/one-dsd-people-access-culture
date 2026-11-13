import styles from "../toolkit-layout.module.css";
import { ResourceDownloads } from "@/components/resource-downloads";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { EquityToolkitWorkedExample } from "@/components/equity-toolkit-worked-example";
import { DecisionWorkspace } from "@/components/decision-workspace";
import { EquityToolkitExperience } from "@/components/equity-toolkit-experience";
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
    <div className={`${styles.page} pilot-reading-width`}>
      <header className={styles.intro}>
        <Link href="/learn/equity-toolkit">Equity Analysis Toolkit</Link>
        <h1>Practice with the Equity Analysis Toolkit</h1>
        <p>Explore an example, or work through a question of your own. Keep your analysis, useful resources, and next steps together.</p>
        {surface.available ? <details className="border-b border-line pb-3 print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[#183247]">Download or share the toolkit</summary><ResourceDownloads kind="equity-toolkit" id="companion" noun="toolkit" scope={scope} /></details> : null}
      </header>
      <details className="pilot-supporting">
        <summary>Watch the worked example</summary>
        <div className="pilot-supporting-body"><EquityToolkitWorkedExample /></div>
      </details>
      <details className="pilot-supporting">
        <summary>Try a practice decision</summary>
        <div className="pilot-supporting-body"><EquityToolkitExperience values={surface.values} renderDraft={false} scope={scope} /></div>
      </details>
      <details className="pilot-supporting">
        <summary>Work through your decision</summary>
        <div className="pilot-supporting-body">
          <EditableSurfaceRegion surface={decisionSurface}>
            <ToolDecisionQuestions tool="equity-toolkit-practice" />
            <DecisionWorkspace values={decisionSurface.values} scope={scope} />
          </EditableSurfaceRegion>
        </div>
      </details>
      <details id="toolkit-resources" className="pilot-supporting print:hidden">
        <summary>{text("resourcesTitle")}</summary>
        <div className="pilot-supporting-body space-y-4">
          {connections.available ? <aside><h2 className="text-lg"><Link href="/learn/community-connections">{stringValue(connections.values, "title")}</Link></h2><p>{stringValue(connections.values, "intro")}</p></aside> : null}
          <p>{text("resourcesIntro")}</p>
          <p>{text("resourceIntro")}</p>
          <ul className="space-y-3">{linkListValue(surface.values, "supportingResources").map(link => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul>
          {surface.available && decisionSurface.available && culturalIntelligenceAvailable && <p><Link href="/learn/cultural-intelligence">Explore community context for your decision</Link></p>}
          <p><Link href="/learn/readings/practice/service-notice">Explore the reading and practice service notice</Link></p>
        </div>
      </details>
    </div>
  </EditableSurfaceRegion>;
}
