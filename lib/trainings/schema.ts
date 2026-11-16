/**
 * A narrated, branching training: the facilitator is the on-screen narrator; the learner moves through concept
 * segments and a workplace simulation whose choices change what happens next. No scores are shown. Hidden measures
 * (openness to learning, relationship trust, team engagement) only choose which consequence the learner sees.
 *
 * One training has a shared core (the concept segments, reflection, action plan, facilitator material) and one
 * simulation per version: an all-staff version and one for each job family that has its own. Every version is built
 * from the existing corpus; `sources` names the readings each part draws on.
 *
 * Captions (WebVTT), the transcript and the decision map are generated from this file, never written by hand.
 */
import { z } from "zod";
import { JOB_FAMILY_IDS } from "../workforce/matrix.ts";

const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/).max(120);
const text = z.string().min(1).max(4000);

/** The six coaching styles. "affirm" is for a strong choice; the others coach any choice. */
export const FEEDBACK_STYLES = ["affirm-extend", "compare-coach", "normalize-reframe", "reflective-prompt", "feed-forward", "another-perspective"] as const;
export const FeedbackSchema = z.object({ style: z.enum(FEEDBACK_STYLES), text }).strict();

/**
 * The recurring cast: eight people who appear as standalone figures on white slides (public/images/learning-guides).
 * They play everyone in a course: the hosts, the coaching voice and the people in the scenarios. Nobody has a name;
 * people are described by role. Casting rotates so no trait or job level is tied to one look.
 */
export const PORTRAITS = ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"] as const;
export const portrait = z.enum(PORTRAITS);

/** One screen: who stands on it, what is shown, what is said, and any words on screen. */
export const SceneSchema = z.object({
  id,
  figure: portrait,
  visual: text,
  on_screen: z.array(z.string().min(1).max(300)).max(8).default([]),
  narration: text,
}).strict();

export const CheckSchema = z.object({
  id,
  prompt: text,
  options: z.array(z.object({ id, text: z.string().min(1).max(400), strong: z.boolean(), feedback: z.array(FeedbackSchema).min(1).max(3) }).strict()).min(3).max(4),
}).strict();

export const SegmentSchema = z.object({
  id,
  title: z.string().min(1).max(120),
  minutes: z.number().positive().max(30),
  scenes: z.array(SceneSchema).min(1),
  check: CheckSchema.optional(),
  reflection: z.array(z.string().min(1).max(400)).max(4).default([]),
  sources: z.array(id).min(1),
}).strict();

/** Openness to learning, relationship trust and team engagement: never shown, they only pick the consequence. */
const measure = z.enum(["low", "medium", "high"]);
export const MeasuresSchema = z.object({ learning: measure, trust: measure, engagement: measure }).strict();

export const ChoiceSchema = z.object({
  id,
  text: z.string().min(1).max(400),
  measures: MeasuresSchema,
  /** What happens in the room after this choice: the narrative consequence. */
  consequence: text,
  feedback: z.array(FeedbackSchema).min(2).max(4),
  /** The decision this choice leads to: another decision's id, a recovery decision, or "end". */
  next: z.union([id, z.literal("end")]),
}).strict();

export const DecisionSchema = z.object({
  id,
  /** A recovery decision gives a second chance after a weaker choice. */
  recovery: z.boolean().default(false),
  setup: text,
  prompt: z.string().min(1).max(300),
  choices: z.array(ChoiceSchema).min(2).max(4),
}).strict();

/** A person in a scenario: described by role, played by a cast member. */
export const CastRoleSchema = z.object({ role: id, label: z.string().min(1).max(80), portrait }).strict();

export const SimulationSchema = z.object({
  /** The cast member who introduces this version ("in your work as ..."). */
  intro_by: portrait,
  intro: text,
  /** Everyone in the scenario, by role. Text refers to them by their label, never by a name. */
  cast: z.array(CastRoleSchema).min(1).max(8),
  /** "all-staff" or a job family id. */
  version: z.union([z.literal("all-staff"), z.enum(JOB_FAMILY_IDS as [string, ...string[]])]),
  level: z.enum(["foundational", "intermediate", "advanced"]),
  title: z.string().min(1).max(160),
  learner_role: text,
  background: text,
  start: id,
  decisions: z.array(DecisionSchema).min(3),
  /** What the learner practiced, shown at the end instead of a score. */
  practiced: z.array(z.string().min(1).max(200)).min(3).max(8),
  this_week: z.array(z.string().min(1).max(300)).min(2).max(5),
  sources: z.array(id).min(1),
}).strict();

