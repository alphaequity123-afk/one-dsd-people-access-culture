import "server-only";
import { plainAnswerText } from "@/lib/ask/plain-text";

/**
 * Server side of the staff "Analyze a document" workspace.
 *
 * Owner rules this module keeps:
 * - Nothing a person uploads or pastes is stored, logged or written anywhere.
 *   Sources travel inside the request and the result goes back to the browser.
 * - The privacy gate runs over the context and every source before any model call.
 * - Every answer is typed evidence, inference or gap. An evidence answer keeps
 *   only quotations that occur verbatim in the named source.
 * - Guidance links come only from the instrument's own list of pages in this program.
 * - Short forms of organization and program names are written out in full.
 */
import {
  ANALYSIS_NOTICE,
  analysisDraftSchema,
  nextStepSchema,
  type AnalysisAnswer,
  type AnalysisDraft,
  type AnalysisRequest,
  type AnalysisResponse,
  type Instrument,
  type InstrumentQuestion,
  type NextStep,
} from "./contract";
import { getInstrument } from "./instruments";
import { anyKeywordMatches } from "./keywords";
import { askPrivacyGate } from "@/lib/intelligence/safety";
import { ORGANIZATIONS } from "@/lib/content/hub/organizations";
import { getSystemConnections } from "@/lib/content/hub/system-connections";
import { cloneAgentsEnabled } from "@/lib/intelligence/clone/config";
import { contextFor } from "@/lib/intelligence/orchestrator";
import { resolveBinding } from "@/lib/intelligence/providers";
import { runTool } from "@/lib/intelligence/tools/runtime";

/** The analysis stopped before any model call: the privacy gate refused it, or the sources hold too much text for one analysis. */
export type AnalysisRefusal = { refusal: true; message: string };
export type AnalysisOutcome = AnalysisResponse | AnalysisRefusal;

export function isRefusal(outcome: AnalysisOutcome): outcome is AnalysisRefusal {
  return "refusal" in outcome && outcome.refusal === true;
}

/** Native community pages get no added content, so a request about one is treated as having no community. */
const NO_ADDED_CONTENT_COMMUNITIES = new Set(["native-american", "tribal-nations", "alaska-native"]);

export function effectiveCommunityId(communityId: string | undefined): string | undefined {
  if (!communityId || NO_ADDED_CONTENT_COMMUNITIES.has(communityId)) return undefined;
  return communityId;
}

const GAP_TEXT = "The sources do not address this.";
const MODEL_TIMEOUT_MS = 75_000;
const MODEL_MAX_TOKENS = 4000;
/** Both generative adapters the Ask agent can bind to refuse a prompt (system + user) over this many bytes. */
export const PROMPT_BYTE_LIMIT = 80_000;
export const TOO_MUCH_TEXT_MESSAGE = "The sources together hold too much text for one analysis. Remove a source or paste shorter excerpts, then try again.";

/* ---------- Plain language: write short forms out in full ---------- */

const SHORT_FORMS: Array<[RegExp, string]> = [
  [/\bDSD\b/g, "Disability Services Division"],
  [/\bDHS\b/g, "Department of Human Services"],
  [/\bHCBS\b/g, "home and community-based services"],
];

/** Word-boundary, case-sensitive. Never applied to quoted excerpts, which must stay verbatim. */
const plainText = (text: string) => plainAnswerText(text).trim() || text;

export function writeNamesInFull(text: string): string {
  let out = text;
  for (const [pattern, full] of SHORT_FORMS) out = out.replace(pattern, full);
  return out;
}

/* ---------- Prompt ---------- */

function questionsOf(instrument: Instrument): InstrumentQuestion[] {
  return instrument.stages.flatMap(stage => stage.questions);
}

