p='lib/intelligence/agents/ask.ts'; raw=open(p,encoding='utf8',newline='').read(); crlf='\r\n' in raw; s=raw.replace('\r\n','\n')
def rep(old,new):
    global s
    assert s.count(old)==1, (s.count(old), old[:70]); s=s.replace(old,new)
NOTE='"Some references could not be confirmed against the current sources and were left out. Open the listed sources to confirm details."'
rep('      out = { ...out, parsed: verified.draft };',
    '      out = { ...out, parsed: verified.draft };\n      writtenDraft = verified.draft;\n      if (verified.unresolved.length || !verified.reviewed) limits.push('+NOTE+');')
rep('      if (cited.dropped) throw new Error("generated_evidence_rejected");',
    '      // An unconfirmed reference is left out; the written answer stays.\n      if (cited.dropped) limits.push('+NOTE+');')
rep('          if (checkedClaims.length < proposed.length) throw new Error("generated_evidence_rejected");',
    '          if (checkedClaims.length < proposed.length) limits.push('+NOTE+');')
old_tail='''      degraded = true;
      generative = false; evidenceClaims = []; answerSources = []; workProduct = undefined; practiceArtifact = undefined; followUpQuestions = [];
      draft = { shortAnswer: "Ask could not finish a verified answer. Please try again shortly.", whyItMatters: "" };
      limits.push("We could not finish a full answer. Any program material or public research we found is still shown.");
    }'''
new_tail='''      degraded = true;
      generative = false; evidenceClaims = []; workProduct = undefined; practiceArtifact = undefined; followUpQuestions = [];
      // A person who asks always gets an answer in words, never a stock notice. What was written is
      // given without its unconfirmed references; failing that, the answer composed from the program's
      // own sources above stands.
      const written = writtenDraft && typeof writtenDraft === "object" ? writtenDraft as { shortAnswer?: unknown; whyItMatters?: unknown } : undefined;
      const writtenShort = typeof written?.shortAnswer === "string" ? askAnswerText(written.shortAnswer) : "";
      if (writtenShort && !/^\s*[\[{]\s*["'](?:role|system|provider)["']\s*:/.test(writtenShort)) {
        draft = { shortAnswer: writtenShort, whyItMatters: typeof written?.whyItMatters === "string" ? askAnswerText(written.whyItMatters) : "" };
        answerSources = [];
        limits.push('''+NOTE+''');
        failureCode = undefined; failureDetail = undefined;
      } else if (programRelated && draft.shortAnswer.trim()) {
        // The composed answer and its sources remain in place.
        failureCode = undefined; failureDetail = undefined;
      }
    }'''
rep(old_tail,new_tail)
old_ev='''      if (known === "generated_evidence_rejected") {
        evidenceRejected = true; evidenceClaims = []; answerSources = []; practiceArtifact = undefined;
        draft = { shortAnswer: "I couldn’t match the answer’s references to the current source material. Please try again for an answer using the current version.", whyItMatters: ""};
      }
'''
rep(old_ev,'')
rep('  let failureCode: string | undefined;','  let failureCode: string | undefined;\n  let writtenDraft: unknown;')
rep('      took.write = Date.now() - writeBegan;','      took.write = Date.now() - writeBegan;\n      writtenDraft = out.parsed;')
open(p,'w',encoding='utf8',newline='').write(s.replace('\n','\r\n') if crlf else s)
print('patched', crlf)