export const FacilitatorSchema = z.object({
  purpose: text,
  delivery: z.array(z.string().min(1).max(300)).min(1),
  preparation: z.array(z.string().min(1).max(300)).min(1),
  agenda: z.array(z.object({ title: z.string().min(1).max(160), minutes: z.number().positive(), steps: z.array(text).min(1), notes: z.array(text).default([]) }).strict()).min(3),
  talking_points: z.array(z.object({ moment: z.string().min(1).max(160), say: z.array(text).min(1) }).strict()).min(3),
  when_stalls: z.array(z.string().min(1).max(200)).min(2),
  when_tense: z.array(z.string().min(1).max(200)).min(2),
  follow_up: z.array(z.string().min(1).max(300)).min(1),
  /** Notes for running the job-family versions. */
  version_notes: z.record(z.string(), text).default({}),
}).strict();

export const TrainingSchema = z.object({
  id,
  title: z.string().min(1).max(160),
  subtitle: z.string().min(1).max(200),
  summary: text,
  minutes: z.number().positive().max(120),
  competencies: z.array(z.string()).min(1).max(3),
  objectives: z.array(z.string().min(1).max(300)).min(3).max(6),
  narrator: z.object({ role: z.string().min(1).max(120), voice_notes: z.string().max(400).default("") }).strict(),
  /** The topic's photorealistic hero image (owner rule 2026-11-15: every training has one, 4K). */
  hero: z.object({ src: z.string().regex(/^\/images\//), width: z.number().int().positive(), height: z.number().int().positive(), alt: z.string().min(1).max(300) }).strict(),
  /** The two cast members who host the course. */
  hosts: z.tuple([portrait, portrait]),
  segments: z.array(SegmentSchema).min(3),
  simulations: z.array(SimulationSchema).min(1),
  action_plan: z.array(z.string().min(1).max(300)).min(3).max(6),
  closing: SceneSchema,
  facilitator: FacilitatorSchema,
  sources: z.array(z.object({ slug: id, title: z.string().min(1), url: z.string().url().nullable() }).strict()).min(1),
}).strict();

export type Training = z.infer<typeof TrainingSchema>;
export type Simulation = z.infer<typeof SimulationSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
export type Choice = z.infer<typeof ChoiceSchema>;

/** Problems a schema cannot see: broken branches, unreachable decisions, a version listed twice. */
export function trainingProblems(t: Training): string[] {
  const problems: string[] = [];
  const versions = new Set<string>();
  for (const sim of t.simulations) {
    if (versions.has(sim.version)) problems.push(`version ${sim.version} appears twice`);
    versions.add(sim.version);
    const ids = new Set(sim.decisions.map(d => d.id));
    if (!ids.has(sim.start)) problems.push(`${sim.version}: start "${sim.start}" is not a decision`);
    for (const d of sim.decisions) for (const c of d.choices) if (c.next !== "end" && !ids.has(c.next)) problems.push(`${sim.version}/${d.id}/${c.id}: next "${c.next}" is not a decision`);
    // Every decision must be reachable from the start, and every path must end.
    const seen = new Set<string>([sim.start]);
    const queue = [sim.start];
    while (queue.length) {
      const next = queue.shift();
      const d = sim.decisions.find(x => x.id === next);
      for (const c of d?.choices ?? []) if (c.next !== "end" && !seen.has(c.next)) { seen.add(c.next); queue.push(c.next); }
    }
    for (const d of sim.decisions) if (!seen.has(d.id)) problems.push(`${sim.version}: decision "${d.id}" cannot be reached`);
    if (!sim.decisions.some(d => d.choices.some(c => c.next === "end"))) problems.push(`${sim.version}: no path ends`);
    const main = sim.decisions.filter(d => !d.recovery);
    if (main.length < 3) problems.push(`${sim.version}: needs three main decisions`);
    for (const d of main) if (!d.choices.some(c => c.measures.learning === "high" && c.feedback.some(f => f.style === "affirm-extend"))) problems.push(`${sim.version}/${d.id}: no strong choice with Affirm and Extend feedback`);
    // Lessons from review: options of similar length (20 to 35 words), and the strong option never the longest.
    const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
    for (const d of sim.decisions) {
      for (const c of d.choices) if (words(c.text) < 20 || words(c.text) > 35) problems.push(`${sim.version}/${d.id}/${c.id}: option is ${words(c.text)} words (use 20 to 35)`);
      const longest = Math.max(...d.choices.map(c => words(c.text)));
      for (const c of d.choices) if (c.measures.learning === "high" && words(c.text) === longest && d.choices.filter(x => words(x.text) === longest).length === 1) problems.push(`${sim.version}/${d.id}: the strong option is the longest`);
    }
  }
  if (!versions.has("all-staff")) problems.push("there is no all-staff version");
  return problems;
}
