import "server-only";
import { getPolicy } from "@/lib/content/hub/dsd-policies";
import { DECISION_ROLE_LABELS as ROLE_LABELS } from "./contract";
import { bullets, callout, compactSections, downloadFileName, fields, heading, paragraph, quote, section, table, type DocumentBlock, type DocumentSection, type DocumentSource, type ResourceDocument } from "@/lib/downloads/model";
import { renderResourceDocument } from "@/lib/downloads/render";
import { CHANGE_TYPES, FORMALIZATION_STATEMENT, type ChangeType, type Decision, type PolicyCase, type PolicyExportKind, type Recommendation } from "./contract";
import { PolicyAnalysisError } from "./errors";
import { getPrinciple } from "./principles";
import { policyReviewInstrument } from "./service";

// Word and PDF documents for a policy-change case. Plain language, every name in full,
// labels written as plain words, and decisions recorded by role.

const ATTRIBUTION = "One DSD People, Access and Culture";

export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  "policy-wording": "Policy wording", protocol: "Protocol", process: "Process", procedure: "Procedure", training: "Training", data: "Data", engagement: "Engagement",
};
export const ANSWER_KIND_LABELS = { evidence: "From the sources", inference: "Reasoned from the sources", gap: "Missing information" } as const;
const OUTCOME_LABELS = { approved: "Approved", rejected: "Not adopted", deferred: "Deferred" } as const;
const EFFORT_LABELS = { low: "Low", medium: "Medium", high: "High" } as const;
const STATUS_LABELS = { draft: "Draft", review: "Open for decisions", final: "Formalized" } as const;
const ORIGIN_LABELS = { user: "Supplied for this case", catalog: "Official source", program: "From this program" } as const;
const EXPORT_TITLES: Record<PolicyExportKind, string> = {
  analysis: "Equity analysis", recommendations: "Recommended changes", "decision-record": "Decision record", "formal-policy-proposal": "Formal policy proposal",
};

export function changeHeading(item: Pick<Recommendation, "type" | "title">): string {
  return `${CHANGE_TYPE_LABELS[item.type]} change: ${item.title}`;
}

function longDate(value: string | undefined | null): string {
  if (!value) return "";
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T12:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: dateOnly ? "UTC" : "America/Chicago" }).format(date);
}

function sourceTitle(value: PolicyCase, sourceId: string): string {
  return value.sources.find(source => source.id === sourceId)?.title ?? "Source";
}

function quotes(value: PolicyCase, citations: readonly { sourceId: string; excerpt: string }[]): DocumentBlock[] {
  return citations.map(citation => quote(citation.excerpt, sourceTitle(value, citation.sourceId)));
}

function labelled(label: string, text: string): DocumentBlock {
  return paragraph([{ text: `${label}: `, bold: true }, { text }]);
}

function decisionLine(decision: Decision): string {
  const parts = [`${OUTCOME_LABELS[decision.outcome]} by the ${ROLE_LABELS[decision.role]} on ${longDate(decision.at)}.`, `Reason: ${decision.reason}`];
  if (decision.conditions) parts.push(`Conditions: ${decision.conditions}`);
  if (decision.deferredUntil) parts.push(`Come back to it on ${longDate(decision.deferredUntil)}.`);
  return parts.join(" ");
}

function policyFields(value: PolicyCase): DocumentBlock {
  const catalog = value.policy.catalogId ? getPolicy(value.policy.catalogId) : undefined;
  const official = catalog?.source;
  return fields([
    { label: "Policy", value: value.policy.title },
    { label: "Kind", value: value.policy.kindLabel ?? "" },
    { label: "Programs", value: value.policy.programs.join("; ") },
    { label: "Official source", value: official ? `${official.title}${official.date ? `, ${official.date}` : ""}. ${official.url}` : value.policy.sourceUrl ?? "" },
  ]);
}