export function buildPrompt(instrument: Instrument, request: AnalysisRequest): { system: string; user: string } {
  const system = [
    "You answer a fixed set of questions about documents that a staff member of the Minnesota Department of Human Services, Disability Services Division supplied. Use only the supplied sources. Do not use outside knowledge, and do not invent facts, laws, figures, dates, names or document titles.",
    "",
    `The questions come from this instrument: ${instrument.title}. Basis: ${instrument.basis}`,
    "",
    "When the supplied decision makes cultural context relevant, consider whose perspectives are missing, what assumptions need checking, and whether the evidence supports a practical adaptation. Never infer a person’s or agency’s intercultural orientation or present an intended outcome as an observed result.",
    "Answer every question. For each answer choose exactly one kind:",
    "- evidence: the sources directly support the answer. Quote at least one excerpt, copied word for word from a source, and give that source's id.",
    "- inference: a reasonable reading of the sources that they do not state directly. Say what you are reading from.",
    "- gap: the sources do not settle it. Say in one sentence what is missing.",
    "",
    "Treat automatically generated media descriptions or transcripts as extracted text, not as verified statements of what the original image or recording shows. Identify this limitation and do not treat a quoted extraction as proof of the original media. Distinguish a labelled practice scenario from actual data and do not present it as a real event. LTSS demographics alone do not establish scheduling barriers or causes.",
    "Rules for quotations: copy excerpts exactly as they appear in the source, including punctuation and capitalization. Keep each excerpt under 1,200 characters. Do not paraphrase inside an excerpt. Up to six excerpts per answer.",
    "",
    "Rules for writing:",
    "- Plain language. Short sentences. Keep each answer short.",
    "- Write the names of organizations, offices, divisions and programs in full every time. Never shorten them. For example write \"Department of Human Services\", \"Disability Services Division\" and \"home and community-based services\".",
    "- Refer to any individual person by role only, such as \"the case manager\" or \"the person receiving services\", never by name, even when a source names them.",
    "- Facts only. No praise, no recommendations, no status labels.",
    "- Do not describe how the answers were produced or what produced them. The feature is called Analyze a document.",
    "",
    "Also return a summary of the whole analysis in five sentences at most, and a list of limitations: things the sources leave open or do not settle, in plain language.",
    "",
    "Return a JSON object with these fields: summary (string); answers (array of { questionId, kind, text, citations: [{ sourceId, excerpt }] }); limitations (array of strings). Use each question's id exactly as given.",
  ].join("\n");

  const questionLines = instrument.stages.flatMap(stage => [
    `Stage: ${stage.title}${stage.description ? ` — ${stage.description}` : ""}`,
    ...stage.questions.map(question => `- id: ${question.id}\n  question: ${question.prompt}${question.help ? `\n  help: ${question.help}` : ""}`),
  ]);

  const communityId = effectiveCommunityId(request.communityId);
  const context = request.context?.trim();

  const sourceBlocks = request.sources.map(source => [
    `=== Source id: ${source.id} ===`,
    `Title: ${source.title}`,
    source.note ? `Reading note: ${source.note}` : "",
    "Text:",
    source.text,
    `=== End of source ${source.id} ===`,
  ].filter(Boolean).join("\n"));

  const user = [
    "QUESTIONS",
    ...questionLines,
    "",
    "WHAT THE STAFF MEMBER WANTS TO KNOW OR DECIDE",
    context || "(not given)",
    "",
    "COMMUNITY",
    communityId ? `This work concerns the community page with id: ${communityId}` : "(none)",
    "",
    `SOURCES (${request.sources.length})`,
    ...sourceBlocks,
  ].join("\n");

  return { system, user };
}

/**
 * The plain message to show when the prompt built from this request would exceed what the
 * model adapters accept, or undefined when it fits. Measured in bytes, as the adapters measure
 * it, so multi-byte text is counted the way it will be sent. Checked before the request limit
 * and the ledger, so a request that can never succeed costs the person nothing.
 */
export function promptTooLarge(request: AnalysisRequest, instrument: Instrument = getInstrument(request.instrumentId)): string | undefined {
  const { system, user } = buildPrompt(instrument, request);
  return Buffer.byteLength(system + user, "utf8") > PROMPT_BYTE_LIMIT ? TOO_MUCH_TEXT_MESSAGE : undefined;
}

/* ---------- Validation of the model's draft ---------- */

const collapse = (text: string) => text.replace(/\s+/g, " ").trim();

/**
 * Keep only citations whose excerpt occurs verbatim (after collapsing whitespace, case-sensitive)
 * in the named source; downgrade evidence with no surviving citation to inference; drop answers to
 * unknown questions; keep the instrument's order; add a gap answer for every unanswered question.
 */
