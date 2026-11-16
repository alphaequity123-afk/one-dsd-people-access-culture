from pathlib import Path
import json

proposals = {
 'app/my-work/action-plan/page.tsx': [
  ('Turn one idea into one change you can see at work. Name a small first step, a real moment to try it, and a date thirty days out to look back.', 'Connect one learning insight with a next step within your responsibility. Identify what you need to retain, examine or revise, who should be involved, and when to review the result. The form starts with a thirty-day review date; adjust it to fit the work.'),
  ('Why a plan this small works', 'Make the plan specific enough to review'),
  ('Change sticks when it is specific, tied to a moment you already face and reviewed soon after. A single behavior you try three times teaches more than a long list you never start. The review questions help you separate what you observed from what you hoped, and decide whether to keep, adjust or stop.', 'A specific step gives you something to examine later: what you did, what happened, and what remains uncertain. Use the plan to prepare rather than to claim authority or predict success. Follow required review and approval processes before changing actual work, and use the review to decide whether to retain, adjust or stop an approach.'),
 ],
 'components/course-lesson.tsx': [
  (': one change you will try, a first step and a date to look back. It stays on this computer.', ': identify a next step within your responsibility and a date to review it. The evidence may support retaining a practice, revising it, or seeking further review. Saved plans remain in this browser profile unless you export or share a copy.'),
 ],
 'app/my-work/page.tsx': [
  ('Choose a change to try and a time to look back.', 'Prepare a next step and a date to review what happened.'),
  ('One change you will try, a first step and a thirty-day look back.', 'A next step within your responsibility, with a review date you can adjust.'),
 ],
 'lib/implementation/records.ts': [
  ('label: "What I will do differently", help: "A specific behavior you can see or hear. Start with a verb: ask, offer, check, invite, write."', 'label: "What I will do next", help: "Identify a specific step within your responsibility. The evidence may support retaining a practice, making a change, checking a question or seeking the responsible review."'),
  ('Something you can do in fifteen minutes or less.', 'A manageable first step; note any information, support or authorization needed before proceeding.'),
  ('Thirty days is a good rhythm. Change it if another date fits.', 'The form starts with a thirty-day review date. Adjust it to the work and any required timing.'),
  ('A week suits a small step. A month shows whether it lasted.', 'The form starts with a one-week review date. Choose a date that lets you examine the experience without assuming a fixed period will establish its effects.'),
  ('Kept by you. People, Access and Culture keeps no copy of this record.', 'This is an exported copy. Any saved browser or team-space copies are separate; manage each according to the requirements that apply to your work.'),
 ],
 'components/record-workbench.tsx': [
  ('Saved on this computer.', 'Saved in this browser profile.'),
  ('Remove "${active.title}" from this computer? This cannot be undone.', 'Remove "${active.title}" from this browser profile? Exported or shared copies will remain.'),
  ('Removed from this computer.', 'Removed from this browser profile.'),
  ('Leave out client, case, health and personnel details. This stays on this computer unless you choose otherwise.', 'Leave out client, case, health and personnel details. Entries save automatically in this browser profile, where others using the profile may see them. Downloaded, printed or shared copies are separate.'),
  ('The team space could not save this record. It is still on your computer.', 'The team space could not save this record. Your current work remains on this page; check its saved status or download a copy before leaving.'),
  ('The team space could not be reached. Your record is still on your computer.', 'The team space could not be reached. Your current work remains on this page; check its saved status or download a copy before leaving.'),
  ('Saved to the team space for the One DSD Team and the consultant. Your copy stays here too.', 'Saved to the team space for the One DSD Team and the consultant. This confirmation applies to the shared copy.'),
 ],
}
records = []
for file, pairs in proposals.items():
    original = Path(file).read_text(encoding='utf-8')
    for before, after in pairs:
        assert original.count(before) == 1, (file, before, original.count(before))
    records.append({'file': file, 'original': original, 'changes': [{'before': before, 'after': after} for before, after in pairs]})
Path('output/action-plan-shared-revisions.json').write_text(json.dumps({'records': records, 'basis': 'All source files read in full. RecordWorkbench autosaves to localStorage, exports files, and conditionally shares via a separate team-space button. Default dates are editable. Preserve schema, recorded media and formal authority; remove unsupported timing claims and blanket no-copy statements.'}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(sum(len(record['changes']) for record in records), 'proposed fields')
