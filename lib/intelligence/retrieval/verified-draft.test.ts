import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { verifyAnswerDraft } from "./verified-draft";
const pass = { verdict: "pass", issues: [] };
const revise = { verdict: "revise", issues: [{ location: "shortAnswer", problem: "missing_qualification", explanation: "Retain the emergency conditions in the main answer.", sourceRefs: ["S2"] }] };
const setup = () => ({ draft: { shortAnswer: "Draft" }, allowedHrefs: ["https://agency.example/reading"], needsReview: () => true, review: vi.fn().mockResolvedValue(pass), repair: vi.fn().mockResolvedValue({ shortAnswer: "Corrected" }) });
it("reviews and checks the corrected answer, rather than approving the first repair automatically", async () => {
  const options = setup(); options.review.mockResolvedValueOnce(revise).mockResolvedValueOnce(pass);
  const result = await verifyAnswerDraft(options);
  expect(result.repaired).toBe(true); expect(options.review).toHaveBeenCalledTimes(2); expect(options.repair).toHaveBeenCalledTimes(1);
  expect(options.review.mock.calls[1][0]).toEqual({ shortAnswer: "Corrected" });
});
it("never loops or releases a draft with unresolved qualifications", async () => {
  const options = setup(); options.review.mockResolvedValue(revise);
  await expect(verifyAnswerDraft(options)).rejects.toThrow("generated_evidence_rejected");
  expect(options.repair).toHaveBeenCalledTimes(1);
});
it("checks citations hidden inside a generated document even if the model reviewer passes", async () => {
  const options = { ...setup(), draft: { workProduct: { sections: [{ paragraphs: ["Source: https://invented.example/guide"] }] } } };
  await verifyAnswerDraft(options);
  expect(options.repair.mock.calls[0][1].issues[0].problem).toBe("unverified_link");
});
it("does not release a sourced answer when the reviewer is unavailable", async () => {
  const options = setup(); options.review.mockRejectedValue(new Error("provider_unavailable"));
  await expect(verifyAnswerDraft(options)).rejects.toThrow("answer_review_failed");
  expect(options.repair).not.toHaveBeenCalled();
});
it("lets ordinary unsourced writing finish without an unnecessary review call", async () => {
  const options = { ...setup(), needsReview: () => false };
  expect((await verifyAnswerDraft(options)).repaired).toBe(false);
  expect(options.review).not.toHaveBeenCalled();
});
it("rejects a new invented address introduced during the repair", async () => {
  const options = setup(); options.review.mockResolvedValueOnce(revise).mockResolvedValueOnce(pass);
  options.repair.mockResolvedValue({ shortAnswer: "Read https://invented.example/new" });
  await expect(verifyAnswerDraft(options)).rejects.toThrow("generated_evidence_rejected");
});
it("still reviews a repaired answer after its original claim metadata is removed", async () => {
  const options = { ...setup(), needsReview: (draft: unknown) => JSON.stringify(draft).includes("Draft") };
  options.review.mockResolvedValueOnce(revise).mockResolvedValueOnce(revise);
  await expect(verifyAnswerDraft(options)).rejects.toThrow("generated_evidence_rejected");
  expect(options.review).toHaveBeenCalledTimes(2);
});
