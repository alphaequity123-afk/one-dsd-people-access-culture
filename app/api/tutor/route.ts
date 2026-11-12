import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { readBoundedJson } from "@/lib/http/request";
import { getAgent } from "@/lib/intelligence/registry/agents";
import { resolveBinding } from "@/lib/intelligence/providers";
import { consumeRequestLimit, rateLimitHeaders } from "@/lib/security/rate-limit";
import { tutorGrounding } from "@/lib/tutor/grounding";
import { scoreChoice, tutorItem } from "@/lib/tutor/items";
import { MAX_BODY_BYTES, TutorRequestSchema, type TutorResponse } from "@/lib/tutor/request";
import { leaksAnswer } from "@/lib/tutor/leak-guard";
import { plainAnswerText } from "@/lib/ask/plain-text";
import { fallbackReply, replyText, TutorReplySchema, tutorSystemPrompt, tutorUserPrompt, type TutorReply } from "@/lib/tutor/prompt";

/**
 * Guidance for one practice question. The server re-scores the choice with the
 * content engine (a client cannot claim correctness: extra fields are
 * rejected), grounds the guide in the knowledge graph, asks the generation
 * provider for a three-part reply, checks that reply for answer leaks, and adds
 * one to anonymous monthly totals. No identity, cookie, network address or
 * learner message is stored; the request limit keeps only an opaque hash.
 */
const headers = { "cache-control": "no-store" };
export async function GET() {
  return NextResponse.json({ error: "Open a lesson to use guided practice." }, { status: 405, headers: { ...headers, allow: "POST" } });
}

async function generate(input: { system: string; user: string; traceId: string }): Promise<TutorReply | null> {
  const binding = resolveBinding(getAgent("ask_concierge"), { fallback: true });
  if (!binding.generative) return null;
  const out = await binding.adapter.complete(
    { model_id: binding.model.model_id, system: input.system, user: input.user, schema: TutorReplySchema, maxTokens: 700, timeoutMs: 25_000, trace_id: input.traceId },
    binding.model,
  );
  const parsed = TutorReplySchema.safeParse(out.parsed);
  if (!parsed.success) return null;
  // Guidance is plain text: any Markdown markup is removed and the words stay.
  const plain = (text: string) => plainAnswerText(text).trim() || text;
  return { restatement: plain(parsed.data.restatement), guidance: plain(parsed.data.guidance), nextStep: plain(parsed.data.nextStep) };
}

export async function POST(request: NextRequest) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Open guided practice from this program." }, { status: 403, headers });
  const body = await readBoundedJson(request, MAX_BODY_BYTES);
  if (!body.ok) return NextResponse.json({ error: body.message }, { status: body.status, headers });
  const parsed = TutorRequestSchema.safeParse(body.value);
  if (!parsed.success) return NextResponse.json({ error: "This request could not be read." }, { status: 400, headers });
  const { lessonId, itemId, chosenIndex, attemptNumber, strategy, learnerMessage } = parsed.data;
  const item = tutorItem(lessonId, itemId);
  if (!item) return NextResponse.json({ error: "That question is not part of this lesson." }, { status: 404, headers });
  if (chosenIndex >= item.options.length) return NextResponse.json({ error: "That option is not part of this question." }, { status: 400, headers });

  let limited: NextResponse | null = null;
  try {
    // "staff-ask" is already registered in the production database; a new scope would be refused there.
    const limit = await consumeRequestLimit(request, { scope: "staff-ask", limit: 120, windowSeconds: 600 });
    if (!limit.allowed) limited = NextResponse.json({ error: "Please wait before asking for more guidance." }, { status: 429, headers: { ...headers, ...rateLimitHeaders(limit) } });
  } catch {
    return NextResponse.json({ error: "Guided practice is unavailable right now." }, { status: 503, headers });
  }
  if (limited) return limited;

  // Correctness comes from the content engine only; nothing the client sent is trusted for it.
  const scored = scoreChoice(item, chosenIndex);
  const grounding = tutorGrounding(lessonId);

  let reply: TutorReply | null = null;
  try {
    reply = await generate({
      system: tutorSystemPrompt(lessonId),
      user: tutorUserPrompt({ item, chosenIndex, correct: scored.correct, attemptNumber, strategy, grounding: grounding.text, learnerMessage }),
      traceId: randomUUID(),
    });
  } catch {
    // The adapter has already logged the provider status. The learner still gets the lesson feedback.
    reply = null;
  }
  if (reply && leaksAnswer(replyText(reply), item, chosenIndex)) reply = fallbackReply(item, chosenIndex, scored.correct);

  // Owner rule: lesson activity is private between the learner and the program.
  // Nothing about a guidance round is counted, stored or shown to anyone.

  const response: TutorResponse = {
    correct: scored.correct,
    feedback: scored.feedback,
    tutor: reply ? replyText(reply) : null,
    parts: reply,
    strategy,
    grounding: grounding.links,
  };
  return NextResponse.json(response, { status: 200, headers });
}
