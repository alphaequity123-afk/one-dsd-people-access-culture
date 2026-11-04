import type { LeadershipStyleSlug } from "@/components/leadership-style-video";

/**
 * Shapes for the leadership-styles learning pathway. The pathway compares what
 * leaders do, not who they are: no lesson classifies, scores or predicts a person.
 */

/** Where an approach sits in the pathway's curriculum judgment about equity (a judgment, not a measurement). */
export type ConduciveGroup = "foundation" | "contributor" | "conditional" | "support" | "higher-risk";

export type StyleQuote = { quote: string; why: string };

export type StyleLesson = {
  slug: string;
  name: string;
  /** A short phrase: the operating logic in a few words. */
  tagline: string;
  group: ConduciveGroup;
  /** The short card and optional narrated video on the Cultural Intelligence page, when one exists. */
  legacyVideo?: LeadershipStyleSlug;
  /** Working definition and boundaries. */
  definition: readonly string[];
  isNot: readonly string[];
  /** A stronger and a harmful response to the common scenario, “Who gets the visible work?” */
  stronger: StyleQuote;
  harmful: StyleQuote;
  /** A second, different conflict: how this approach tends to resolve it, and a stronger resolution. */
  conflict: { title: string; situation: string; tendency: string; stronger: string };
  promotes: readonly string[];
  undermines: readonly string[];
  race: string;
  swot: { strengths: readonly string[]; weaknesses: readonly string[]; opportunities: readonly string[]; threats: readonly string[] };
  helpsWhen: readonly string[];
  avoidWhen: readonly string[];
  complements: readonly { slug: string; why: string }[];
  safeguards: readonly string[];
  assessment: { label: string; text: string };
  practice: { situation: string; steps: readonly string[] };
  review: readonly string[];
};

export type ScenarioResponse = { slug: string; kind: "stronger" | "harmful"; quote: string; analysis: string };

export type ScenarioFamily = {
  id: string;
  /** The family named in the pathway design, for example “Scarce resources and competing priorities”. */
  family: string;
  title: string;
  situation: readonly string[];
  /** The separate matters a leader must address, rather than collapsing them into one dispute. */
  matters: readonly string[];
  /** What must go through an authorized process instead of a team conversation. */
  formal: string;
  responses: readonly ScenarioResponse[];
  combination: readonly string[];
  discuss: readonly string[];
};
