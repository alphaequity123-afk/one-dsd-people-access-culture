import "server-only";
import {
  CHECKLIST_ANSWERS,
  DIRECTOR_FIRST_90_DAYS,
  DIRECTOR_STARTER_PACKAGE,
  DIRECTOR_TEMPLATES,
  DIRECTOR_TOOLKIT_INTRO,
  DIRECTOR_TOOLKIT_REVIEWED_ON,
  DIRECTOR_TOOLKIT_SECTIONS,
  TEMPLATE_KEEP_OUT,
  directorTemplate,
  templateHref,
  type DirectorTemplate,
  type TemplateField,
  type ToolkitItem,
} from "@/lib/content/director-toolkit";
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
    subtitle: "When the Legislature creates a working group or task force, the law sets its purpose, members, meetings, duties and report date. This page turns that charge into a month-by-month plan, using the Waiver Case Management Advisory Working Group as the worked example, and shows how to reuse the plan for another group.",
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

// ---------------------------------------------------------------- Equity Director toolkit

function toolkitItemBlocks(item: ToolkitItem): DocumentBlock[] {
  const template = item.templateId ? directorTemplate(item.templateId) : undefined;
  return [
    heading(item.name),
    ...(item.publisher ? [paragraph([{ text: item.publisher, italic: true }])] : []),
    paragraph([{ text: "What it is for: ", bold: true }, { text: item.purpose }]),
    paragraph([{ text: "How an Equity Director uses it: ", bold: true }, { text: item.use }]),
    ...(template || item.href || item.url
      ? [
          linkList([
            ...(template ? [{ label: `Fill in the ${template.title.replaceAll("\"", "")} template`, href: templateHref(template.id) }] : []),
            ...(item.href ? [{ label: "Open the related page", href: item.href }] : []),
            ...(item.url ? [{ label: "Open the published resource", href: item.url }] : []),
          ])!,
        ]
      : []),
  ];
}

function directorToolkitDocument(scope: StaffProgramScope): ResourceDocument {
  const sources = DIRECTOR_TOOLKIT_SECTIONS.flatMap(entry => entry.items.filter(item => item.url).map(item => ({ title: item.name, href: item.url, note: item.publisher })));
  return reviewDocument(scope, "Equity in practice", {
    title: DIRECTOR_TOOLKIT_INTRO.title,
    subtitle: DIRECTOR_TOOLKIT_INTRO.lede,
    meta: [{ label: "Reviewed", value: dateText(DIRECTOR_TOOLKIT_REVIEWED_ON) }],
    sections: compactSections([
      section("Overview", [...DIRECTOR_TOOLKIT_INTRO.summary.map(text => paragraph(text)), callout(DIRECTOR_TOOLKIT_INTRO.privacy)]),
      section("Start here", [
        paragraph("New to the role, or starting a new equity effort? Begin with two things."),
        bullets([
          "The first 90 days: what to do in each 30-day period, and what each period should produce.",
          "The 12-item priority starter package: three foundational resources and nine practical supports to build with the people responsible for each area.",
          "The printable templates: fill them in on screen, then print, copy or download. Program page /equity-review/director-toolkit/templates",
        ]),
      ]),
      ...DIRECTOR_TOOLKIT_SECTIONS.map(entry =>
        section(`${entry.number}. ${entry.title}`, [
          paragraph([{ text: entry.question, italic: true }]),
          ...entry.intro.map(text => paragraph(text)),
          entry.id === "first-90-days" ? table(["Period", "Priority actions", "Deliverables"], DIRECTOR_FIRST_90_DAYS.map(period => [period.period, period.actions.join("\n"), period.deliverables.join("\n")])) : null,
          entry.id === "starter-package" ? table(["Number", "Item", "What it does", "Page"], DIRECTOR_STARTER_PACKAGE.map(item => [String(item.number), item.title, item.detail, item.href])) : null,
          ...entry.items.flatMap(toolkitItemBlocks),
          ...(entry.lists ?? []).flatMap((list): DocumentBlock[] => [heading(list.heading), bullets(list.items), ...(list.note ? [paragraph(list.note)] : [])]),
          entry.caution ? callout(entry.caution, "Important") : null,
          ...(entry.notes ?? []).map(text => paragraph(text)),
          entry.related?.length ? linkList(entry.related) : null,
        ]),
      ),
    ]),
    sources,
  });
}

