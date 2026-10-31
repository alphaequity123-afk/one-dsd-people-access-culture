import Link from "next/link";
import { ExplainerVideo } from "@/components/explainer-video";

/** One way to analyze a decision, scaled by depth. Shared by Practice, the toolkit and equity reviews. */
const RUNGS = [
  {
    level: "Quick check", time: "About ten minutes", href: "/practice/gp-12", label: "Start an Equity Pause",
    who: "Best for routine decisions: a schedule, a template, a small change to a process.",
    next: "If the check surfaces a real barrier, or a group that would experience the decision differently, move up to a standard analysis.",
  },
  {
    level: "Standard analysis", time: "An hour or more", href: "/practice/gp-7", label: "Work through an equity analysis",
    who: "Best for decisions that change how people reach services, information, or opportunities.",
    next: "Draft and save your analysis in the toolkit workspace. If the barrier turns out to be built into a process or a system, an in-depth review is the right next step.",
    extra: { href: "/learn/equity-toolkit/practice", label: "Open the drafting workspace" },
  },
  {
    level: "In-depth review", time: "Several sessions", href: "/equity-review", label: "Choose an in-depth review",
    who: "Best for policies, HCBS service changes, and barriers that run through an entire process.",
    next: "Involve the people affected and the responsible office before the decision is final.",
  },
] as const;

export function EquityAnalysisLadder({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const RungHeading = headingLevel === 2 ? "h3" : "h4";
  return <section id="equity-analysis" aria-labelledby="equity-analysis-title" className="card scroll-mt-24 space-y-4">
    <p className="kicker">Analyze a decision</p>
    <Heading id="equity-analysis-title" className="text-2xl font-extrabold">Analyze a decision at the right depth</Heading>
    <p className="max-w-3xl">Equity analysis scales with the stakes. Most decisions need a short, honest check; a few need sustained attention from several people. Each level below points to the next, so you can start small and go deeper only when the work calls for it. When DHS policy requires a full equity analysis, a quick check does not satisfy it: see <Link href="/equity-policy">the DHS equity analysis policy</Link>.</p>
    <ol className="grid gap-4 md:grid-cols-3">
      {RUNGS.map(rung => <li key={rung.level} className="space-y-2 rounded-lg border border-line p-4">
        <p className="kicker">{rung.time}</p>
        <RungHeading className="text-xl font-extrabold">{rung.level}</RungHeading>
        <p>{rung.who}</p>
        <p className="text-muted">{rung.next}</p>
        <p className="flex flex-col gap-1"><Link className="font-semibold" href={rung.href}>{rung.label} →</Link>{"extra" in rung ? <Link href={rung.extra.href}>{rung.extra.label}</Link> : null}</p>
      </li>)}
    </ol>
    <ExplainerVideo id="decision-depth" />
  </section>;
}
