import { SELF_DIRECTED_COURSES } from "@/lib/content/self-directed";
import { SelfDirectedContinue } from "@/components/self-directed-continue";
import Link from "@/components/app-link";
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
import { AskHistoryNote } from "@/components/ask-history-note";

export const metadata: Metadata = { title: "My Work" };

export default async function MyWorkPage({ searchParams }: { searchParams?: Promise<{ view?: string }> }) {
  const scope = await requestedContentScope();
  const surface = await prepareEditableSurface("my-work.page");
  const copy = surface.values;
  if (!surface.canEdit && (await searchParams)?.view !== "workspace") return <EditableSurfaceRegion surface={surface} className="pilot-topic">
    <header><h1>{stringValue(copy, "introTitle")}</h1><p>This page is for staff of the Disability Services Division (DSD). Use it to return to a plan, a reflection, or learning you want to continue.</p></header>
    <section aria-labelledby="pilot-work">
      <h2 id="pilot-work">Put learning to work: plans, reflections, and decision records</h2>
      <ul className="pilot-topic-rows">
        <li><Link href="/my-work/action-plan"><strong>Your action plans</strong><span>Choose one change to try and a date to look back.</span></Link></li>
        <li><Link href="/my-work/plan"><strong>Your practice plans</strong><span>Keep a separate plan for each piece of work.</span></Link></li>
        <li><Link href="/my-work/reflections"><strong>Your reflection notebook</strong><span>Write what happened and what you learned.</span></Link></li>
        <li><Link href="/my-work/decision-records"><strong>Decision records</strong><span>Write down why a decision was made.</span></Link></li>
        <li><Link href="/my-work?view=workspace"><strong>Your saved work and learning</strong><span>Open your saved resources, course progress, and other tools in one place.</span></Link></li>
      </ul>
    </section>
  </EditableSurfaceRegion>;
  return (
    <EditableSurfaceRegion surface={surface}>
      <PageIntro
        kicker={stringValue(copy, "introKicker")}
        title={stringValue(copy, "introTitle")}
        lede="Everything you choose to keep lives here: the resources you saved, the plans you are working on, your reflection, and the courses you left off in. It stays on this computer, private to you."
      />
      <div className="wrap space-y-6 py-8">
        <Link href="/my-work">Back to My Work</Link>
        <ExplainerVideo id="learning-journey" />
        <section aria-labelledby="put-to-work-title">
          <h2 id="put-to-work-title" className="text-2xl font-bold">Put learning to work: plans, reflections, and team kits</h2>
          <ul className="calm-choices">
            <li><Link className="calm-choice" href="/my-work/action-plan"><h3>Your action plans</h3><p>Pick one change to try. Name a first step and set a thirty-day look back.</p></Link></li>
            <li><Link className="calm-choice" href="/my-work/reflections"><h3>Your reflection notebook</h3><p>Write a few lines on what happened, why it matters, and what you will do next. Add a date to look back.</p></Link></li>
            <li><Link className="calm-choice" href="/my-work/decision-records"><h3>Decision records</h3><p>Write down why an important decision was made. You can share one with the team space if you choose.</p></Link></li>
            <li><Link className="calm-choice" href="/growth"><h3>Growth paths</h3><p>Three stages, start, apply, and lead, suggested by role.</p></Link></li>
            <li><Link className="calm-choice" href="/team-kits"><h3>Team kits</h3><p>Run a thirty-minute book discussion or a twenty-minute practice case at a staff meeting.</p></Link></li>
          </ul>
        </section>
        <MyPath />
        <DsdSavedResourceShelf />
        <SavedDecisionLinks />
        <SelfDirectedContinue courses={SELF_DIRECTED_COURSES.map(({number,title})=>({number,title}))} />
        <div className="dsd-work-grid">
        <section className="dsd-work-card" aria-labelledby="practice-plan-title">
          <p className="dsd-eyebrow">Prepare a next step</p>
          <h2 id="practice-plan-title">Your practice plans: turn a decision into a next step</h2>
          <p>A practice plan turns a decision into something you can act on and review. It records who is affected, what the evidence shows, which options are on the table, and what you will do next.</p>
          <p>Keep a separate plan for each piece of work. Any analysis you save from the Toolkit is kept alongside it.</p>
          <Link href="/my-work/plan">Open your practice plans</Link>
        </section>
        <section className="dsd-work-card" aria-labelledby="practice-reflection-title">
          <p className="dsd-eyebrow">Learn from experience</p>
          <h2 id="practice-reflection-title" className="text-2xl font-bold">Your reflection: learn from what you tried</h2>
          <p className="my-3">The most useful learning often comes after the fact. Return to the change you tried, note what you saw, and decide what to keep or do differently next time.</p>
          <p className="my-3">You can download your reflection whenever you like.</p>
          <Link href="/program/reflection">Open your reflection</Link>
        </section>
        <AskHistoryNote />
        </div>
        {scope === "dsd" ? <section className="rounded-xl border border-line bg-white p-6" aria-labelledby="goal-work-plan-title">
          <h2 id="goal-work-plan-title" className="text-2xl font-bold">Supervisors and managers: plan around three of the six equity goals</h2>
          <p className="my-3">The six goals come from ADSA, the Aging and Disability Services Administration. If you supervise or manage, you can choose three as planning priorities, name the actions and support each one needs, and download a work plan for review.</p>
          <p className="my-3">All six goals stay in view. Choosing priorities does not set aside any policy responsibility.</p>
          <p className="flex flex-wrap gap-3"><Link className="btn btn--primary" href="/learn/equity-toolkit/goals#equity-work-plan">Prepare your three-goal work plan</Link><Link className="btn btn--light" href="/leading">For leaders, supervisors, managers, and directors</Link></p>
        </section> : null}
        <StaffWorkBrowse scope={scope} />
        <ParticipationNotice surface="my_work" />
      </div>
    </EditableSurfaceRegion>
  );
}