export function validateDraft(draft: AnalysisDraft, request: AnalysisRequest, instrument: Instrument = getInstrument(request.instrumentId)): AnalysisAnswer[] {
  const sourceText = new Map(request.sources.map(source => [source.id, collapse(source.text)]));
  const byQuestion = new Map<string, AnalysisAnswer>();
  for (const answer of draft.answers) {
    if (byQuestion.has(answer.questionId)) continue;
    const citations = answer.citations.filter(citation => {
      const text = sourceText.get(citation.sourceId);
      const excerpt = collapse(citation.excerpt);
      return text !== undefined && excerpt.length > 0 && text.includes(excerpt);
    });
    const kind = answer.kind === "evidence" && citations.length === 0 ? "inference" : answer.kind;
    byQuestion.set(answer.questionId, { questionId: answer.questionId, kind, text: answer.text, citations });
  }
  return questionsOf(instrument).map(question =>
    byQuestion.get(question.id) ?? { questionId: question.id, kind: "gap", text: GAP_TEXT, citations: [] },
  );
}

/* ---------- Next steps for gaps ---------- */

const MAX_STEPS_PER_GAP = 2;

/**
 * For each gap, up to two guidance links from the instrument whose keywords occur as whole words
 * in the answer or the question ("format" never matches "information"). No duplicate links overall.
 */
export function nextSteps(instrument: Instrument, answers: AnalysisAnswer[]): NextStep[] {
  const questions = new Map(questionsOf(instrument).map(question => [question.id, question]));
  const used = new Set<string>();
  const steps: NextStep[] = [];
  for (const answer of answers) {
    if (answer.kind !== "gap") continue;
    const question = questions.get(answer.questionId);
    const haystack = [answer.text, question?.prompt ?? "", question?.help ?? ""].join(" ");
    let added = 0;
    for (const link of instrument.guidance) {
      if (added >= MAX_STEPS_PER_GAP) break;
      if (used.has(link.href)) continue;
      if (!anyKeywordMatches(link.keywords, haystack)) continue;
      const step = nextStepSchema.safeParse({ questionId: answer.questionId, label: link.label, href: link.href, why: link.why });
      if (!step.success) continue;
      used.add(link.href);
      steps.push(step.data);
      added += 1;
    }
  }
  return steps;
}

/* ---------- Privacy gate ---------- */

/**
 * Runs the Ask privacy gate over the context and over every source's title, text and reading note,
 * since all of them reach the prompt. Returns the gate's message when it refuses.
 */
/**
 * Names of offices, divisions, programs and organizations the program knows about. The
 * privacy gate treats two capitalized words beside a word such as "disability" as a person's
 * name with sensitive details, so "Disability Services Division" would be refused. Known
 * organization names are replaced with a plain phrase before the gate runs; everything
 * else is checked exactly as the gate checks an Ask question.
 */
