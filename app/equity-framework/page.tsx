import { FocusedSections } from "@/components/focused-sections";

import { SourceLink } from "@/components/app-link";
import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PageIntro } from "@/components/ui";
import { ResourceDownloads } from "@/components/resource-downloads";
import { EQUITY_FRAMEWORK as F, TOOL_STATUS_LABEL, type FrameworkLink, type ToolStatus } from "@/lib/program/equity-framework";
import { programFunctions } from "@/lib/program/model";

export const metadata: Metadata = {
  title: "Equity Strategic Framework",
  description: "A proposed planning companion for People, Access and Culture: six practice pillars, an improvement cycle and practical resources.",
};

const STATUS_CLASS: Record<ToolStatus, string> = {
  in_program: "label-pill",
  partly_in_program: "label-pill",
  not_yet: "label-pill",
};

function Links({ links }: { links: readonly FrameworkLink[] }) {
  if (!links.length) return null;
  return <ul className="m-0 list-none space-y-1 p-0">{links.map((l) => <li key={l.href + l.label}><Link href={l.href}>{l.label}</Link></li>)}</ul>;
}

function Pairs({ rows, head }: { rows: ReadonlyArray<readonly [string, string]>; head: [string, string] }) {
  return (
    <div tabIndex={0} className="overflow-x-auto">
      <table className="data w-full min-w-[28rem] text-sm">
        <thead><tr><th scope="col">{head[0]}</th><th scope="col">{head[1]}</th></tr></thead>
        <tbody>{rows.map(([a, b]) => <tr key={a}><th scope="row" className="whitespace-nowrap align-top font-semibold">{a}</th><td>{b}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function Bullets({ items }: { items: readonly string[] }) {
  return <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{items.map((i) => <li key={i}>{i}</li>)}</ul>;
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="mt-0 scroll-mt-24 text-3xl font-bold">{children}</h2>;
}

const TOC = [
  ["cycle", "Put the improvement cycle into practice"],
  ["direction", "Vision, mission and values"],
  ["pillars", "Six pillars"],
  ["mapping", "Suggested connections across program functions"],
  ["measures", "How progress is measured"],
  ["stages", "Three stages with readiness conditions"],
  ["outcomes", "Expected outcomes"],
  ["tools", "Resource and tool suite"],
  ["library", "Resource library structure"],
  ["launch", "Minimum launch package"],
  ["notes", "Notes and bibliography"],
] as const;

// The root layout follows the program view (One DHS or One DSD), so this page renders per request.
export const dynamic = "force-dynamic";

export default function EquityFrameworkPage() {
  const functionsByPillar = new Map<string, string[]>();
  for (const p of F.pillars) for (const fn of p.programFunctions) functionsByPillar.set(fn, [...(functionsByPillar.get(fn) ?? []), p.title]);

  return (
    <>
      <PageIntro tone="business" kicker={F.kicker} title={F.title} lede={F.lede} />
      <div className="wrap max-w-6xl py-10 [&_p]:my-3"><FocusedSections>
        <section aria-labelledby="summary-title" className="mt-8 max-w-4xl">
          <H2 id="summary-title">What this framework is for</H2>
          <p className="text-lg leading-relaxed">{F.summary}</p><p className="mt-3"><Link href="/program-foundation">Read the proposed program charter</Link> or <Link href="/practice/requirements">connect source requirements to a piece of work</Link>.</p>
          <details className="mt-7 border-t border-line py-4">
            <summary className="cursor-pointer font-semibold">Download the framework in another format</summary>
            <div className="mt-4"><ResourceDownloads kind="equity-framework" id="framework" noun="framework" compact /></div>
          </details>
          <details className="border-y border-line py-4">
            <summary className="cursor-pointer font-semibold">How to read and browse this framework</summary>
            <div className="mt-5">
              <Bullets items={F.howToRead} />
              <nav aria-label="On this page" className="mt-5 border-t border-line pt-4">
                <p className="kicker m-0">On this page</p>
                <ol className="mt-2 grid list-decimal gap-x-8 gap-y-1 pl-5 text-sm sm:grid-cols-2">{TOC.map(([id, label]) => <li key={id}><SourceLink href={`#${id}`}>{label}</SourceLink></li>)}</ol>
              </nav>
            </div>
          </details>
        </section>

        <section aria-labelledby="cycle" className="mt-14">
          <H2 id="cycle">Put the improvement cycle into practice</H2>
          <p className="max-w-3xl">The framework runs as a continuous cycle: assess, plan, implement, measure, learn, improve. Each stage matches one step of the program’s value sequence,¹¹ and each stage names where the work happens in One DHS and in One DSD. Use evidence, readiness and the responsible decision-maker’s approval to plan the next stage, while meeting applicable deadlines.</p>
          <ol className="mt-4 flex flex-wrap gap-2 p-0 text-sm font-semibold" aria-label="Cycle stages">{F.cycle.map((c, i) => <li key={c.stage} className="list-none rounded-full border border-line bg-white px-3 py-1">{i + 1}. {c.stage}</li>)}</ol>
          <details className="mt-5 border-t border-line py-3"><summary>Explore the full cycle</summary>
          <div tabIndex={0} className="mt-4 overflow-x-auto rounded border border-line bg-white">
            <table className="data w-full min-w-[56rem] text-sm">
              <thead><tr><th scope="col">Stage</th><th scope="col">Question the stage answers</th><th scope="col">Program step</th><th scope="col">In One DHS</th><th scope="col">In One DSD</th></tr></thead>
              <tbody>{F.cycle.map((c) => (
                <tr key={c.stage} className="align-top">
                  <th scope="row" className="whitespace-nowrap font-semibold">{c.stage}</th>
                  <td>{c.question}</td>
                  <td>{c.programStep}</td>
                  <td><Links links={c.oneDhs} /></td>
                  <td><Links links={c.oneDsd} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          </details>
        </section>

        <section aria-labelledby="direction" className="mt-14">
          <H2 id="direction">Vision, mission and values</H2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div className="card min-w-0"><h3 className="m-0 text-xl font-bold">Vision</h3><p>{F.vision}</p></div>
            <div className="card min-w-0"><h3 className="m-0 text-xl font-bold">Mission</h3><p>{F.mission}</p></div>
          </div>
          <p className="max-w-3xl">{F.focus}</p>
          <details className="mt-5 border-t border-line py-3"><summary>Explore the core values in practice</summary>
          <div tabIndex={0} className="mt-4 overflow-x-auto rounded border border-line bg-white">
            <table className="data w-full min-w-[40rem] text-sm">
              <thead><tr><th scope="col">Core value</th><th scope="col">Strategic meaning</th><th scope="col">In practice</th></tr></thead>
              <tbody>{F.values.map((v) => <tr key={v.value} className="align-top"><th scope="row" className="font-semibold">{v.value}</th><td>{v.meaning}</td><td>{v.practice}</td></tr>)}</tbody>
            </table>
          </div>
          </details>
        </section>

        <section aria-labelledby="pillars" className="mt-14">
          <H2 id="pillars">Six pillars</H2>
          <p className="max-w-3xl">Each pillar connects objectives, suggested actions, sample measures and related program resources. Use those connections to examine how equity considerations enter everyday decisions, responsibilities and review.</p>
          <div className="mt-6 space-y-2">{F.pillars.map((p, i) => (
            <article key={p.id} id={`pillar-${p.id}`} aria-labelledby={`pillar-${p.id}-title`} className="min-w-0 scroll-mt-24 border-t border-line py-5">
              <p className="kicker m-0">Pillar {i + 1}</p>
              <h3 id={`pillar-${p.id}-title`} className="m-0 mt-1 text-2xl font-bold">{p.title}</h3>
              <p className="max-w-3xl">{p.purpose}</p>
              <details className="mt-4 rounded-lg border border-line bg-white px-5 py-3">
                <summary className="cursor-pointer font-semibold">Objectives, measures and related program work</summary>
                <div className="mt-5 grid gap-6 lg:grid-cols-3">
                  <div className="min-w-0"><h4 className="m-0 text-base font-bold">Strategic objectives</h4><Bullets items={p.objectives} /></div>
                  <div className="min-w-0"><h4 className="m-0 text-base font-bold">Key initiatives</h4><Bullets items={p.initiatives} /></div>
                  <div className="min-w-0"><h4 className="m-0 text-base font-bold">Sample measures</h4><Bullets items={p.measures} /></div>
                </div>
                <div className="mt-6 grid gap-6 border-t border-line pt-4 text-sm md:grid-cols-3">
                  <div className="min-w-0"><h4 className="m-0 text-base font-bold">Areas of work</h4><div className="mt-2"><Links links={p.workAreas} /></div></div>
                  <div className="min-w-0"><h4 className="m-0 text-base font-bold">In One DHS</h4><div className="mt-2"><Links links={p.oneDhs} /></div></div>
                  <div className="min-w-0"><h4 className="m-0 text-base font-bold">In One DSD</h4><div className="mt-2"><Links links={p.oneDsd} /></div></div>
                </div>
              </details>
            </article>
          ))}</div>
        </section>

        <section aria-labelledby="mapping" className="mt-14">
          <H2 id="mapping">Suggested connections across program functions</H2>
          <p className="max-w-3xl">The program’s thirteen functions,¹¹ each with its main page, mapped to the pillars they serve. Owner-only functions appear here so nothing sits outside the framework.</p>
          <details className="mt-5 border-t border-line py-3"><summary>Explore the program function map</summary>
          <div tabIndex={0} className="mt-4 overflow-x-auto rounded border border-line bg-white">
            <table className="data w-full min-w-[48rem] text-sm">
              <thead><tr><th scope="col">Program function</th><th scope="col">Purpose</th><th scope="col">Main page</th><th scope="col">Pillars served</th></tr></thead>
              <tbody>{programFunctions.map((fn) => (
                <tr key={fn.id} className="align-top">
                  <th scope="row" className="font-semibold">{fn.title}</th>
                  <td>{fn.purpose}</td>
                  <td className="whitespace-nowrap"><Link href={fn.primaryRoute}>{fn.primaryRoute}</Link></td>
                  <td>{(functionsByPillar.get(fn.id) ?? ["Accountability and improvement"]).join("; ")}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          </details>
        </section>

        <section aria-labelledby="measures" className="mt-14">
          <H2 id="measures">How progress is measured</H2>
          <p className="max-w-3xl">Compare activity, intermediate changes and longer-term outcomes, while keeping their different meanings clear. The measures below are planning examples. Confirm which data are available, who may use them, and what their coverage and limitations allow you to conclude.</p>
          <details className="mt-5 border-t border-line py-3"><summary>Explore the measurement framework</summary>
          <div tabIndex={0} className="mt-4 overflow-x-auto rounded border border-line bg-white">
            <table className="data w-full min-w-[40rem] text-sm">
              <thead><tr><th scope="col">Measure type</th><th scope="col">Purpose</th><th scope="col">Examples</th></tr></thead>
              <tbody>{F.indicatorTypes.map((t) => <tr key={t.type} className="align-top"><th scope="row" className="whitespace-nowrap font-semibold">{t.type}</th><td>{t.purpose}</td><td>{t.examples}</td></tr>)}</tbody>
            </table>
          </div>
          <h3 className="mt-8 text-xl font-bold">Measurement framework by domain¹⁰</h3>
          <div tabIndex={0} className="mt-3 overflow-x-auto rounded border border-line bg-white">
            <table className="data w-full min-w-[44rem] text-sm">
              <thead><tr><th scope="col">Domain</th><th scope="col">Example leading indicators</th><th scope="col">Example outcome indicators</th></tr></thead>
              <tbody>{F.measurementDomains.map(([d, l, o]) => <tr key={d} className="align-top"><th scope="row" className="font-semibold">{d}</th><td>{l}</td><td>{o}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="min-w-0"><h3 className="m-0 text-xl font-bold">Dashboard pages</h3><Pairs head={["Page", "What it shows"]} rows={F.dashboardPages} /></div>
            <div className="min-w-0"><h3 className="m-0 text-xl font-bold">Early-warning thresholds</h3><p className="text-sm">Thresholds trigger a review rather than waiting for a scheduled report. The values are agreed, not fixed here.</p><Bullets items={F.earlyWarning} /></div>
          </div>
          </details>
        </section>

        <section aria-labelledby="stages" className="mt-14">
          <H2 id="stages">Three stages with readiness conditions</H2>
          <p className="max-w-3xl">The proposed sequence moves through foundations, integration and sustainment. Set timing with the people or areas responsible, considering readiness, resources and applicable deadlines. These planning stages do not postpone an existing duty.</p>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">{F.stages.map((s, i) => (
            <article key={s.title} className="card min-w-0">
              <p className="kicker m-0">Stage {i + 1}</p>
              <h3 className="m-0 mt-1 text-2xl font-bold">{s.title}</h3>
              <p>{s.aim}</p>
              <p className="text-sm text-muted">{s.enterWhen}</p>
              {s.workstreams.map((w) => <details key={w.title} className="mt-2 rounded border border-line bg-white p-3"><summary className="cursor-pointer font-semibold">{w.title}</summary><Bullets items={w.items} /></details>)}
              <h4 className="mt-4 text-base font-bold">Readiness conditions</h4>
              <Bullets items={s.readiness} />
            </article>
          ))}</div>
        </section>

        <section aria-labelledby="outcomes" className="mt-14">
          <H2 id="outcomes">Expected outcomes</H2>
          <p className="max-w-3xl">What the organization should be able to show when the framework is working. None of these is claimed today; each is checked against evidence at agreed review points.</p>
          <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{F.outcomes.map((o) => <div key={o.title} className="min-w-0 border-t border-line pt-4"><h3 className="m-0 text-xl font-bold">{o.title}</h3><Bullets items={o.items} /></div>)}</div>
        </section>

        <section aria-labelledby="tools" className="mt-14">
          <H2 id="tools">Resource and tool suite</H2>
          <p className="max-w-3xl">Start with tools that support a defined task and connect to the applicable requirements. Check the status, linked resource and scope before using a tool; a proposed resource does not establish an available service or authority.</p>
          <div tabIndex={0} className="mt-4 overflow-x-auto rounded border border-line bg-white">
            <table className="data w-full min-w-[60rem] text-sm">
              <thead><tr><th scope="col">Tool or resource</th><th scope="col">Primary users</th><th scope="col">What it does</th><th scope="col">Format</th><th scope="col">In this program</th></tr></thead>
              <tbody>{F.coreTools.map((t) => (
                <tr key={t.name} className="align-top">
                  <th scope="row" className="font-semibold">{t.name}</th>
                  <td>{t.users}</td>
                  <td>{t.does}</td>
                  <td>{t.format}</td>
                  <td><span className={STATUS_CLASS[t.status]}>{TOOL_STATUS_LABEL[t.status]}</span>{t.where.length ? <div className="mt-2"><Links links={t.where} /></div> : null}{t.note ? <p className="m-0 mt-2 text-xs text-muted">{t.note}</p> : null}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          <h3 className="mt-10 text-2xl font-bold">Governance and planning tools</h3>
          <details className="card mt-3"><summary className="cursor-pointer text-lg font-bold">Strategic plan scorecard</summary>
            <p>A proposed scorecard can bring responsibilities, evidence and unresolved decisions into one review. Confirm who will maintain it, who can make the relevant decisions and when review is needed.</p>
            <Pairs head={["Field", "Purpose"]} rows={F.scorecardFields} />
            <h4 className="mt-4 text-base font-bold">Sample entry</h4>
            <Pairs head={["Field", "Example"]} rows={F.scorecardExample} />
          </details>
          <details className="card mt-3"><summary className="cursor-pointer text-lg font-bold">Equity Activity Inventory</summary>
            <p>The proposed Equity Activity Inventory is described in the One DSD proposal as the “central nervous system” for coordination.⁴ Before starting something new, teams check whether related work exists, who owns it, what was learned and whether collaboration is possible.</p>
            <div className="grid gap-6 md:grid-cols-2"><div className="min-w-0"><h4 className="m-0 text-base font-bold">Fields</h4><Bullets items={F.inventoryFields} /></div><div className="min-w-0"><h4 className="m-0 text-base font-bold">Operating rules</h4><Bullets items={F.inventoryRules} /></div></div>
          </details>
          <details className="card mt-3"><summary className="cursor-pointer text-lg font-bold">Governance charter</summary>
            <p>A charter makes the framework operational by clarifying who decides, who advises, who carries out work and how concerns move upward. Meeting patterns are set by the members; none are fixed here.</p>
            <div className="grid gap-6 md:grid-cols-2"><div className="min-w-0"><h4 className="m-0 text-base font-bold">Charter sections</h4><Bullets items={F.charterSections} /></div><div className="min-w-0"><h4 className="m-0 text-base font-bold">Suggested structure</h4><Pairs head={["Group", "Core function"]} rows={F.governanceGroups} /></div></div>
          </details>

          <h3 className="mt-10 text-2xl font-bold">Equity, accessibility and decision tools</h3>
          <details className="card mt-3" open><summary className="cursor-pointer text-lg font-bold">Equity Analysis Toolkit</summary>
            <p>Run an equity analysis before a significant decision, not after implementation has begun. The State of Minnesota toolkit and the DHS Equity Policy describe it as a way to examine how decisions affect different groups, prevent unanticipated harm and address persistent racial disparities that routine decisions can otherwise reproduce.⁵ Use the <Link href="/equity-policy/analysis">guided walkthrough</Link> to prepare the analysis and read the <Link href="/equity-policy">DHS Equity Policy</Link> for its requirements. Review the tool’s saving and export controls; completing a walkthrough does not itself establish approval or an equitable outcome.</p>
            <div className="grid gap-6 lg:grid-cols-2"><div className="min-w-0"><h4 className="m-0 text-base font-bold">Core questions</h4><ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{F.analysisQuestions.map((q) => <li key={q}>{q}</li>)}</ol></div><div className="min-w-0"><h4 className="m-0 text-base font-bold">Decision categories</h4><Pairs head={["Decision type", "Minimum review"]} rows={F.decisionCategories} /></div></div>
          </details>
          <details className="card mt-3"><summary className="cursor-pointer text-lg font-bold">Accessibility review checklist</summary>
            <p>Plan accessibility from the start and confirm the standards and obligations that apply to the work. This program uses WCAG 2.2 Level AA as a design goal; that goal is not a claim of verified conformance or a substitute for applicable legal requirements.⁶</p>
            <Pairs head={["Domain", "Example review questions"]} rows={F.accessibilityDomains} />
            <h4 className="mt-4 text-base font-bold">Minimum standard for every major initiative</h4>
            <Bullets items={F.accessibilityMinimum} />
          </details>
          <details className="card mt-3"><summary className="cursor-pointer text-lg font-bold">Inclusive hiring and workforce equity toolkit</summary>
            <p>Supports workforce equity, retention, equitable advancement and workplace culture.⁷ Use only authorized, appropriately aggregated workforce information for this planning exercise. Keep personnel records and confidential case details out of the learning tools.</p>
            <Pairs head={["Tool", "Use"]} rows={F.hiringTools} />
          </details>

          <h3 className="mt-10 text-2xl font-bold">Community, learning and culture tools</h3>
          <details className="card mt-3"><summary className="cursor-pointer text-lg font-bold">Community engagement toolkit</summary>
            <p>Plan engagement early, identify barriers to participation, and confirm the authority and arrangements for compensating expertise. Explain what input changed, what remained unchanged and why.⁸ <Link href="/minnesota-communities">Minnesota Communities</Link> carries the program’s reviewed community context.</p>
            <div className="grid gap-6 lg:grid-cols-2"><div className="min-w-0"><h4 className="m-0 text-base font-bold">Components</h4><Bullets items={F.engagementComponents} /></div><div className="min-w-0"><h4 className="m-0 text-base font-bold">Planning template</h4><Pairs head={["Planning element", "Key question"]} rows={F.engagementPlanning} /></div></div>
          </details>
          <details className="card mt-3"><summary className="cursor-pointer text-lg font-bold">Learning and development toolkit</summary>
            <p>Learning builds competencies people can apply in real work.⁹ The program’s <Link href="/learn">learning and resources</Link>, <Link href="/learn/intercultural">intercultural pathway</Link> and <Link href="/courses">courses</Link> carry the three levels.</p>
            <div tabIndex={0} className="overflow-x-auto"><table className="data w-full min-w-[44rem] text-sm"><thead><tr><th scope="col">Level</th><th scope="col">Audience</th><th scope="col">Purpose</th><th scope="col">Suggested topics</th></tr></thead><tbody>{F.learningLevels.map(([l, a, p, t]) => <tr key={l} className="align-top"><th scope="row" className="font-semibold">{l}</th><td>{a}</td><td>{p}</td><td>{t}</td></tr>)}</tbody></table></div>
            <div className="mt-4 grid gap-6 md:grid-cols-2"><div className="min-w-0"><h4 className="m-0 text-base font-bold">Evaluation model</h4><Pairs head={["Part", "Question"]} rows={F.learningEvaluation} /></div><div className="min-w-0"><h4 className="m-0 text-base font-bold">Post-learning application questions</h4><Bullets items={F.applicationQuestions} /></div></div>
          </details>
          <details className="card mt-3"><summary className="cursor-pointer text-lg font-bold">Culture and inclusion survey</summary>
            <p>{F.surveyRule} Use the <Link href="/practice/measurement">measurement worksheet</Link> to plan which combined results to review, when to review them, and how to interpret their limits.</p>
            <div className="grid gap-6 md:grid-cols-2"><div className="min-w-0"><h4 className="m-0 text-base font-bold">Survey domains</h4><Bullets items={F.surveyDomains} /></div><div className="min-w-0"><h4 className="m-0 text-base font-bold">Example items, strongly disagree to strongly agree</h4><Bullets items={F.surveyItems} /></div></div>
          </details>

          <h3 className="mt-10 text-2xl font-bold">Reporting tools</h3>
          <div className="mt-3 grid gap-6 md:grid-cols-2">
            <div className="card min-w-0"><h4 className="m-0 text-lg font-bold">Progress report</h4><Bullets items={F.progressReport} /></div>
            <div className="card min-w-0"><h4 className="m-0 text-lg font-bold">Public accountability report</h4><p className="text-sm">Plan accessible formats that the intended audiences can use, reporting achievements, limits and unfinished work.</p><Bullets items={F.publicReport} /></div>
          </div>

          <h3 className="mt-10 text-2xl font-bold">Digital tools and professional safeguards</h3>
          <p className="max-w-3xl">{F.digitalToolsRule}</p>
          <div tabIndex={0} className="overflow-x-auto rounded border border-line bg-white">
            <table className="data w-full min-w-[44rem] text-sm">
              <thead><tr><th scope="col">Digital tool</th><th scope="col">Use</th><th scope="col">Who checks it</th></tr></thead>
              <tbody>{F.digitalTools.map(([t, u, s]) => <tr key={t} className="align-top"><th scope="row" className="font-semibold">{t}</th><td>{u}</td><td>{s}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="library" className="mt-14">
          <H2 id="library">Resource library structure</H2>
          <p className="max-w-3xl">Organize by work task rather than by abstract topic, so staff can find “what I need to do” and “how to do it.” The program’s <Link href="/library">Library</Link> and <Link href="/practice">Practice</Link> pages hold what exists today.</p>
          <details className="mt-5 border-t border-line py-3"><summary>Explore the resource groups</summary>
          <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{F.library.map(([group, items]) => <div key={group} className="min-w-0 border-t border-line pt-4"><h3 className="m-0 text-lg font-bold">{group}</h3><Bullets items={items} /></div>)}</div>
          </details>
        </section>

        <section aria-labelledby="launch" className="mt-14">
          <H2 id="launch">Minimum launch package</H2>
          <p className="max-w-3xl">Use this proposed set of twelve tools to identify what the work needs, what is available and what requires authorization or development. Expand it when evidence and readiness justify the addition.</p>
          <ol className="mt-4 grid list-decimal gap-2 pl-6 md:grid-cols-2">{F.launchPackage.map((t) => <li key={t.name} className="text-sm">{t.href ? <Link href={t.href}>{t.name}</Link> : t.name} <span className="text-muted">({TOOL_STATUS_LABEL[t.status].toLowerCase()})</span></li>)}</ol>
          <p className="mt-6 max-w-3xl font-semibold">{F.designPrinciple}</p>
          <p className="max-w-3xl text-sm text-muted">This framework interprets <Link href="/operationalizing-equity">operationalizing equity</Link> for the whole program.¹² Applicable workplace duties and assigned training still apply, and decisions stay with the people or areas responsible in the department.</p>
        </section>

        <section aria-labelledby="notes" className="mt-14 border-t border-line pt-6">
          <H2 id="notes">Notes</H2>
          <details className="mt-5 border-t border-line py-3"><summary>Read notes and bibliography</summary>
          <ol className="mt-3 list-decimal space-y-2 pl-6 text-sm">{F.notes.map((n, i) => <li key={i}>{n}</li>)}</ol>
          <h3 className="mt-8 text-2xl font-bold">Bibliography</h3>
          <ul className="mt-3 list-none space-y-2 p-0 text-sm [&_li]:pl-8 [&_li]:-indent-8">{F.bibliography.map((b) => <li key={b}>{b}</li>)}</ul>
          <p className="text-sm text-muted">Notes and bibliography follow the Chicago Manual of Style notes-and-bibliography system. Internal program documents are cited as unpublished sources.</p>
          </details>
          <p><Link href="/">Return to the program home</Link></p>
        </section>
      </FocusedSections></div>
    </>
  );
}
