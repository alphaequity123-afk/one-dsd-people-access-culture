p='lib/intelligence/retrieval/verified-draft.test.ts'; raw=open(p,encoding='utf8',newline='').read(); crlf='\r\n' in raw; s=raw.replace('\r\n','\n')
def rep(old,new):
    global s
    assert s.count(old)==1,(s.count(old),old[:60]); s=s.replace(old,new)
rep('''it("never loops or releases a draft with unresolved qualifications", async () => {
  const options = setup(); options.review.mockResolvedValue(revise);
  await expect(verifyAnswerDraft(options)).rejects.toThrow("generated_evidence_rejected");
  expect(options.repair).toHaveBeenCalledTimes(1);
});''','''it("never loops, and gives the corrected answer with its open findings rather than withholding it", async () => {
  const options = setup(); options.review.mockResolvedValue(revise);
  const result = await verifyAnswerDraft(options);
  expect(result.draft).toEqual({ shortAnswer: "Corrected" });
  expect(result.unresolved).toHaveLength(1);
  expect(options.repair).toHaveBeenCalledTimes(1);
});''')
rep('''it("does not release a sourced answer when the reviewer is unavailable", async () => {
  const options = setup(); options.review.mockRejectedValue(new Error("provider_unavailable"));
  await expect(verifyAnswerDraft(options)).rejects.toThrow("answer_review_failed");
  expect(options.repair).not.toHaveBeenCalled();
});''','''it("keeps the written answer, marked as unreviewed, when the reviewer is unavailable", async () => {
  const options = setup(); options.review.mockRejectedValue(new Error("provider_unavailable"));
  const result = await verifyAnswerDraft(options);
  expect(result).toMatchObject({ draft: { shortAnswer: "Draft" }, reviewed: false, unresolved: [] });
  expect(options.repair).not.toHaveBeenCalled();
});''')
rep('''  options.repair.mockResolvedValue({ shortAnswer: "Read https://invented.example/new" });
  await expect(verifyAnswerDraft(options)).rejects.toThrow("generated_evidence_rejected");
});''','''  options.repair.mockResolvedValue({ shortAnswer: "Read https://invented.example/new for details." });
  const result = await verifyAnswerDraft(options);
  expect(JSON.stringify(result.draft)).not.toContain("invented.example");
  expect(result.unresolved[0].problem).toBe("unverified_link");
});
it("keeps the first answer, without invented addresses, when the correction cannot be written", async () => {
  const options = { ...setup(), draft: { shortAnswer: "See [the guide](https://invented.example/guide) and https://agency.example/reading." } };
  options.repair.mockRejectedValue(new Error("generated_evidence_rejected"));
  const result = await verifyAnswerDraft(options);
  expect(result.draft).toEqual({ shortAnswer: "See the guide and https://agency.example/reading." });
});''')
rep('''  options.review.mockResolvedValueOnce(revise).mockResolvedValueOnce(revise);
  await expect(verifyAnswerDraft(options)).rejects.toThrow("generated_evidence_rejected");
  expect(options.review).toHaveBeenCalledTimes(2);''','''  options.review.mockResolvedValueOnce(revise).mockResolvedValueOnce(revise);
  expect((await verifyAnswerDraft(options)).unresolved).toHaveLength(1);
  expect(options.review).toHaveBeenCalledTimes(2);''')
s=s.replace('rejects a new invented address introduced during the repair','removes a new invented address introduced during the repair')
open(p,'w',encoding='utf8',newline='').write(s.replace('\n','\r\n') if crlf else s)
