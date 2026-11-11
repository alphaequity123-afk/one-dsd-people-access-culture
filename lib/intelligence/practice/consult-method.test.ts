import { describe, expect, it } from "vitest";
import { CONSULT_HANDOFFS, CONSULT_METHOD, consultMethodInstruction } from "./consult-method";

describe("consult method", () => {
  it("follows the consultation order, with disparity asked before the decision and a return at the end", () => {
    expect(CONSULT_METHOD.map(item => item.step)).toEqual(["situation", "people", "disparity", "authority", "evidence", "move", "return"]);
  });

  it("gives the reasoning model one brief instruction that keeps the order and the hand-off", () => {
    const text = consultMethodInstruction();
    const order = ["what is happening", "who is affected", "serves less well", "who decides", "evidence shows", "one step the person can take", "how they will know it helped"];
    const positions = order.map(phrase => text.indexOf(phrase));
    expect(positions.every(position => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(text).toContain("Name the responsible office");
    expect(text.length).toBeLessThan(650);
    expect(CONSULT_HANDOFFS.length).toBeGreaterThan(0);
  });

  it("is method only: it names no person and uses none of the words Ask never uses about itself", () => {
    const text = consultMethodInstruction();
    expect(text).not.toMatch(/\b(Gary|twin|persona|AI|assistant|chatbot|bot|model|machine|automated|generated)\b/i);
  });
});