// ---------------------------------------------------------------- Printable templates

function templateFieldBlocks(field: TemplateField): DocumentBlock[] {
  const help = field.help ? [paragraph([{ text: field.help, italic: true }])] : [];
  switch (field.kind) {
    case "text":
    case "long":
      return [heading(field.label), ...help, paragraph(BLANK_LINE), ...(field.kind === "long" ? [paragraph(BLANK_LINE)] : [])];
    case "choice":
      return [heading(field.label), ...help, bullets(field.options.map(option => `☐ ${option}`))];
    case "checklist":
      return [heading(field.label), ...help, table(["Question", `Answer (${CHECKLIST_ANSWERS.join(", ")})`], field.items.map(item => [item, ""]))];
    case "table":
      return [heading(field.label), ...help, table(["Row", ...field.columns], Array.from({ length: field.rows }, (_, row) => [String(row + 1), ...field.columns.map(() => "")]))];
  }
}

function templateSection(template: DirectorTemplate) {
  const parent = DIRECTOR_TOOLKIT_SECTIONS.find(entry => entry.id === template.sectionId)?.title ?? "Equity Director toolkit";
  return section(template.title, [
    paragraph(template.purpose),
    paragraph(template.howToUse),
    paragraph(`Part of ${parent} in the toolkit.`),
    ...template.fields.flatMap(templateFieldBlocks),
    callout(`${TEMPLATE_KEEP_OUT}`),
  ]);
}

function templatesDocument(scope: StaffProgramScope): ResourceDocument {
  return reviewDocument(scope, "Equity Director toolkit", {
    title: "Printable templates",
    subtitle: "Fill-in templates for equity reviews at the Minnesota Department of Human Services. Fill them in on screen, then print, copy or download.",
    meta: [
      { label: "Templates", value: String(DIRECTOR_TEMPLATES.length) },
      { label: "Reviewed", value: dateText(DIRECTOR_TOOLKIT_REVIEWED_ON) },
    ],
    sections: compactSections([
      section("Before you start", [
        paragraph("These templates put the Department of Human Services Equity Policy, the Department of Human Services Equity Analysis Toolkit and the State of Minnesota Equity Analysis Toolkit into practice. They do not replace them. Adapt each one with the people responsible for the work it covers."),
        callout(`This copy is blank. ${TEMPLATE_KEEP_OUT}`),
        heading(`The ${DIRECTOR_TEMPLATES.length} templates`),
        numbered(DIRECTOR_TEMPLATES.map(template => template.title)),
      ]),
      ...DIRECTOR_TEMPLATES.map(templateSection),
    ]),
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
    subtitle: "Look closely at a process, identify where barriers arise, and connect evidence with a practical change.",
    meta: [{ label: "Steps", value: String(STRUCTURAL_STEPS.length) }],
    sections: compactSections([
      section(undefined, [
        paragraph("Use these eight steps for a policy, service, or workplace process anywhere in the Department of Human Services. Work independently or with colleagues, and ask the Equity and Inclusion Operations Consultant for guidance when helpful."),
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

export const EQUITY_REVIEW_IDS = ["working-group-plan", "director-toolkit", "templates", "structural", "equity-policy", "equity-baseline"] as const;

export async function equityReviewDocument(id: string, scope: StaffProgramScope): Promise<ResourceDocument | null> {
  switch (id) {
    case "working-group-plan":
      return workingGroupPlanDocument(scope);
    case "director-toolkit":
      return directorToolkitDocument(scope);
    case "templates":
      return templatesDocument(scope);
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
