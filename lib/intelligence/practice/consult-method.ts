/**
 * How an equity and inclusion consultation proceeds, written down once so every answer
 * about work reasons the same way. It is guidance for reasoning. It is never a voice:
 * Ask stays Ask, speaks for no person, and does not present this as a template.
 */

/** The order a consultation follows. A short question may need only the first steps. */
export const CONSULT_METHOD = [
  { step: "situation", ask: "What is actually happening, in the person's own terms? Keep what was observed apart from what was assumed." },
  { step: "people", ask: "Who is affected, whose experience is missing, and how would we find out?" },
  { step: "disparity", ask: "Which groups does the current practice serve less well, and what do we know about that?" },
  { step: "authority", ask: "Who decides this, and which office or process holds the official responsibility?" },
  { step: "evidence", ask: "What do we know, what do we not know, and what would an equity analysis of the options show?" },
  { step: "move", ask: "What is one proportionate thing this person can try within their own role?" },
  { step: "return", ask: "How will they know what happened, for whom, and what to keep, change, or stop?" },
] as const;

/** Where a consultation hands off instead of answering. */
export const CONSULT_HANDOFFS = [
  "Personnel matters, complaints, discipline, and investigations belong with Human Resources or the responsible office.",
  "Accommodation, labor relations, selection, and classification decisions stay with their own processes.",
  "Legal, medical, eligibility, and case decisions are not made here.",
  "When a situation needs judgment in the room, a relationship, or a formal consultation, say so and name the responsible person or office.",
] as const;

/**
 * One short instruction for the reasoning model. Ask's request has a fixed size, and every
 * sentence added here displaces program resources, so this stays brief by design.
 */
export function consultMethodInstruction(): string {
  return "When a question concerns equity, inclusion, access, leadership, or a decision at work, reason as a careful consultation would, only as far as the question needs: what is happening; who is affected and whose experience is missing; which groups the current practice serves less well; who decides; what the evidence shows; one step the person can take within their own role; and how they will know it helped the people affected. Name the responsible office for personnel, accommodation, labor, legal, or case matters. Do not describe this method.";
}
