p='lib/intelligence/agents/ask.ts'; raw=open(p,encoding='utf8',newline='').read(); s=raw.replace('\r\n','\n')
def rep(old,new):
    global s
    assert s.count(old)==1,(s.count(old),old[:60]); s=s.replace(old,new)
rep('      } else if (programRelated && draft.shortAnswer.trim()) {','      } else if (programRelated && input.mode !== "review" && draft.shortAnswer.trim()) {')
rep('''    if (degraded && !binding.generative) {
      failureCode = "generation_unavailable";''','''    // An answer composed from the program's own sources is a real answer; it is not reported as a failure.
    const composedAnswer = programRelated && input.mode !== "review" && Boolean(draft.shortAnswer.trim());
    if (degraded && !binding.generative && !composedAnswer) {
      failureCode = "generation_unavailable";''')
rep('    if (binding.generative && !pureResearchAnswer) { failureCode = "provider_request_failed"; failureDetail = "provider_deadline_exceeded"; degraded = true; }',
    '    if (binding.generative && !pureResearchAnswer) { degraded = true; if (!composedAnswer) { failureCode = "provider_request_failed"; failureDetail = "provider_deadline_exceeded"; } }')
open(p,'w',encoding='utf8',newline='').write(s.replace('\n','\r\n'))
