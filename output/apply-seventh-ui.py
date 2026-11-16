import json
from pathlib import Path
for name in ['leading-privacy','analysis-privacy']:
 p=json.loads(Path('output/'+name+'-proposal.json').read_text(encoding='utf8'))
 for r in p['records']:
  f=Path(r['file']);s=f.read_text(encoding='utf8')
  for c in r['changes']:
   assert s.count(c['before'])==1,(r['file'],c['before']);s=s.replace(c['before'],c['after'])
  f.write_text(s,encoding='utf8')
 p['review']={'status':'accepted','reviewer':'root','scope':'Exact authored field changes and observed behavior; no blanket legal or privacy certification.'}
 Path('docs/editorial/'+name+'-review.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
f=Path('components/analysis/analyze-workspace.tsx');s=f.read_text();s=s.replace('if (writeKept(analyzed)) setKept(true);','if (writeKept(analyzed)) { setKept(true); setError(""); }');f.write_text(s,encoding='utf8')
f=Path('components/analysis/analyze-workspace.test.tsx');s=f.read_text().replace('kept in this browser only','saved in this browser profile');point='  it("preserves the current result and saved-state controls when removal fails",'
pos=s.index(point)
s=s[:pos]+'''  it("clears the storage error after a successful keep retry", async () => {
    await mount(vi.fn(async () => ({ ok: true, json: async () => response() })) as unknown as typeof fetch);
    await analyze();
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw Error("Blocked"); });
    await act(async () => { button("Keep in this browser").click(); });
    expect(document.querySelector("[role=alert]")?.textContent).toContain("did not allow");
    write.mockRestore();
    await act(async () => { button("Keep in this browser").click(); });
    expect(document.querySelector("[role=alert]")).toBeNull();
    expect(button("Forget")).toBeTruthy();
  });

'''+s[pos:];f.write_text(s,encoding='utf8')
f=Path('components/my-view-client.tsx');s=f.read_text()
s=s.replace('  function remove(key: string) {','  function remove(key: string) {\n    let removed = false;')
s=s.replace('      writeStored("local", BROWSER_STORAGE_KEYS.learningPracticeNotes, Object.keys(notes).length ? { ...practice, notes } : null);','      removed = writeStored("local", BROWSER_STORAGE_KEYS.learningPracticeNotes, Object.keys(notes).length ? { ...practice, notes } : null);')
s=s.replace('      writeStored(storageArea, storageKey, list);','      removed = writeStored(storageArea, storageKey, list);')
s=s.replace('      const removed = writeStored("local", key, null);','      removed = writeStored("local", key, null);')
s=s.replace('      if (removed && path) writeStored("local", BROWSER_STORAGE_KEYS.pathArtifactSource(path.id), null);','      if (removed && path) removed = writeStored("local", BROWSER_STORAGE_KEYS.pathArtifactSource(path.id), null);')
s=s.replace('    }\n  }\n\n  function clearAsk() {\n    writeStored("session", BROWSER_STORAGE_KEYS.askSession, null);','    }\n    setClearNotice(removed ? "The selected saved item has been removed from this browser profile." : "The selected item could not be fully removed. Saved information may remain in this browser profile. Please try again.");\n  }\n\n  function clearAsk() {\n    const removed = writeStored("session", BROWSER_STORAGE_KEYS.askSession, null);\n    setClearNotice(removed ? "The Ask conversation has been cleared from this tab." : "The Ask conversation could not be cleared from this tab. Please try again.");')
f.write_text(s,encoding='utf8')
