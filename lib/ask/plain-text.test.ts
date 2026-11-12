import { describe, expect, it } from "vitest";
import { plainAnswerText, plainLiveText } from "./plain-text";

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

describe("an answer that is still arriving", () => {
  const marked = "## A place to start\n\n**Begin with one small step** for the team.\n\n1. Ask *what would help*, write it down, and `check back` in a week.\n2. Use C# or 2**3 if it helps.\n\n* Keep it short\n+ Say who decides\n\n> People notice.\n\n---\n\n| Step | Who |\n|---|---|\n| Invite | Lead |\n\n```html\n<button>Join</button>\n```\nSee [the guide](/library) and [Find the right person](https://example.org/x \"X\") [1].\n\n## Use C#";
  it("only ever grows, and ends as the finished plain text", () => {
    const final = plainAnswerText(marked).trim();
    let last = "";
    for (let length = 0; length <= marked.length; length++) {
      const shown = plainLiveText(marked.slice(0, length)).trimEnd();
      expect(shown.startsWith(last), JSON.stringify({ length, last: last.slice(-40), shown: shown.slice(-40) })).toBe(true);
      expect(shown).not.toMatch(/\*\*(?!3)|`|^#{1,6}\s|\]\(|^\s*[*+]\s|^\|/m);
      last = shown;
    }
    expect(final.startsWith(last)).toBe(true);
    expect(final).toBe("A place to start\n\nBegin with one small step for the team.\n\n1. Ask what would help, write it down, and check back in a week.\n2. Use C# or 2**3 if it helps.\n\n- Keep it short\n- Say who decides\n\nPeople notice.\n\nStep; Who\nInvite; Lead\n\n<button>Join</button>\nSee the guide (/library) and Find the right person (https://example.org/x) [1].\n\nUse C#");
  });
  it("shows plain writing exactly as it arrives", () => {
    const plain = "Send materials ahead of time.\n1. Ask what would help.\n2. Rates rose 3% - 5% (page #12); 3 * 4 = 12.\n- Offer more than one way to take part.";
    for (let length = 0; length <= plain.length; length++) {
      const shown = plainLiveText(plain.slice(0, length));
      expect(plain.startsWith(shown.trimEnd())).toBe(true);
      expect(plain.slice(0, length).length - shown.length).toBeLessThanOrEqual(2);
    }
  });
  it("keeps code inside a fence exactly as written", () => {
    const answer = "Here is the script.\n\n```python\n# add the totals\ntotal = a * b * c\n> not a quote\n```\n\n> A quoted line\n> 5 people waited";
    expect(plainAnswerText(answer)).toBe("Here is the script.\n\n# add the totals\ntotal = a * b * c\n> not a quote\n\nA quoted line\n> 5 people waited");
  });
  it("handles nothing at all", () => {
    expect(plainLiveText("")).toBe("");
    expect(plainLiveText(undefined as unknown as string)).toBe("");
  });
});

