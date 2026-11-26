import "server-only";
import {
  CHARGE,
  CHECKPOINTS,
  KICKOFF_DECISIONS,
  LAW,
  MEETINGS,
  PROGRAM_SUPPORT,
  RECOMMENDATION_RECORD,
  REUSE_STEPS,
  ROADMAP,
  TOPICS,
  TOPIC_METHOD,
  WORKING_GROUP_PLAN_CHECKED,
} from "@/lib/content/hub/working-group-plan";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { EQUITY_POLICY } from "@/lib/equity-analysis/policy";
import { STRUCTURAL_GUIDANCE, STRUCTURAL_STEPS, type StructuralField } from "@/lib/structural-review/content";
import {
  bullets,
  callout,
  compactSections,
  heading,
  numbered,
  paragraph,
  section,
  table,
  type DocumentBlock,
  type ResourceDocument,
} from "../model";
import { dateText } from "./hub-outreach";
import { kicker, linkList, programName } from "./shared";

const BLANK_LINE = "______________________________________________";

function reviewDocument(scope: StaffProgramScope, noun: string, rest: Omit<ResourceDocument, "kicker" | "attribution">): ResourceDocument {
  return { kicker: kicker(scope, noun), attribution: programName(scope), ...rest };
}

// ---------------------------------------------------------------- Working group plan

function workingGroupPlanDocument(scope: StaffProgramScope): ResourceDocument {
  return reviewDocument(scope, "Equity in practice", {
    title: "Plan a legislatively required working group",
    subtitle: "When the Legislature creates a working group or task force, the law sets its purpose, members, meetings, duties and report date. Here we turn that charge into a month-by-month plan, using the Waiver Case Management Advisory Working Group as the worked example, and show how to reuse the plan for another group.",
    meta: [
      { label: "Law", value: LAW.title },
      { label: "Checked", value: dateText(WORKING_GROUP_PLAN_CHECKED) },
    ],
    sections: compactSections([
      section(undefined, [
        callout(`The charge below is quoted from the law. The workplan, topic method, recommendation record and checkpoints are proposed practice for confirmation by the group and the department, not statutory requirements. Checked on ${dateText(WORKING_GROUP_PLAN_CHECKED)}.`),
      ]),
      section("The charge, from the law", [
        paragraph(CHARGE.purpose),
        heading("Members"),
        bullets(CHARGE.membership),
        paragraph(CHARGE.membershipNote),
        heading("Meetings and support"),
        paragraph(CHARGE.meetings),
        heading("Duties"),
        numbered(CHARGE.duties),
        heading("Report"),
        paragraph(CHARGE.report),
        paragraph([{ text: "Scope boundary. ", bold: true }, { text: CHARGE.scopeBoundary }]),
        paragraph([
          { text: "Common lens. ", bold: true },
          { text: `${CHARGE.commonLens} For Tribal Nations, membership on a working group is not consultation: contact the Office of Indian Affairs and the Department of Human Services offices that handle Tribal relations and consultation.` },
        ]),
        paragraph(`Source: ${LAW.title} (${LAW.url}). ${LAW.section53} ${LAW.section54}`),
      ]),
      section("Roadmap", [paragraph("Recommendations develop during topic review, with a complete draft in June."), table(["Period", "Primary work", "Milestone"], ROADMAP.map(row => [row.period, row.work, row.milestone]))]),
      section("Meeting sequence", [paragraph("One full-group session a month, with focused work between."), table(["Meeting", "Month", "Focus and preparation", "Output"], MEETINGS.map(row => [String(row.number), row.month, row.focus, row.output]))]),
      section("A consistent approach to every topic", [
        paragraph("Staff organize the evidence and the discussion. Members shape the recommendations."),
        table(["When", "What"], TOPIC_METHOD.map(step => [step.when, step.what])),
      ]),
      section("Topic plans", [
        table(
          ["Duty", "Month", "Topic", "Evidence", "Discussion", "Approach", "Expected output", "Note for the facilitator"],
          TOPICS.map(topic => [topic.duty, topic.month, topic.title, topic.evidence, topic.discussion, topic.approach, topic.output, topic.note]),
        ),
      ]),
      section("The recommendation record", [paragraph("Keep one record per proposed change from the first topic onward."), table(["Field", "What it records"], RECOMMENDATION_RECORD.map(item => [item.field, item.what]))]),
      section("Report checkpoints that protect the deadline", [
        table(["Target", "Checkpoint", "Responsibility"], CHECKPOINTS.map(item => [item.target, item.checkpoint, item.responsibility])),
        paragraph("The commissioner is the statutory submitting authority. Confirm actual review windows and required approvals at kickoff."),
      ]),
      section("Kickoff decisions for the first full-group meeting", [table(["Decision", "What to settle"], KICKOFF_DECISIONS.map(item => [item.title, item.what]))]),
      section("Reuse this plan for another working group", [numbered(REUSE_STEPS), paragraph("Plan an engagement (program page /community-outreach/plan) covers the participation supports in detail.")]),
      section("What this program can supply to the duties", [table(["Duties", "Resource", "Page"], PROGRAM_SUPPORT.map(item => [item.duties, item.resource, item.href]))]),
    ]),
    sources: [{ title: LAW.title, href: LAW.url, note: `${LAW.section53} ${LAW.section54} Checked ${dateText(WORKING_GROUP_PLAN_CHECKED)}.` }],
  });
}

