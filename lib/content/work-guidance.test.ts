import { describe, expect, it } from "vitest";
import { withoutSystemNotices } from "./work-guidance";
import { staticPageCopy } from "./page-copy-contract";
import { DIRECTOR_TOOLKIT_INTRO } from "./director-toolkit";

describe("guidance without statements about the system", () => {
  it("keeps the guidance and drops sentences about saving, sending, recording and voluntary use", () => {
    expect(withoutSystemNotices("Do not include names. Progress is saved in the web browser you are using and is not used to rank anyone.")).toBe("Do not include names.");
    expect(withoutSystemNotices("These notes are not saved. Copy or download what you want to keep before leaving.")).toBe("Copy or download what you want to keep before leaving.");
    expect(withoutSystemNotices("This program does not record who you contact or what you plan. The planning tool on these pages saves nothing.")).toBe("");
    expect(withoutSystemNotices("Ordinary learning and practice are voluntary. Notes you choose to save stay on this computer.")).toBe("");
    expect(withoutSystemNotices("Saved on this computer")).toBe("");
  });
  it("leaves guidance about the work itself alone", () => {
    for (const guidance of [
      "Never record who is disabled or any accommodation history. Describe the pathway, not people.",
      "Do not record or score individual participants' beliefs.",
      "Leave out names, case details, personnel information, and other confidential information.",
    ]) expect(withoutSystemNotices(guidance)).toBe(guidance);
  });
  it("turns the registry wording staff see into plain guidance", () => {
    expect(withoutSystemNotices(staticPageCopy("home").aboutText)).toBe("Ask a question, find guidance, practice with something you can use, or identify the right person to involve.");
    expect(withoutSystemNotices(staticPageCopy("footer").privacyText)).not.toMatch(/saved|computer/i);
    expect(withoutSystemNotices(staticPageCopy("footer").privacyText)).toMatch(/^Please leave out case, medical, personnel/);
    expect(withoutSystemNotices(DIRECTOR_TOOLKIT_INTRO.privacy)).not.toMatch(/autosave|submit/i);
    expect(withoutSystemNotices(DIRECTOR_TOOLKIT_INTRO.privacy)).toMatch(/Keep sensitive employee concerns/);
  });
});
