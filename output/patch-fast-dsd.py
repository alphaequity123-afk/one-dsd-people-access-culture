p = 'lib/intelligence/agents/ask.ts'
raw = open(p, encoding='utf8', newline='').read()
crlf = '\r\n' in raw
s = raw.replace('\r\n', '\n')

def rep(old, new):
    global s
    assert s.count(old) == 1, (s.count(old), old[:80])
    s = s.replace(old, new)

rep('import { readStringField } from "./partial-answer";',
    'import { readStringField } from "./partial-answer";\nimport { fastAnswerEnabled, needsFullAnswerPath, writeFastAnswer } from "./fast-answer";')

rep('  let hits: SearchHit[] = [];\n  try {\n    hits = await runTool(ctx, "corpus.semantic_retrieve", async () =>',
'''  // The fast way: an ordinary typed question is answered in one streamed reply from the passages found here.
  // Outside research, downloadable documents, draft review, practice drafts and work with Tribal Nations
  // keep the full path below, which also takes over if anything here fails.
  const fastEligible = fastAnswerEnabled() && input.mode !== "review" && !input.pathId && !suppliedArtifact.success && !suppliedWork.success
    && (input.researchMode ?? "auto") === "auto" && !explicitProgramOnly && !explicitNewPractice
    && !needsFullAnswerPath(question) && !asksForCurrentInformation(question) && !asksForScholarlyResearch(question)
    && !HIGH_STAKES.test(question) && !(TRIBAL_SUBJECT.test(retrievalQuestion) && TRIBAL_WORK.test(retrievalQuestion))
    && !isProgramTrainingCreditQuestion(retrievalQuestion) && !isLearningNavigationQuestion(retrievalQuestion) && !isMeasurementPlanningQuestion(retrievalQuestion);
  if (fastEligible) {
    try {
      const docs = await staffDocs();
      took.docs = Date.now() - startedAt;
      const searchBegan = Date.now();
      // Meaning search gets a short time limit; word search is immediate and always available.
      const semantic = Promise.race([
        runTool(ctx, "corpus.semantic_retrieve", async () => semanticRetrieveForAgent(retrievalQuestion, all, docs, ctx.agent, 5), { modelId: ctx.agent.model_setting.embed_model_id }).catch(() => [] as SearchHit[]),
        new Promise<SearchHit[]>(resolve => setTimeout(() => resolve([]), 1200)),
      ]);
      const lexical = await runTool(ctx, "corpus.search", async () => searchDocs(retrievalQuestion, docs, { limit: 6, intents: all }));
      const found = hybridSearchHits(await semantic, lexical, 5);
      const strong = found.length > 0 && ((lexical[0]?.score ?? 0) >= 4 || found.length >= 3);
      const fastSources = strong ? citationEvidenceFromDocs(found, docs, { question: retrievalQuestion }).filter(source => source.citeable).slice(0, 5) : [];
      took.read = Date.now() - startedAt;
      took.search = Date.now() - searchBegan;
      if ((await getPolicy()).killed) throw new Error("ask_paused");
      reportProgress(sink, { type: "stage", stage: "writing" });
      const writeBegan = Date.now();
      const written = await runTool(ctx, "answer.structured_draft", () => writeFastAnswer({
        question, history, spoken: input.responseMode === "spoken",
        sources: fastSources.map(source => ({ id: source.id, title: source.title, excerpt: source.excerpt })),
        onText: text => { if (took.first_text === undefined) took.first_text = Date.now() - startedAt; reportProgress(sink, { type: "text", text: plainLiveText(text) }); },
      }), { contentIds: fastSources.map(source => source.id) });
      took.write = Date.now() - writeBegan;
      reportProgress(sink, { type: "stage", stage: "finishing" });
      const usedSources = written.used.map(number => fastSources[number - 1]).filter(Boolean);
      const shortAnswer = askAnswerText(written.text);
      if (!shortAnswer) throw new Error("fast_answer_empty");
      took.total = Date.now() - startedAt;
      console.info("ask_timing", { traceId: ctx.trace_id, generative: true, fast: true, ...took });
      return { kind: "answer", answer: {
        context, intent: primary, shortAnswer, whyItMatters: "",
        sources: usedSources, limits: [],
        nextActions: usedSources.filter(source => /^\\/(?!\\/)/.test(source.href)).slice(0, 3).map(source => ({ label: "Open " + source.title.slice(0, 240), href: source.href })),
        grounding: usedSources.length ? "partial" : "none", degraded: false, generative: true,
      } };
    } catch (error) {
      // Nothing is lost: what was shown is set aside and the full path answers instead.
      console.error("ask_fast_failed", { traceId: ctx.trace_id, code: error instanceof Error ? error.message.slice(0, 80) : "unknown" });
      reportProgress(sink, { type: "reset" });
      reportProgress(sink, { type: "stage", stage: "reading" });
    }
  }
  let hits: SearchHit[] = [];
  try {
    hits = await runTool(ctx, "corpus.semantic_retrieve", async () =>''')
open(p, 'w', encoding='utf8', newline='').write(s.replace('\n', '\r\n') if crlf else s)
print('ok')