function sourcesSection(value: PolicyCase): DocumentSection {
  return section("Sources", [
    value.sources.length
      ? table(["Source", "Where it comes from", "Date", "Note"], value.sources.map(source => [source.title, ORIGIN_LABELS[source.origin], source.date ?? "", source.note ?? ""]))
      : paragraph("No sources were attached to this case."),
  ]);
}

function documentSources(value: PolicyCase, principleIds: readonly string[] = []): DocumentSource[] {
  const catalog = value.policy.catalogId ? getPolicy(value.policy.catalogId) : undefined;
  const list: DocumentSource[] = [];
  if (catalog) list.push({ title: catalog.source.title, href: catalog.source.url, note: catalog.source.date ? `Official source, dated ${catalog.source.date}.` : "Official source." });
  for (const source of value.sources) if (!catalog || source.url !== catalog.source.url) list.push({ title: source.title, href: source.url, note: source.note });
  for (const id of new Set(principleIds)) {
    const principle = getPrinciple(id);
    if (principle) list.push({ title: principle.source.title, href: principle.source.url });
  }
  return list;
}

function base(value: PolicyCase, kind: PolicyExportKind): Omit<ResourceDocument, "sections"> {
  return {
    kicker: EXPORT_TITLES[kind],
    title: kind === "formal-policy-proposal" && value.formalization ? value.formalization.documentTitle : value.title,
    subtitle: value.policy.title,
    meta: [
      { label: "Status", value: STATUS_LABELS[value.status] },
      { label: "Last saved", value: longDate(value.updatedAt) },
      ...(value.finalizedAt ? [{ label: "Formalized", value: longDate(value.finalizedAt) }] : []),
    ],
    attribution: ATTRIBUTION,
  };
}

// ---------------------------------------------------------------------------

export function analysisDocument(value: PolicyCase): ResourceDocument {
  const analysis = value.analysis;
  const instrument = policyReviewInstrument();
  const answers = new Map((analysis?.answers ?? []).map(answer => [answer.questionId, answer]));
  const stageSections = instrument.stages.map(stage => section(stage.title, stage.questions.flatMap(question => {
    const answer = answers.get(question.id);
    if (!answer) return [];
    return [heading(question.prompt), labelled(ANSWER_KIND_LABELS[answer.kind], answer.text), ...quotes(value, answer.citations)];
  })));
  const principleIds = (analysis?.principles ?? []).map(finding => finding.principleId);
  return {
    ...base(value, "analysis"),
    sections: compactSections([
      section("The policy", [policyFields(value)]),
      sourcesSection(value),
      section("Summary", [paragraph(analysis?.summary ?? "No analysis has been written for this case yet.")]),
      ...(analysis ? stageSections : []),
      section("Equity principles", (analysis?.principles ?? []).flatMap(finding => {
        const principle = getPrinciple(finding.principleId);
        return [heading(principle?.title ?? finding.principleId), labelled(ANSWER_KIND_LABELS[finding.kind], finding.finding), ...quotes(value, finding.citations), principle ? paragraph(`Source: ${principle.source.title}.`) : null].filter(Boolean) as DocumentBlock[];
      })),
      section("Limitations", analysis?.limitations.length ? [bullets(analysis.limitations)] : []),
    ]),
    sources: documentSources(value, principleIds),
  };
}

