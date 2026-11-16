from pathlib import Path
p=Path('output/check-fifth-lesson-sequences.cjs');s=p.read_text(encoding='utf8')
s=s.replace('"anti-racism-resource","critical-incidents-in-the-work","intercultural-conflict-styles"','"cultural-humility-vs-checklist","plain-language-in-human-services","intercultural-competence-without-a-score"')
s=s.replace('live-fifth-lesson-sequence-check.json','live-fifth-foundations-followup-check.json')
Path('output/check-fifth-foundations-followup.cjs').write_text(s,encoding='utf8')
