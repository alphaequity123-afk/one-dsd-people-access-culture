/** Display adaptations only. The supplied source JSON and downloadable originals stay unchanged. */
const planDisplayLines = new Map<string, string>([
  [
    'There are no calendar dates in this plan. "Year 1, Quarter 1" means the first three months after leaders approve the plan. Each year ends with a checkpoint. We move on to the next year when the checklist for that checkpoint is done and leaders agree, not because a date has passed. If something takes longer, we say so in the quarterly report.',
    "The work is organized into three phases, with checkpoints to review progress and set priorities. Delays and needed support are addressed in the quarterly report.",
  ],
  [
    "The people who own a decision, a service or a team do the equity work for it. Equity is part of their job, not a separate job handed to someone else. The consultant's role is to support them: to advise, coach, connect people to resources and to each other, and help them get better at doing this work themselves. The consultant does not own or carry any part of this plan.",
    "The Equity and Inclusion Operations Consultant leads the program and guides its development. Leaders, goal leads, units, and named contacts carry out the decisions and services they own. The consultant advises, coaches, and connects people with resources and with each other.",
  ],
  [
    "Own the plan. Name an owner for every goal and area of work, give owners time to do it, make decisions, review the quarterly report, and decide when each checkpoint is met.",
    "Support implementation. Name an owner for every goal and area of work, give owners time to do it, make decisions, review the quarterly report, and use checkpoint reviews to set priorities.",
  ],
  [
    "Supports everyone above. Advises and coaches, helps people use the program and the equity review tools, connects people to the right resources and offices, shares what is working across units, and helps pull the quarterly report together from what owners send.",
    "Leads the program. Advises and coaches, helps people use the program and the equity review tools, connects people to the right resources and offices, shares what is working across units, and helps pull the quarterly report together from what owners send.",
  ],
  [
    "Owners do the work. The consultant supports. Every item in this plan has an owner who is not the consultant. If work starts drifting to the consultant, leaders reassign it.",
    "The consultant leads the program. Owners carry out the work for their goals, decisions, and services. Leaders address gaps in implementation responsibility and make sure owners have the support they need.",
  ],
  ["Checkpoints, not deadlines. We move ahead when the work is done and leaders agree. Delays are reported, not hidden.", "Checkpoint reviews guide priorities for the next phase. Delays are reported in the quarterly report."],
  ["Year 1 checkpoint: we move on when", "Year 1 checkpoint review"],
  ["Year 2 checkpoint: we move on when", "Year 2 checkpoint review"],
  ["Year 3 checkpoint: the plan is complete when", "Year 3 checkpoint review"],
  ["Every goal and area of work has a named owner who is not the consultant.", "Every goal and area of work has a named implementation owner."],
  ["Role confirmed as advising, coaching and connecting, not owning the work.", "The consultant leads the program, advises, coaches, and connects implementation owners with support."],
  ["Every item has an owner who is not the consultant. The quarterly report lists owners. Leaders reassign anything without an owner.", "Every implementation task has a responsible owner. The quarterly report lists owners, and leaders address any gaps in responsibility."],
  ["12. Decisions leaders make when they approve this plan", "12. Decisions for leadership review"],
  ["Confirm that the consultant's role is to advise, coach and connect, and that the consultant does not own any part of the plan.", "Recognize the consultant's program leadership and clarify how leaders, goal leads, units, and named contacts carry out the work."],
  ["Agree that we move ahead only when checkpoints are met, and that delays are reported in the quarterly report.", "Use checkpoint reviews to set priorities and address delays in the quarterly report."],
]);

export function programDocumentDisplayText(slug: string, source: string): string {
  if (slug === "three-year-plan") {
    const lines = source.replace(/\r\n/g, "\n").split("\n");
    // Suppress the supplied title/byline block; the reader already has a page title.
    const start = lines.indexOf("1. What this plan is for");
    return lines.slice(start >= 0 ? start : 0).map(line => planDisplayLines.get(line) ?? line).join("\n");
  }
  if (slug === "dhs-landscape") {
    return source.replace(/^Prepared by\r?\nGary Banks\r?\nEquity and Inclusion Operations Consultant\r?\n/m, "");
  }
  return source;
}
