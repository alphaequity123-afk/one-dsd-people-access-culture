from pathlib import Path
import json

proposals = {
    'lib/program/learning-credit.ts': [
        ('Everything in this program is voluntary, and it does not offer training credits. The one exception is the Equity Analysis Toolkit, which is required.', "This program does not offer training credits. Optional learning here supports DHS responsibilities under the Equity Policy, including applicable equity-analysis requirements and assigned agency training. Complete required training through the agency's designated process."),
    ],
    'components/participation-notice.tsx': [
        ('Learn at your own pace; none of this is required. Notes and progress you save stay on this computer until you delete them, which also means anyone else who uses this computer could see them. Nothing is shared with supervisors or program staff.', 'Use self-directed learning at your own pace. Where a feature lets you save notes or progress in this browser, others using the same browser profile may see them until you clear them. The app does not send those saved notes or progress to supervisors or program staff.'),
        ('The guided practices are for reading and downloading; this page does not save your answers or progress. If you saved notes in an earlier version of the site, they may still be in this browser and visible to anyone using this computer; this page neither shows nor deletes them. Nothing you read or download here goes to your supervisor or counts toward any evaluation.', 'The guided practices are for reading and downloading; this page does not save your answers or progress. Notes from an earlier version may remain in this browser profile and be visible to others using it; this page does not show or delete them. The app does not send reading or download reports to your supervisor or use them to evaluate you. Store completed downloads according to the requirements that apply to your work.'),
        ('Your saved resources, practice plans, reflection and course bookmarks stay in this browser until you clear them, so anyone using this computer could see them. None of it is sent to your supervisor or to program staff.', 'Saved resources, practice plans, reflections and course bookmarks remain in this browser profile until you clear them. Others using the same profile may see them. The app does not send these saved items to your supervisor or program staff.'),
        ('Taking part here is voluntary, and anything you save stays on this computer, under your control.', "Choose the optional learning or practice that fits your work. Read this page's details below for its privacy and storage limits. Formal responsibilities still apply."),
    ],
    'app/leading/page.tsx': [
        ('Everything here is public, and anyone can use it. You can start anywhere and skip anything.', 'The learning collection is open to everyone. Choose a starting point that fits your work; designated management resources require an access key. Follow any formal duties or assigned training that apply to your role.'),
        ('One course is required', 'Toolkit use and required training'),
        ('The Equity Analysis Toolkit is required of all staff of the Minnesota Department of Human Services, regardless of status. Everything else here is voluntary.', "DHS requires staff to use the Equity Analysis Toolkit and complete assigned Toolkit training through the agency's learning platform. The course linked here supports that work; it does not document completion of the agency's required training."),
        ('These are suggestions. Nobody is enrolled, and nobody else can see where you are.', 'These suggested paths do not enroll you or report your progress to a supervisor. If you save progress, others using the same browser profile may be able to see it.'),
        ('It answers general questions only.', 'Use general work questions and examples without confidential details.'),
    ],
    'app/practice/page.tsx': [
        ('Compare the three levels', 'Compare review options'),
        ('<p className={styles.related}><Link href="/learn/equity-toolkit#equity-analysis">', '<p>These starting points help organize your review. Confirm the required approach through the official policy, User Guide, and responsible equity office.</p>\n              <p className={styles.related}><Link href="/learn/equity-toolkit#equity-analysis">'),
    ],
}

records = []
for file, pairs in proposals.items():
    original = Path(file).read_text(encoding='utf-8')
    for before, after in pairs:
        assert original.count(before) == 1, (file, before)
    records.append({'file': file, 'original': original, 'changes': [{'before': before, 'after': after} for before, after in pairs]})
Path('output/shared-participation-route-revisions.json').write_text(json.dumps({'records': records, 'source': 'https://mn.gov/dhs/assets/equity-policy_tcm1053-646921.pdf', 'basis': 'Full official policy read, especially assigned agency training on page 5. Listed originals and browser storage implementation read. Optional app learning is distinct from formal duties and official training.'}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(sum(len(record['changes']) for record in records), 'proposed fields; no application files changed')
