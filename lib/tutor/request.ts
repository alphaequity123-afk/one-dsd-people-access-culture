/** Request contract for guided practice; kept outside the route file, which may export only handlers. */
import { z } from "zod";
import type { GroundingLink } from "./grounding";
import { ITEM_ID, LESSON_ID } from "./items";
import type { TutorReply } from "./prompt";
import type { Strategy } from "./student-model";

export const MAX_BODY_BYTES = 4096;
export const TUTOR_PATH = "/api/tutor";

export const TutorRequestSchema = z.object({
  lessonId: z.string().regex(LESSON_ID),
  itemId: z.string().regex(ITEM_ID),
  chosenIndex: z.number().int().min(0).max(9),
  attemptNumber: z.number().int().min(1).max(5),
  // Listed inline rather than from STRATEGIES: a circular import left that array empty when the
  // route module was evaluated under the bundler.
  strategy: z.enum(["worked-example", "socratic-hint", "nudge", "stop"] satisfies Strategy[]),
  learnerMessage: z.string().max(500).optional(),
}).strict();

export type TutorResponse = {
  correct: boolean;
  feedback: string;
  tutor: string | null;
  parts: TutorReply | null;
  strategy: Strategy;
  grounding: GroundingLink[];
};
