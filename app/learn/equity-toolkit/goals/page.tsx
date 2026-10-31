import styles from "../../learning-family.module.css";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { EquityGoalExperience } from "@/components/equity-goal-experience";
import { loadStaffContentSnapshot } from "@/lib/content/staff-publications";
import goalModel from "@/lib/program/equity-goals.json";
import { requestedContentScope } from "@/lib/product/request-context";
import Link from "next/link";

export const metadata = { title: "Six equity goals and work plan" };
const goalResourceIds = new Set(goalModel.goals.flatMap(goal => goal.resources.map(resource => resource.id)));

export default async function ToolkitGoalsPage() {
  const scope = await requestedContentScope();
  const [surface, snapshot] = await Promise.all([
    prepareEditableSurface("equity-toolkit.home", { scope }),
    loadStaffContentSnapshot({ scope }),
  ]);
  return <EditableSurfaceRegion surface={surface}>
    <div className={`${styles.page} ${styles.content} ${styles.readingPage} space-y-10`}>
      <header className="space-y-4">
        <Link href="/learn/equity-toolkit">← Toolkit introduction and podcast</Link>
        <h1 className="text-4xl font-semibold">ADSA six goals and work plan</h1>
        <p className="max-w-3xl text-xl">Explore the Aging and Disability Services Administration’s six equity goals, find related resources, and prepare a three-goal work plan where this implementation plan applies.</p>
      <p className="max-w-3xl">These are ADSA goals, not an agency-wide requirement to choose three goals. DHS staff outside ADSA can learn from this example while confirming their own applicable priorities, requirements and decision authority. The program constitution governs how this resource supports the whole One DSD program.</p>
      </header>
      <p><Link href="/learn/equity-in-practice#put-it-into-practice">See the goals in a DSD video example →</Link></p>
      <EquityGoalExperience scope={scope} resourceLinks={snapshot.items.filter(item => item.status === "approved" && goalResourceIds.has(item.id)).map(item => ({ id: item.id, title: item.title, href: `/library/${encodeURIComponent(item.id)}` }))} />
      <nav aria-label="Continue the toolkit" className="flex flex-wrap items-center gap-5 border-t border-line pt-8 print:hidden">
        <Link className={styles.primaryAction} href="/learn/equity-toolkit/apply">Apply this to your work →</Link>
        <Link href="/learn/equity-toolkit/practice">Continue to practice with the toolkit →</Link>
      </nav>
    </div>
  </EditableSurfaceRegion>;
}
