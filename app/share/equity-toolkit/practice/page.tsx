import styles from "../../../learn/learning-family.module.css";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { DecisionWorkspace } from "@/components/decision-workspace";
import { EquityToolkitExperience } from "@/components/equity-toolkit-experience";
import { linkListValue, stringValue } from "@/lib/content/staff-surface-registry";
import { requestedContentScope } from "@/lib/product/request-context";
import Link from "next/link";

export const metadata = { title: "Practice with the Equity Analysis Toolkit" };
export const dynamic = "force-dynamic";

export default async function SharedToolkitPracticePage() {
  const scope = await requestedContentScope();
  const [surface, decisionSurface] = await Promise.all([
    prepareEditableSurface("equity-toolkit.home", { scope, includeOwner: false }),
    prepareEditableSurface("equity-toolkit.decision", { scope, includeOwner: false }),
  ]);
  const text = (key: string) => stringValue(surface.values, key);
  return <EditableSurfaceRegion surface={surface}>
    <div className={`${styles.page} ${styles.content} ${styles.readingPage} space-y-10`}>
      <header className="space-y-4">
        <Link href="/share/equity-toolkit">Podcast and toolkit introduction</Link>
        <h1 className="text-4xl font-semibold">Practice with the Equity Analysis Toolkit</h1>
        <p className="max-w-3xl text-xl">Explore a decision and prepare notes for a conversation with the people responsible.</p>
      </header>
      <EquityToolkitExperience values={surface.values} renderDraft={false} scope={scope} />
      <EditableSurfaceRegion surface={decisionSurface}><DecisionWorkspace values={decisionSurface.values} scope={scope} /></EditableSurfaceRegion>
      <section id="toolkit-resources" className="space-y-4 border-t border-line pt-8 print:hidden">
        <h2 className="text-2xl font-semibold">{text("resourcesTitle")}</h2>
        <p>{text("resourcesIntro")}</p>
        <p className="max-w-3xl">{text("resourceIntro")}</p>
        <ul className="list-disc space-y-3 pl-6">{linkListValue(surface.values, "supportingResources").map(link => (
          <li key={link.href}><Link href={link.href}>{link.label}</Link></li>
        ))}</ul>
        <p className={styles.shareNote}>You can open related resources and return to your saved analysis through My Work.</p>
      </section>
    </div>
  </EditableSurfaceRegion>;
}
