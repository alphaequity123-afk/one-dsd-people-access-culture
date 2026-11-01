import { SELF_DIRECTED_COURSES } from "@/lib/content/self-directed";
import { SelfDirectedContinue } from "@/components/self-directed-continue";
import Link from "next/link";
import type { Metadata } from "next";
import { requestedContentScope } from "@/lib/product/request-context";
import { StaffWorkBrowse } from "@/components/staff-work-browse";
import { PageIntro } from "@/components/ui";
import { ParticipationNotice } from "@/components/participation-notice";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { stringValue } from "@/lib/content/staff-surface-registry";
import { DsdSavedResourceShelf } from "@/components/dsd-workspace";
import { SavedDecisionLinks } from "@/components/dsd-practice-planner-editor";
import { MyPath } from "@/components/my-path";
import { ExplainerVideo } from "@/components/explainer-video";

export const metadata: Metadata = { title: "My Work" };

export default async function MyWorkPage() {
  const scope = await requestedContentScope();
  const surface = await prepareEditableSurface("my-work.page");
  const copy = surface.values;
  return (
    <EditableSurfaceRegion surface={surface}>
      <PageIntro
        kicker={stringValue(copy, "introKicker")}
        title={stringValue(copy, "introTitle")}
        lede="Everything you choose to keep lives here: the resources you saved, the plans you are working on, your reflection, and the courses you left off in. It stays on this computer, private to you."
      />
      <div className="wrap space-y-6 py-8">
        <MyPath />
        <ExplainerVideo id="learning-journey" />
        <DsdSavedResourceShelf />
        <SavedDecisionLinks />
        <SelfDirectedContinue courses={SELF_DIRECTED_COURSES.map(({number,title})=>({number,title}))} />
        <div className="dsd-work-grid">
        <section className="dsd-work-card" aria-labelledby="practice-plan-title">
          <p className="dsd-eyebrow">Prepare a next step</p>
          <h2 id="practice-plan-title">Your practice plans</h2>
          <p>A practice plan turns a decision into something you can act on and review: who is affected, what the evidence shows, which options are on the table, and what you will do next. Keep a separate plan for each piece of work. Any analysis you save from the Toolkit is kept alongside it.</p>
          <Link href="/my-work/plan">Open your practice plans →</Link>
        </section>
        <section className="dsd-work-card" aria-labelledby="practice-reflection-title">
          <p className="dsd-eyebrow">Learn from experience</p>
          <h2 id="practice-reflection-title" className="text-2xl font-bold">Your reflection</h2>
          <p className="my-3">The most useful learning often comes after the fact. Return to the change you tried, note what you observed, and decide what you would keep or do differently next time. You can download it whenever you like.</p>
          <Link href="/program/reflection">Open your reflection →</Link>
        </section>
        </div>
        {scope === "dsd" ? <section className="rounded-xl border border-line bg-white p-6" aria-labelledby="goal-work-plan-title">
          <h2 id="goal-work-plan-title" className="text-2xl font-bold">Connect your work to the six equity goals</h2>
          <p className="my-3">If you supervise or manage, you can choose three of the six ADSA equity goals as planning priorities, name the actions and support each one needs, and download a work plan for review. All six goals stay in view; choosing priorities does not set aside any policy responsibility.</p>
          <p className="flex flex-wrap gap-3"><Link className="btn btn--primary" href="/learn/equity-toolkit/goals#equity-work-plan">Prepare your three-goal work plan</Link><Link className="btn btn--light" href="/leading">For supervisors and managers</Link></p>
        </section> : null}
        <StaffWorkBrowse scope={scope} />
        <ParticipationNotice surface="my_work" />
      </div>
    </EditableSurfaceRegion>
  );
}
