import { describe, expect, it } from "vitest";
import { plainAnswerText } from "./plain-text";

describe("plain-text answers", () => {
  it("removes headings, emphasis, quotes and rules, and keeps the words", () => {
    expect(plainAnswerText("## First steps\n\n**Start small.** Ask *one* question, then __listen closely__.\n\n> People notice.\n\n---\nDone ~~later~~ now."))
      .toBe("First steps\n\nStart small. Ask one question, then listen closely.\n\nPeople notice.\n\nDone later now.");
  });
  it("keeps list items on their own lines, with numbers or hyphens", () => {
    expect(plainAnswerText("1. Send the agenda.\n2. **Ask** about access.\n* Captions\n+ Interpreters\n- Breaks\n  * Nested")).toBe("1. Send the agenda.\n2. Ask about access.\n- Captions\n- Interpreters\n- Breaks\n  - Nested");
  });
  it("keeps code and formulas as plain lines", () => {
    expect(plainAnswerText("Use this:\n```html\n<button type=\"button\">Join meeting</button>\n```\nThen call `save()` and compute 2**3, 3 * 4 * 5 and a*b*c with snake_case_name and __init__."))
      .toBe("Use this:\n<button type=\"button\">Join meeting</button>\nThen call save() and compute 2**3, 3 * 4 * 5 and a*b*c with snake_case_name and __init__.");
  });
  it("writes a link as its label and address, and leaves source numbers alone", () => {
    expect(plainAnswerText("See [the guide](https://example.org/guide \"Guide\") and [Find the right person](/support/right-person) [1][2]. ![Chart](https://example.org/c.png)"))
      .toBe("See the guide (https://example.org/guide) and Find the right person (/support/right-person) [1][2]. Chart (https://example.org/c.png)");
  });
  it("turns a table into plain rows", () => {
    expect(plainAnswerText("| Step | Who |\n|------|:---:|\n| Invite | Lead |\n| Follow up | Team |")).toBe("Step; Who\nInvite; Lead\nFollow up; Team");
  });
  it("leaves ordinary text exactly as it is", () => {
    const plain = "Rates rose 3% - 5% in 2024 (see page #12). Email a_b@example.org, use C# or F#, and write 5 > 3.\n\nNext: 1) plan; 2) ask.";
    expect(plainAnswerText(plain)).toBe(plain);
  });
  it("gives a steady result while an answer is still arriving", () => {
    const whole = "## Plan\n\n**Start small.** Then:\n\n- Ask `what helps`\n- Listen\n\n```\ncode line\n```\nEnd.";
    const final = plainAnswerText(whole);
    expect(final).toBe("Plan\n\nStart small. Then:\n\n- Ask what helps\n- Listen\n\ncode line\nEnd.");
    for (let length = 0; length <= whole.length; length++) expect(plainAnswerText(whole.slice(0, length))).not.toMatch(/^#|```/m);
  });
  it("handles nothing at all", () => {
    expect(plainAnswerText("")).toBe("");
    expect(plainAnswerText(undefined as unknown as string)).toBe("");
  });
});
