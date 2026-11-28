import "server-only";
import type { Simulation, Training } from "@/lib/dsd-live/trainings/schema";
import { currentUnit } from "@/lib/dsd-live/unit";
import { bullets, compactSections, heading, paragraph, section, type ResourceDocument } from "./model";

/**
 * A downloadable copy of a narrated training in the version the page shows: the shared segments, that version's
 * scenario with every choice and what follows from it, the action plan and sources. Nothing about the person is included.
 */
export function trainingDocument(t: Training, sim: Simulation, versionTitle: string, pageUrl: string): ResourceDocument {
  const unit = currentUnit();
  return {
    kicker: unit.name,
    title: t.title,
    subtitle: t.subtitle,
    meta: [
      { label: "Version", value: versionTitle },
      { label: "Length", value: `About ${t.minutes} minutes` },
      { label: "Page", value: pageUrl },
    ],
    sections: compactSections([
      section("What you will practice", [bullets(t.objectives)]),
      ...t.segments.map((seg, n) => section(`${n + 1}. ${seg.title}`, [
        ...seg.scenes.flatMap(scene => [scene.on_screen.length ? bullets(scene.on_screen) : null, paragraph(scene.narration)]),
        seg.check ? heading("Check your understanding", 3) : null,
        seg.check ? paragraph(seg.check.prompt) : null,
        seg.check ? bullets(seg.check.options.map(o => o.text)) : null,
        seg.reflection.length ? heading("Reflect", 3) : null,
        seg.reflection.length ? bullets(seg.reflection) : null,
      ])),
      section(`${versionTitle}: ${sim.title}`, [
        paragraph(sim.intro),
        paragraph(sim.learner_role),
        paragraph(sim.background),
        bullets(sim.cast.map(c => c.label)),
      ]),
      ...sim.decisions.map((d, n) => section(d.recovery ? "A second chance" : `Decision ${n + 1}`, [
        paragraph(d.setup),
        paragraph(d.prompt),
        ...d.choices.flatMap(c => [heading(c.text, 3), paragraph(c.consequence), ...c.feedback.map(f => paragraph(f.text))]),
      ])),
      section("What you practiced", [bullets(sim.practiced)]),
      section("This week", [bullets(sim.this_week)]),
      section("Your action plan", [bullets(t.action_plan), paragraph(t.closing.narration)]),
    ]),
    sources: t.sources.map(s => ({ title: s.title, href: s.url ?? undefined })),
    attribution: `${unit.name}. Copy made from the published training: ${pageUrl}`,
  };
}
