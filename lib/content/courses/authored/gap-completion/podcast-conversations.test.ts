import { describe, expect, it } from "vitest";
import conversations from "./podcast-conversations.json";
import { COURSES, loadScript, transcriptText } from "../../../../../scripts/media/record-culture-wellbeing-podcasts.mjs";
import everydayNorms from "./cw-everyday-norms";
import sustainablePace from "./cw-sustainable-pace";
import pacePressure from "./cw-pace-pressure-decisions";
import workloadBurnout from "./cw-workload-burnout";
import learningOrganization from "./cw-learning-organization";
import traumaInformed from "./cw-trauma-informed-teams";
import navigatorFoundation from "./cn-what-a-navigator-does";

describe("Culture and Well-Being and Cultural Navigation podcast conversations", () => {
  it("match the podcast scripts word for word, in the recorder's transcript format", () => {
    expect(Object.keys(conversations).sort()).toEqual([...COURSES].sort());
    for (const id of COURSES) {
      const { script } = loadScript(process.cwd(), id);
      expect((conversations as Record<string, string>)[id]).toBe(transcriptText(script.title, script.turns));
    }
  });

  it("reach each course pack as text; a recorded episode adds the audio on the course page", () => {
    for (const pack of [everydayNorms, sustainablePace, pacePressure, workloadBurnout, learningOrganization, traumaInformed, navigatorFoundation]) {
      expect(pack.course.introTranscript).toBe((conversations as Record<string, string>)[pack.course.id]);
      expect(pack.course.introAudio).toBeUndefined();
    }
  });
});
