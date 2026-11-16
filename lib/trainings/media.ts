/**
 * Captions, transcript and decision map, generated from a training file so they always match the script.
 * Caption timing is estimated from speaking pace until a recording exists; a recording replaces it with real cues.
 */
import type { Simulation, Training } from "./schema.ts";

const WORDS_PER_SECOND = 2.5;
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const stamp = (seconds: number) => {
  const ms = Math.round(seconds * 1000);
  const h = Math.floor(ms / 3_600_000), m = Math.floor(ms / 60_000) % 60, s = Math.floor(ms / 1000) % 60, r = ms % 1000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(r).padStart(3, "0")}`;
};

/** Split narration into caption lines of at most two short lines each, breaking at sentence and clause ends. */
export function captionChunks(narration: string, maxChars = 84): string[] {
  const sentences = narration.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= maxChars) { chunks.push(sentence); continue; }
    let current = "";
    for (const word of sentence.split(" ")) {
      if ((current + " " + word).trim().length > maxChars && current) { chunks.push(current.trim()); current = word; }
      else current = `${current} ${word}`;
    }
    if (current.trim()) chunks.push(current.trim());
  }
  return chunks;
}

/** The narrated scenes of one segment, in order. */
export function segmentNarration(t: Training, segmentId: string): Array<{ id: string; narration: string }> {
  const seg = t.segments.find(s => s.id === segmentId);
  return seg ? seg.scenes.map(s => ({ id: s.id, narration: s.narration })) : [];
}

/** WebVTT for a run of narrated scenes, with the narrator named on the first cue of each scene. */
export function toVtt(scenes: Array<{ id: string; narration: string }>, speaker = "Narrator"): string {
  let t = 0, n = 0;
  const cues: string[] = ["WEBVTT", ""];
  for (const scene of scenes) {
    captionChunks(scene.narration).forEach((chunk, i) => {
      const length = Math.max(1.2, words(chunk) / WORDS_PER_SECOND);
      cues.push(String(++n), `${stamp(t)} --> ${stamp(t + length)}`, i === 0 ? `<v ${speaker}>${chunk}` : chunk, "");
      t += length + 0.15;
    });
    t += 0.6;
  }
  return cues.join("\n");
}

/** A readable transcript of the whole training for one version: narration, choices and every coaching response. */
export function transcript(t: Training, version: string): string {
  const out: string[] = [`${t.title}: ${t.subtitle}`, ""];
  for (const seg of t.segments) {
    out.push(`${seg.title}`, "");
    for (const scene of seg.scenes) out.push(`Narrator: ${scene.narration}`, "");
    if (seg.check) {
      out.push(`Question: ${seg.check.prompt}`);
      for (const o of seg.check.options) out.push(`  ${o.text}`, ...o.feedback.map(f => `    Narrator: ${f.text}`));
      out.push("");
    }
    for (const r of seg.reflection) out.push(`Reflect: ${r}`);
    if (seg.reflection.length) out.push("");
  }
  const sim = t.simulations.find(s => s.version === version) ?? t.simulations.find(s => s.version === "all-staff")!;
  out.push(sim.title, "", sim.intro, "", `Your role: ${sim.learner_role}`, "", `In this scenario: ${sim.cast.map(c => c.label).join("; ")}`, "", sim.background, "");
  for (const d of sim.decisions) {
    out.push(d.recovery ? "A second chance" : "Decision", d.setup, "", d.prompt);
    for (const c of d.choices) {
      out.push(`  Choice: ${c.text}`, `    What happens: ${c.consequence}`, ...c.feedback.map(f => `    Narrator: ${f.text}`));
    }
    out.push("");
  }
  out.push("What you practiced", ...sim.practiced.map(p => `- ${p}`), "", "Try this week", ...sim.this_week.map(p => `- ${p}`), "");
  out.push("Your action plan", ...t.action_plan.map(p => `- ${p}`), "", `Narrator: ${t.closing.narration}`, "");
  out.push("Sources", ...t.sources.map(s => `- ${s.title}${s.url ? ` (${s.url})` : ""}`));
  return out.join("\n");
}

/** The branching map of one simulation as Mermaid text: decisions, choices and where each leads. */
export function decisionMap(sim: Simulation): string {
  const lines = ["flowchart TD"];
  const label = (s: string) => s.replace(/"/g, "'").slice(0, 70);
  for (const d of sim.decisions) {
    lines.push(`  ${d.id}["${d.recovery ? "Second chance: " : ""}${label(d.prompt)}"]`);
    for (const c of d.choices) {
      const target = c.next === "end" ? "end_node" : c.next;
      lines.push(`  ${d.id} -->|"${label(c.text)}"| ${target}`);
    }
  }
  lines.push(`  end_node(["Reflection and action plan"])`);
  return lines.join("\n");
}