function recommendationBlocks(value: PolicyCase, item: Recommendation, withDecision: boolean): DocumentBlock[] {
  const principles = item.principleIds.map(id => getPrinciple(id)?.title).filter(Boolean) as string[];
  const affected = item.affectedPolicies.map(id => getPolicy(id)?.title).filter(Boolean) as string[];
  return [
    paragraph(item.change),
    item.currentWording ? heading("Current wording") : null,
    item.currentWording ? quote(item.currentWording) : null,
    item.proposedWording ? heading("Proposed wording") : null,
    item.proposedWording ? quote(item.proposedWording) : null,
    heading("Equity consideration"),
    paragraph(item.equityConsideration),
    principles.length ? labelled("Equity principles", principles.join("; ")) : null,
    item.evidence.length ? heading("Evidence") : null,
    ...quotes(value, item.evidence),
    fields([
      { label: "Other policies this touches", value: affected.join("; ") },
      { label: "Responsible role", value: item.responsibleRole },
      { label: "Effort", value: EFFORT_LABELS[item.effort] },
      { label: "Review date", value: longDate(item.reviewDate) },
      ...(withDecision ? [{ label: "Current decision", value: item.decision ? decisionLine(item.decision) : "No decision recorded yet." }] : []),
    ]),
  ].filter(Boolean) as DocumentBlock[];
}

export function recommendationsDocument(value: PolicyCase): ResourceDocument {
  return {
    ...base(value, "recommendations"),
    sections: compactSections([
      section("The policy", [policyFields(value), value.analysis ? paragraph(value.analysis.summary) : null]),
      ...(value.recommendations.length
        ? value.recommendations.map(item => section(changeHeading(item), recommendationBlocks(value, item, true)))
        : [section("Recommended changes", [paragraph("No recommended changes have been written for this case yet.")])]),
    ]),
    sources: documentSources(value, value.recommendations.flatMap(item => item.principleIds)),
  };
}

function decisionTable(value: PolicyCase): DocumentBlock {
  return table(["Change", "Outcome", "Role", "Date", "Reason", "Conditions", "Come back to it on"], value.recommendations.map(item => {
    const decision = item.decision;
    return [changeHeading(item), decision ? OUTCOME_LABELS[decision.outcome] : "No decision yet", decision ? ROLE_LABELS[decision.role] : "", decision ? longDate(decision.at) : "", decision?.reason ?? "", decision?.conditions ?? "", longDate(decision?.deferredUntil)];
  }));
}

function historySections(value: PolicyCase): DocumentSection[] {
  return value.recommendations.filter(item => item.history.length > 0).map(item => section(`History: ${changeHeading(item)}`, [
    table(["Date", "Outcome", "Role", "Reason", "Conditions", "Come back to it on"], item.history.map(entry => [longDate(entry.at), OUTCOME_LABELS[entry.outcome], ROLE_LABELS[entry.role], entry.reason, entry.conditions ?? "", longDate(entry.deferredUntil)])),
  ]));
}

export function decisionRecordDocument(value: PolicyCase): ResourceDocument {
  return {
    ...base(value, "decision-record"),
    sections: compactSections([
      section("The policy", [policyFields(value)]),
      section("Decisions", [
        paragraph("Decisions are recorded by role. Earlier decisions stay in the history below; nothing is overwritten."),
        value.recommendations.length ? decisionTable(value) : paragraph("No recommended changes have been written for this case yet."),
      ]),
      ...historySections(value),
    ]),
    sources: documentSources(value),
  };
}