// ---------------------------------------------------------------- Structural equity analysis

function structuralFieldBlocks(field: StructuralField): DocumentBlock[] {
  const options = (field.opts ?? []).map(option => (Array.isArray(option) ? option[1] : option));
  return [
    heading(`${field.l}${field.optional ? " (optional)" : ""}`),
    ...(field.h ? [paragraph([{ text: field.h, italic: true }])] : []),
    ...(options.length ? [bullets(options.map(option => `☐ ${option}`))] : [paragraph(BLANK_LINE)]),
  ];
}

function structuralDocument(scope: StaffProgramScope): ResourceDocument {
  return reviewDocument(scope, "Equity in practice", {
    title: "Structural equity analysis",
    subtitle: "Look closely at a process, find where barriers show up, and connect the evidence with a practical change.",
    meta: [{ label: "Steps", value: String(STRUCTURAL_STEPS.length) }],
    sections: compactSections([
      section(undefined, [
        paragraph("These eight steps work for a policy, service or workplace process anywhere in the Department of Human Services. Work on your own or with colleagues, and reach out to the Equity and Inclusion Operations Consultant whenever guidance would help."),
        callout("This copy is blank. Use roles, not names, and keep personnel, client, case and complaint details out of the record. An answered checklist is a preparation aid, not an approval or a finding that inequity has been established."),
      ]),
      ...STRUCTURAL_STEPS.map((step, index) => {
        const guidance = STRUCTURAL_GUIDANCE[step.id];
        return section(`Step ${index + 1}. ${step.title}`, [
          paragraph([{ text: step.short, italic: true }]),
          paragraph(step.lead),
          heading("Guidance"),
          paragraph(guidance.why),
          bullets(guidance.do),
          guidance.flag ? callout(guidance.flag) : null,
          paragraph([{ text: "Practice example: ", bold: true }, { text: step.example }]),
          ...(step.table
            ? [heading(step.table.label.replace(/^\+\s*/, "")), table(step.table.cols.map(column => column.l), Array.from({ length: Math.max(step.table.start, 3) }, () => step.table!.cols.map(() => "")))]
            : []),
          ...step.fields.flatMap(structuralFieldBlocks),
        ]);
      }),
    ]),
  });
}

// ---------------------------------------------------------------- Equity policy

function equityPolicyDocument(scope: StaffProgramScope): ResourceDocument {
  return reviewDocument(scope, "People, Access and Culture", {
    title: EQUITY_POLICY.title,
    subtitle: EQUITY_POLICY.lede,
    meta: [
      { label: "Effective", value: dateText(EQUITY_POLICY.effective) },
      { label: "Official text", value: EQUITY_POLICY.href },
      { label: "Method", value: EQUITY_POLICY.toolkitHref },
    ],
    sections: compactSections([
      section("What the policy names", EQUITY_POLICY.commitments.flatMap((commitment): DocumentBlock[] => [heading(commitment.name), paragraph(commitment.body)])),
      section("What it asks of staff", [numbered(EQUITY_POLICY.asks)]),
      section("Learn it, use it, see it", [
        paragraph("The Equity Strategic Framework (program page /equity-framework) connects this policy to everyday decisions and follow-through."),
        heading("1. Learn: the toolkit companion"),
        paragraph("Build your understanding step by step with a worked example, the official toolkit, and resources for your work. Program page /learn/equity-toolkit"),
        heading("2. Use: Equity Analysis Toolkit"),
        paragraph("Try the eight practice questions with a published example, then download a copy for your own work. Program page /learn/equity-toolkit"),
        heading("3. See: return to the policy"),
        paragraph(`Use the official policy and Equity Analysis Tool when you need to check the requirements or method. ${EQUITY_POLICY.href}`),
      ]),
      section("Related pages", [
        linkList([
          { label: "Review a policy or service change", href: "/equity-review" },
          { label: "Examine barriers in a process", href: "/equity-review/structural" },
          { label: "Toolkit companion", href: "/learn/equity-toolkit" },
          { label: "Equity analysis for policy review", href: "/learn/equity-toolkit/policy-review" },
        ]),
      ]),
    ]),
    sources: [
      { title: "Department of Human Services Equity Policy", href: EQUITY_POLICY.href, note: `Effective ${dateText(EQUITY_POLICY.effective)}` },
      { title: "Minnesota Equity Analysis Tool", href: EQUITY_POLICY.toolkitHref },
    ],
  });
}

// ---------------------------------------------------------------- Equity baseline (leaders only)

