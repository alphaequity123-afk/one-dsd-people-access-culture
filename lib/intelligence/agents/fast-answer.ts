import "server-only";

/**
 * The fast way to answer an ordinary typed question: one streamed reply written from the
 * passages already found, shown as it is written. Outside research, downloadable documents,
 * draft review and practice drafts stay with the full answer path and run only when asked for.
 */

export type FastSource = { id: string; title: string; excerpt: string };

const WANTS_PRODUCT = /\b(draft|write|create|make|prepare|generate|build|produce|revise|rewrite|update)\b[^.?!\n]{0,80}\b(document|memo|letter|e-?mail|spreadsheet|table|worksheet|checklist|template|slides?|deck|agenda|report|form|handout|one-pager|talking points|script|policy|procedure|plan|survey|rubric)\b|\b(download|export|word file|excel|powerpoint|pdf)\b/i;
const WANTS_WEB = /\b(search|look up|check|browse|find)\b[^.?!\n]{0,40}\b(web|online|internet|news)\b|\b(web|online|outside|deep|scholarly|academic|peer[- ]reviewed) (research|search|sources?|studies)\b/i;

/** A request the fast path leaves to the full one because it asks for something more than an answer in words. */
export function needsFullAnswerPath(question: string): boolean {
  return WANTS_PRODUCT.test(question) || WANTS_WEB.test(question);
}

export const fastAnswerEnabled = () => process.env.PAC_ASK_FAST?.trim().toLowerCase() !== "off" && Boolean(process.env.OPENAI_API_KEY?.trim());
const fastModel = () => process.env.PAC_ASK_FAST_MODEL?.trim() || "gpt-4.1";
const fastTokens = () => Math.max(200, Number(process.env.PAC_ASK_FAST_MAX_OUTPUT_TOKENS ?? 420) || 420);

const INSTRUCTIONS = `You are Ask, the question-and-answer tool for staff of the Minnesota Department of Human Services, Disability Services Division.

Rules:
- Always answer the question directly and helpfully. Never reply that you cannot answer, that nothing was found, or that the person should try again.
- Build the answer on the numbered program passages wherever they apply. Where they do not cover the question, or cover only part of it, answer the rest from sound general professional knowledge and make the difference clear in natural words (for example, "More generally, ...").
- Keep every condition, exception, limit and qualifier that a passage attaches to a rule. Do not present general knowledge as DHS policy or procedure. When a DHS-specific rule, deadline or contact matters and the passages do not give it, give the general answer and say who decides or where the current rule is kept.
- Never infer an individual's beliefs, needs, communication style, or ability from membership in a group.
- Do not include personal details about anyone. Decisions that belong to a person stay with the person or area responsible.
- Write colleague to colleague in plain, direct language. Lead with the answer, then the reasoning the question needs. Use a short numbered list only for steps. Keep the whole answer to about 200 words or fewer unless the person asks for more detail. Do not use web addresses, markdown headings, or the words "passage" or "knowledge base".
- After the answer, on a final line of its own, write "USED:" followed by the numbers of the passages the answer relied on, separated by commas, or "USED: none".`;

const SPOKEN = "\n- This answer will be read aloud: use short sentences and no lists, symbols or abbreviations.";

function input(question: string, sources: FastSource[], history: Array<{ question: string; answer: string }>): string {
  const earlier = history.slice(-2).map(turn => `Earlier question: ${turn.question}\nEarlier answer: ${turn.answer.slice(0, 900)}`).join("\n\n");
  const passages = sources.map((source, index) => `[${index + 1}] ${source.title}\n${source.excerpt.slice(0, 1600)}`).join("\n\n");
  return `${earlier ? earlier + "\n\n" : ""}Program passages:\n\n${passages || "(none found for this question)"}\n\nQuestion: ${question}`;
}

/** The part of the reply that is the answer itself: everything before the closing "USED:" line, or before one that has begun to arrive. */
export function visibleFastText(raw: string): string {
  const marker = raw.search(/\n?\s*USED:/);
  let text = marker >= 0 ? raw.slice(0, marker) : raw;
  // Hold back a trailing fragment that could be the start of the closing line.
  if (marker < 0) text = text.replace(/\n\s*U?S?E?D?:?$/, "");
  return text.trim();
}

export function usedSourceNumbers(raw: string, count: number): number[] {
  const line = raw.match(/USED:\s*([^\n]*)/)?.[1] ?? "";
  return Array.from(new Set((line.match(/\d+/g) ?? []).map(Number).filter(n => n >= 1 && n <= count)));
}

export async function writeFastAnswer(options: {
  question: string;
  sources: FastSource[];
  history: Array<{ question: string; answer: string }>;
  spoken?: boolean;
  onText?: (textSoFar: string) => void;
  signal?: AbortSignal;
  fetcher?: typeof fetch;
}): Promise<{ text: string; used: number[]; model: string }> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("fast_answer_not_configured");
  const model = fastModel();
  const response = await (options.fetcher ?? fetch)("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: "Bearer " + key, "content-type": "application/json" },
    body: JSON.stringify({
      model, store: false, stream: true, max_output_tokens: fastTokens(),
      instructions: INSTRUCTIONS + (options.spoken ? SPOKEN : ""),
      input: input(options.question, options.sources, options.history),
    }),
    signal: AbortSignal.any([AbortSignal.timeout(20_000), ...(options.signal ? [options.signal] : [])]),
  });
  if (!response.ok || !response.body) throw new Error("fast_answer_http_" + response.status);
  const decoder = new TextDecoder();
  let pending = "", raw = "", shown = "";
  const handle = (line: string) => {
    if (!line.startsWith("data:")) return;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") return;
    let event: { type?: string; delta?: string };
    try { event = JSON.parse(payload); } catch { return; }
    if (event.type === "response.failed" || event.type === "error") throw new Error("fast_answer_stream_failed");
    if (event.type !== "response.output_text.delta" || typeof event.delta !== "string") return;
    raw += event.delta;
    const text = visibleFastText(raw);
    if (text.length > shown.length) { shown = text; options.onText?.(text); }
  };
  for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
    pending += decoder.decode(chunk, { stream: true });
    let at: number;
    while ((at = pending.indexOf("\n")) >= 0) { handle(pending.slice(0, at).replace(/\r$/, "")); pending = pending.slice(at + 1); }
  }
  if (pending.trim()) handle(pending.trim());
  const text = visibleFastText(raw);
  if (!text) throw new Error("fast_answer_empty");
  return { text, used: usedSourceNumbers(raw, options.sources.length), model };
}
