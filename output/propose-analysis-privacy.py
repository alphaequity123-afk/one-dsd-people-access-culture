import json,hashlib
from pathlib import Path
edits={
'app/equity-review/analyze/page.tsx':[("Nothing you upload or paste is stored, and the result goes back to your browser only.","Attaching a file sends it to the service for text extraction. Selecting Analyze sends the text and your question for processing, which may use an outside answer service. Use only public or appropriately de-identified material approved for this purpose. Keeping a result in your browser is optional; review the storage details before saving it.")],
'components/analysis/source-intake.tsx':[("Files are read into text in this session only and are not stored.","Attached files are sent to the service to extract their text and return it to this page. If you later keep an analysis in your browser, its supplied text is saved with the result.")],
'components/analysis/analyze-workspace.tsx':[
('Nothing you upload or paste is stored. Use public or de-identified material; leave out names and personal details.','Use only public or appropriately de-identified material approved for this purpose. Attaching a file sends it for text extraction; Analyze sends the supplied text and question for processing and may use an outside answer service. Leave out names, case details and other confidential information.'),
('This analysis and the material you supplied are kept in this browser only, on this device. Forget removes them.','This analysis and the supplied text are saved in this browser profile. Others using the same profile may see them. Forget removes this saved copy; printed, copied or downloaded versions remain separate.'),
('Keep in this browser stores this analysis and the material you supplied in this browser only, on this device. Nothing is sent anywhere.','Keep in this browser saves the analysis and supplied text in this browser profile. It does not submit them again for analysis. Others using the same profile may see the saved copy. Printing or copying creates a separate version.')]
}
records=[]
for file,pairs in edits.items():
 s=Path(file).read_text(encoding='utf8');changes=[]
 for before,after in pairs:
  assert s.count(before)==1,(file,before)
  changes.append({'before':before,'after':after})
 records.append({'file':file,'sourceSha256':hashlib.sha256(Path(file).read_bytes()).hexdigest(),'original':s,'changes':changes})
Path('output/analysis-privacy-proposal.json').write_text(json.dumps({'records':records,'basis':'Full AnalyzeWorkspace, SourceIntake and route source read; upload route extracts server-side, analysis route calls configured answer adapter, explicit keep writes request+result in localStorage. No global no-storage/retention promise. Follow-up behavior fix needed: forget/clear currently ignore remove failure; settle ignores update failure.'},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