async function equityBaselineDocument(scope: StaffProgramScope): Promise<ResourceDocument | null> {
  const { leadersAllowed } = await import("@/lib/auth/leaders-access");
  if (!(await leadersAllowed())) return null;
  const { GLOSSARY, POOLED, UNIT_LABEL, baseline, formatValue, goalMap, headlineNarratives, measure, measures, narrative } = await import("@/lib/content/data/equity-baseline");
  const goals = goalMap();
  const all = measures();
  return reviewDocument(scope, "Data", {
    title: "Equity baseline",
    subtitle: "A baseline is the starting line. It shows who got each employment service, by race and ethnicity, before the next plan begins.",
    meta: [
      { label: "Years", value: POOLED },
      { label: "Measures", value: String(all.length) },
    ],
    sections: compactSections([
      section(undefined, [
        paragraph("These numbers pool fiscal years 2022, 2023 and 2024 into one value for each group. Three years together give a steadier picture than any one year. The plan for fiscal years 2027 to 2030 will be measured against this starting line."),
      ]),
      section("The six goals", [
        paragraph("Each goal comes from the Aging and Disability Services Administration Equity and Inclusion Implementation Plan."),
        table(["Goal", "Title", "Focus", "Measures", "Data we still need"], goals.map(({ goal, measureIds, dataGaps }) => [String(goal.number), goal.title, goal.focus, String(measureIds.length), dataGaps.join(" ")])),
      ]),
      section("What the numbers say", [paragraph("The five widest gaps in the baseline, in plain words."), bullets(headlineNarratives(5).map(({ measure: m, text }) => `${text} (${m.program})`))]),
      section("How we count", [
        paragraph("Each value pools three fiscal years, 2022 to 2024. Where the source gives counts, the pooled value is count-weighted, and a 95% confidence interval is shown. Where the source gives only a figure, the value is a simple average and no interval is shown."),
        paragraph("A risk ratio compares one group with everyone else. A value of 1.0 means no difference. Below 1.0 means less likely; above 1.0 means more likely."),
        paragraph(`Small counts are suppressed in the source and appear as "Not available". People whose record does not say their race are shown as "Race not recorded". ${all.length} measures are included.`),
      ]),
      ...goals.map(({ goal, measureIds, dataGaps }) =>
        section(`Goal ${goal.number}: ${goal.title}`, [
          paragraph(goal.focus),
          paragraph(goal.summary),
          heading("The plan asks"),
          numbered(goal.questions),
          dataGaps.length ? heading("Data we still need") : null,
          dataGaps.length ? bullets(dataGaps) : null,
          measureIds.length ? null : paragraph("No measure serves this goal yet."),
          ...measureIds.map(id => measure(id)).filter(m => m !== undefined).flatMap((m): DocumentBlock[] => [
            heading(`${m.title} (${m.ageGroup === "youth" ? "young people age 14 to 21" : "adults age 22 to 64"})`),
            paragraph(m.plainWhat),
            paragraph(narrative(m)),
            ...(m.note ? [paragraph(m.note)] : []),
            paragraph(`Source: ${m.source}.`),
          ]),
        ]),
      ),
      section("All measures", [
        paragraph(`Pooled value by race and ethnicity, ${POOLED}.`),
        table(
          ["Goal", "Measure", "Program or service", "Age group", "Unit", "Race or ethnicity", "Value", "95% confidence interval", "People counted", "Years", "Source"],
          all.flatMap(m =>
            baseline(m).map(row => [
              String(m.goal),
              m.title,
              m.program,
              m.ageGroup === "youth" ? "Young people age 14 to 21" : "Adults age 22 to 64",
              UNIT_LABEL[m.unit],
              row.label,
              formatValue(m.unit, row.value),
              row.interval ? `${formatValue(m.unit, row.interval[0])} to ${formatValue(m.unit, row.interval[1])}` : "Not available",
              row.n != null ? row.n.toLocaleString("en-US") : "Not available",
              row.years.length ? row.years.map(year => `fiscal year ${year}`).join(", ") : "Not available",
              m.source,
            ]),
          ),
        ),
      ]),
      section("Glossary of full names", [paragraph(GLOSSARY.rule), table(["Full name", "Short form used in state documents", "What it means", "Source"], GLOSSARY.terms.map(term => [term.full, term.short, term.plain, term.source]))]),
    ]),
    sources: [...new Set(all.map(m => m.source))].map(title => ({ title })),
  });
}

export const EQUITY_REVIEW_IDS = ["working-group-plan", "structural", "equity-policy", "equity-baseline"] as const;

export async function equityReviewDocument(id: string, scope: StaffProgramScope): Promise<ResourceDocument | null> {
  switch (id) {
    case "working-group-plan":
      return workingGroupPlanDocument(scope);
    case "director-toolkit":
    case "templates":
      return null; // Owner removed the toolkit, including its downloadable templates.
    case "structural":
      return structuralDocument(scope);
    case "equity-policy":
      return equityPolicyDocument(scope);
    case "equity-baseline":
      return equityBaselineDocument(scope);
    default:
      // Other public pages without a download of their own ("practice-guide~<slug>", "about", ...).
      return (await import("./hub-pages")).extraPageDocument(id, scope);
  }
}
