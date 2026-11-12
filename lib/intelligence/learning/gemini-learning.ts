import "server-only";

export type LearningCitation = { id: string; title: string; href: string };
export type LearningPassage = { citation: LearningCitation; text: string; authority?: string };

export type LearningAnswer = {
  grounded: boolean;
  paragraphs: { text: string; sourceIds: string[] }[];
  sources: LearningCitation[];
};

export class GeminiLearningError extends Error {
  constructor(readonly code: "unavailable" | "busy" | "invalid", readonly providerStatus?: number) {
    super(code);
  }
}

const MODEL = "gemini-3.1-flash-lite";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

function schema(passageIds: string[]) {
  return {
    type: "object",
    required: ["grounded", "paragraphs"],
    properties: {
      grounded: { type: "boolean" },
      paragraphs: {
        type: "array",
        maxItems: 4,
        items: {
          type: "object",
          required: ["text", "passageIds"],
          properties: {
            text: { type: "string" },
            passageIds: {
              type: "array",
              minItems: 1,
              maxItems: 3,
              items: { type: "string", enum: passageIds },
            },
          },
        },
      },
    },
  };
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function checkedAnswer(value: unknown, citations: Map<string, LearningCitation>, insufficient: LearningAnswer): LearningAnswer {
  const result = record(value);
  if (result?.grounded === false) return insufficient;
  if (result?.grounded !== true || !Array.isArray(result.paragraphs) || result.paragraphs.length < 1 || result.paragraphs.length > 4) {
    throw new GeminiLearningError("invalid");
  }
  const used = new Map<string, LearningCitation>();
  const paragraphs = result.paragraphs.map(item => {
    const paragraph = record(item);
    const text = typeof paragraph?.text === "string" ? paragraph.text.trim() : "";
    if (!text || text.length > 900 || /https?:\/\/|www\.|<\/?[a-z]|\[[^\]]+\]\(/i.test(text) ||
      !Array.isArray(paragraph?.passageIds) || paragraph.passageIds.length < 1 || paragraph.passageIds.length > 3) {
      throw new GeminiLearningError("invalid");
    }
    const sourceIds = paragraph.passageIds.map(passageId => {
      const citation = typeof passageId === "string" ? citations.get(passageId) : undefined;
      if (!citation) throw new GeminiLearningError("invalid");
      used.set(citation.id, citation);
      return citation.id;
    });
    return { text, sourceIds: [...new Set(sourceIds)] };
  });
  return { grounded: true, paragraphs, sources: [...used.values()] };
}

export function insufficientLearningEvidence(text: string): LearningAnswer {
  return { grounded: false, paragraphs: [{ text, sourceIds: [] }], sources: [] };
}

export async function generateGeminiLearningAnswer(
  { instructions, task, context, question, passages, insufficient }: {
    instructions: string;
    task: string;
    context: Record<string, string>;
    question: string;
    passages: LearningPassage[];
    insufficient: LearningAnswer;
  },
  apiKey: string,
  signal: AbortSignal,
): Promise<LearningAnswer> {
  if (!passages.length) return insufficient;

  const excerpts = passages.map(({ citation, text, authority }, index) => ({ id: String(index + 1), citation, text, authority }));
  const citations = new Map(excerpts.map(({ id, citation }) => [id, citation]));

  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: instructions }] },
    contents: [{ role: "user", parts: [{ text: JSON.stringify({
      task,
      ...context,
      question,
      excerpts: excerpts.map(({ id, citation, text, authority }) => ({ id, reading: citation.title, text, authority })),
    }) }] }],
    generationConfig: {
      maxOutputTokens: 950,
      thinkingConfig: { thinkingLevel: "MINIMAL" },
      responseMimeType: "application/json",
      responseJsonSchema: schema([...citations.keys()]),
    },
  });

  const ask = () => fetch(ENDPOINT, {
    method: "POST",
    cache: "no-store",
    redirect: "error",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
    body: payload,
  });
  let response = await ask().catch(error => {
    if (error instanceof Error && error.name === "TimeoutError" && !signal.aborted) return null;
    throw error;
  });
  if ((!response || response.status === 503) && !signal.aborted) {
    // The provider sometimes returns a transient 503. Retry once within the
    // original deadline, without retrying rate limits or invalid requests.
    await response?.body?.cancel();
    response = await ask();
  }
  if (!response) throw new GeminiLearningError("unavailable");
  if (!response.ok) {
    await response.body?.cancel();
    throw new GeminiLearningError(response.status === 429 ? "busy" : "unavailable", response.status);
  }

  try {
    const envelope = await response.json() as {
      candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[];
      promptFeedback?: { blockReason?: string };
    };
    const candidate = envelope.candidates?.[0];
    if (envelope.promptFeedback?.blockReason || candidate?.finishReason === "SAFETY") return insufficient;
    if (candidate?.finishReason !== "STOP") throw new GeminiLearningError("invalid");
    const output = candidate.content?.parts?.filter(part => !part.thought).map(part => part.text ?? "").join("") ?? "";
    return checkedAnswer(JSON.parse(output), citations, insufficient);
  } catch {
    throw new GeminiLearningError("invalid");
  }
}