const FIXED_ORGANIZATION_NAMES = [
  "Minnesota Department of Human Services", "Department of Human Services", "Disability Services Division",
  "Aging and Disability Services Administration", "Aging and Adult Services Division", "Deaf and Hard of Hearing Services Division",
  "Behavioral Health Administration", "Health Care Administration", "Office of Inspector General", "Licensing Division",
  "Minnesota Disability Law Center", "Minnesota Council on Disability", "Governor's Council on Developmental Disabilities",
  "Disability Hub MN", "Disability Linkage Line", "Community-Based Services Manual", "Equity Analysis Toolkit",
  "Office of Indian Affairs", "Minnesota Department of Health", "Minnesota Department of Employment and Economic Development",
  "Vocational Rehabilitation Services", "State Services for the Blind", "Social Security Administration",
  "Centers for Medicare and Medicaid Services", "Minnesota Board on Aging", "Minnesota Aging Pathways", "Senior LinkAge Line",
  "Waiver Reimagine", "Employment First", "Technology First", "Positive Supports Rule", "Olmstead Plan",
];
let knownNamePattern: RegExp | undefined;
function knownNames(): RegExp {
  if (knownNamePattern) return knownNamePattern;
  const names = new Set<string>(FIXED_ORGANIZATION_NAMES);
  for (const org of ORGANIZATIONS) { names.add(org.name); if (org.alsoKnownAs) names.add(org.alsoKnownAs); }
  for (const unit of getSystemConnections().structure) names.add(unit.name);
  const escaped = [...names].filter(name => name.length >= 4).sort((a, b) => b.length - a.length).map(name => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  knownNamePattern = new RegExp(`\\b(?:${escaped.join("|")})(?:['\u2019]s)?\\b`, "g");
  return knownNamePattern;
}

/** The text the privacy gate sees: known organization names replaced with "the organization". */
export function textForPrivacyGate(text: string): string {
  return text.replace(knownNames(), "the organization");
}

export function privacyRefusal(request: AnalysisRequest): string | undefined {
  const texts = [request.context ?? "", ...request.sources.flatMap(source => [source.title, source.text, source.note ?? ""])];
  for (const text of texts) {
    if (!text) continue;
    const result = askPrivacyGate(textForPrivacyGate(text));
    if (!result.ok) return result.message ?? "This material may include private information about a person, so it was not analyzed. Remove names, identifiers and any case, medical or personnel details, then try again.";
  }
  return undefined;
}

/* ---------- Analysis ---------- */

function counts(answers: AnalysisAnswer[]): AnalysisResponse["counts"] {
  const out = { evidence: 0, inference: 0, gap: 0 };
  for (const answer of answers) out[answer.kind] += 1;
  return out;
}

function unavailable(instrument: Instrument, reason: string): AnalysisResponse {
  return {
    instrumentId: instrument.id,
    summary: "",
    answers: [],
    limitations: [],
    nextSteps: [],
    counts: { evidence: 0, inference: 0, gap: 0 },
    unavailable: true,
    unavailableReason: reason,
    notice: ANALYSIS_NOTICE,
  };
}

const UNAVAILABLE_REASON = "The analysis service is not available on this site right now. You can still work through the questions below yourself.";

/**
 * Run one analysis. The request is validated by the route. Nothing here is logged or stored;
 * the audit record carries only a trace id, the tool name and the instrument id.
 */
export async function analyze(request: AnalysisRequest): Promise<AnalysisOutcome> {
  const instrument = getInstrument(request.instrumentId);

  const refusal = privacyRefusal(request);
  if (refusal) return { refusal: true, message: refusal };

  const tooLarge = promptTooLarge(request, instrument);
  if (tooLarge) return { refusal: true, message: tooLarge };

  if (!cloneAgentsEnabled()) return unavailable(instrument, UNAVAILABLE_REASON);

  let ctx;
  try {
    ctx = contextFor("ask_concierge", "staff");
  } catch {
    return unavailable(instrument, UNAVAILABLE_REASON);
  }
  const binding = resolveBinding(ctx.agent);
  if (!binding.generative) return unavailable(instrument, UNAVAILABLE_REASON);

  const { system, user } = buildPrompt(instrument, request);
  const complete = (correction = "") => runTool(
    ctx,
    "answer.structured_draft",
    () => binding.adapter.complete(
      {
        model_id: binding.model.model_id,
        system: system + correction,
        user,
        schema: analysisDraftSchema,
        maxTokens: MODEL_MAX_TOKENS,
        timeoutMs: MODEL_TIMEOUT_MS,
        trace_id: ctx.trace_id,
      },
      binding.model,
    ),
    { modelId: binding.model.model_id, contentIds: ["tool-analyze-" + instrument.id] },
  );

  let parsed = analysisDraftSchema.safeParse((await complete()).parsed);
  if (!parsed.success) {
    // One more try with a reminder of the exact shape; the draft's own text is never echoed back.
    parsed = analysisDraftSchema.safeParse((await complete("\n\nThe previous reply did not match the required JSON shape. Return exactly: { summary, answers: [{ questionId, kind, text, citations: [{ sourceId, excerpt }] }], limitations }. Keep each answer under 4,000 characters and each excerpt under 1,200 characters.")).parsed);
  }
  if (!parsed.success) throw new Error("analysis_draft_invalid");

  const draft: AnalysisDraft = {
    // Written results are plain text: any Markdown markup is removed and the words stay.
    summary: plainText(writeNamesInFull(parsed.data.summary)),
    limitations: parsed.data.limitations.map(item => plainText(writeNamesInFull(item))),
    answers: parsed.data.answers.map(answer => ({ ...answer, text: plainText(writeNamesInFull(answer.text)) })),
  };
  const answers = validateDraft(draft, request, instrument);

  return {
    instrumentId: instrument.id,
    summary: draft.summary,
    answers,
    limitations: draft.limitations,
    nextSteps: nextSteps(instrument, answers),
    counts: counts(answers),
    unavailable: false,
    notice: ANALYSIS_NOTICE,
  };
}