export function formalProposalDocument(value: PolicyCase): ResourceDocument {
  if (value.status !== "final" || !value.formalization) throw new PolicyAnalysisError("transition", "The formal policy proposal is available once the case is formalized.");
  const formal = value.formalization;
  const approvedIds = new Set(formal.approvedRecommendationIds);
  const approved = value.recommendations.filter(item => approvedIds.has(item.id));
  const deferred = value.recommendations.filter(item => item.decision?.outcome === "deferred");
  const rejected = value.recommendations.filter(item => item.decision?.outcome === "rejected");
  const catalog = value.policy.catalogId ? getPolicy(value.policy.catalogId) : undefined;
  const principleIds = [...new Set(approved.flatMap(item => item.principleIds))];
  const byType = CHANGE_TYPES.map(type => ({ type, items: approved.filter(item => item.type === type) })).filter(group => group.items.length > 0);

  return {
    ...base(value, "formal-policy-proposal"),
    sections: compactSections([
      section("Purpose", [paragraph(`This proposal sets out the changes approved after an equity analysis of ${value.policy.title}, with the role that made each decision named in the decision record. It records each change, the equity consideration behind it, who is responsible and when it will be reviewed.`)]),
      section("Policy it changes", [
        fields([
          { label: "Policy", value: value.policy.title },
          { label: "Official source", value: catalog ? catalog.source.title : value.policy.sourceUrl ?? "" },
          { label: "Address", value: catalog ? catalog.source.url : "" },
          { label: "Date of the official source", value: catalog?.source.date ?? "" },
        ]),
      ]),
      section("Background", [paragraph(value.analysis?.summary ?? "")]),
      section("Equity considerations", [
        ...approved.map(item => labelled(item.title, item.equityConsideration)),
        principleIds.length ? heading("Equity principles applied") : null,
        principleIds.length ? bullets(principleIds.map(id => getPrinciple(id)).filter(Boolean).map(principle => `${principle!.title}. ${principle!.plainMeaning}`)) : null,
      ]),
      ...byType.map(group => section(`Approved ${CHANGE_TYPE_LABELS[group.type].toLowerCase()} changes`, group.items.flatMap(item => [
        heading(item.title),
        paragraph(item.change),
        item.currentWording ? labelled("Current wording", item.currentWording) : null,
        item.proposedWording ? heading("Proposed wording") : null,
        item.proposedWording ? quote(item.proposedWording) : null,
        item.decision?.conditions ? labelled("Conditions", item.decision.conditions) : null,
      ].filter(Boolean) as DocumentBlock[]))),
      section("Responsible roles and review dates", [
        table(["Change", "Responsible role", "Review date"], approved.map(item => [changeHeading(item), item.responsibleRole, longDate(item.reviewDate) || "To be set"])),
      ]),
      section("Changes deferred", deferred.length ? [bullets(deferred.map(item => `${changeHeading(item)}. Come back to it on ${longDate(item.decision?.deferredUntil)}.`))] : [paragraph("No changes were deferred.")]),
      section("Changes not adopted", rejected.length ? [bullets(rejected.map(item => changeHeading(item)))] : [paragraph("Every change considered was approved or deferred.")]),
      section("Decision record", [decisionTable(value), paragraph(`Formalized by the ${ROLE_LABELS[formal.role]} on ${longDate(formal.at)}.`)]),
      section(undefined, [callout(formal.statement || FORMALIZATION_STATEMENT, "Status of this document")]),
      sourcesSection(value),
    ]),
    sources: documentSources(value, principleIds),
  };
}

export function buildPolicyDocument(value: PolicyCase, kind: PolicyExportKind): ResourceDocument {
  switch (kind) {
    case "analysis": return analysisDocument(value);
    case "recommendations": return recommendationsDocument(value);
    case "decision-record": return decisionRecordDocument(value);
    case "formal-policy-proposal": return formalProposalDocument(value);
  }
}

const CONTENT_TYPES = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
  json: "application/json; charset=utf-8",
} as const;

/** The file for a case export. The formal proposal is refused unless the case is final. */
export async function renderPolicyExport(value: PolicyCase, kind: PolicyExportKind, format: "docx" | "pdf" | "json"): Promise<{ data: Buffer; fileName: string; contentType: string }> {
  if (kind === "formal-policy-proposal" && value.status !== "final") throw new PolicyAnalysisError("transition", "The formal policy proposal is available once the case is formalized.");
  const name = `${value.title} ${EXPORT_TITLES[kind]}`;
  if (format === "json") return { data: Buffer.from(JSON.stringify(value, null, 2), "utf8"), fileName: downloadFileName(name, "txt").replace(/\.txt$/, ".json"), contentType: CONTENT_TYPES.json };
  const data = await renderResourceDocument(buildPolicyDocument(value, kind), format);
  return { data, fileName: downloadFileName(name, format), contentType: CONTENT_TYPES[format] };
}
