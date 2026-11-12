import { describe, expect, it } from "vitest";
import { partialStringField } from "./partial-answer";

describe("reading an answer while it is still being written", () => {
  it("returns nothing until the field starts", () => {
    expect(partialStringField("", "shortAnswer")).toBeUndefined();
    expect(partialStringField("{\"shortAn", "shortAnswer")).toBeUndefined();
    expect(partialStringField("{\"shortAnswer\":", "shortAnswer")).toBeUndefined();
  });
  it("returns the text so far, then the whole text", () => {
    expect(partialStringField("{\"shortAnswer\":\"Start with", "shortAnswer")).toBe("Start with");
    expect(partialStringField("{\"shortAnswer\": \"Start with one step.\",\"whyItMatters\":\"Because", "shortAnswer")).toBe("Start with one step.");
    expect(partialStringField("{\"shortAnswer\":\"A\",\"whyItMatters\":\"Because", "whyItMatters")).toBe("Because");
  });
  it("decodes escapes and waits for one that is cut off", () => {
    expect(partialStringField("{\"shortAnswer\":\"Line one\\nLine \\\"two\\\"", "shortAnswer")).toBe("Line one\nLine \"two\"");
    expect(partialStringField("{\"shortAnswer\":\"Half\\", "shortAnswer")).toBe("Half");
    expect(partialStringField("{\"shortAnswer\":\"Caf\\u00e9 \\u00", "shortAnswer")).toBe("Café ");
    expect(partialStringField("{\"shortAnswer\":\"Smile \\ud83d", "shortAnswer")).toBe("Smile ");
    expect(partialStringField("{\"shortAnswer\":\"Smile \\ud83d\\ude00!", "shortAnswer")).toBe("Smile 😀!");
  });
  it("matches what a full parse gives for every prefix of a real reply", () => {
    const answer = "Try this:\n1. Ask \"what would help?\"\n2. Listen — then act. 100% \\ done ✅";
    const json = JSON.stringify({ shortAnswer: answer, whyItMatters: "It keeps the choice with the person." });
    let last = "";
    for (let length = 0; length <= json.length; length++) {
      const partial = partialStringField(json.slice(0, length), "shortAnswer") ?? "";
      expect(answer.startsWith(partial)).toBe(true);
      expect(partial.length).toBeGreaterThanOrEqual(last.length);
      last = partial;
    }
    expect(last).toBe(answer);
  });
});

import { readStringField } from "./partial-answer";

describe("knowing when the answer text is finished", () => {
  it("reports the field as complete only once its closing quote has arrived", () => {
    expect(readStringField("{\"shortAnswer\":\"Still writing", "shortAnswer")).toEqual({ text: "Still writing", complete: false });
    expect(readStringField("{\"shortAnswer\":\"Done.\"", "shortAnswer")).toEqual({ text: "Done.", complete: true });
    expect(readStringField("{\"shortAnswer\":\"Quote \\\"", "shortAnswer")).toEqual({ text: "Quote \"", complete: false });
    expect(readStringField("{", "shortAnswer")).toBeUndefined();
  });
});
