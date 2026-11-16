from pathlib import Path
import json
updates = {
 'tool-idi': {
  ('summary',): 'The Intercultural Development Inventory is a licensed assessment administered by qualified professionals. This program explains its developmental framework but does not administer the assessment, reproduce protected material, or use individual results for employment decisions or access to learning.',
  ('body', 1): 'Purpose and model: the IDI places results along the Intercultural Development Continuum, whose five orientations are Denial, Polarization, Minimization, Acceptance and Adaptation. Integration belongs to Bennett\'s separate Developmental Model of Intercultural Sensitivity, where it concerns identity across cultural worldviews. Community participation in service design is a program practice; it is not a sixth IDI orientation or an assessment result.',
  ('body', 2): 'Evidence: review the publisher\'s research and validation material alongside relevant independent studies. Consider the population, methods, uses and limitations of each study before drawing a conclusion about a particular setting.',
  ('body', 3): 'Interpretation: the publisher describes individual and group reports as snapshots of an approach to cultural differences and commonalities. Individual results are discussed with a licensed Qualified Administrator. A result is not a judgment of character or a complete account of workplace behavior; this program does not use it for hiring, promotion or performance evaluation.',
  ('body', 5): 'Program use: learn about the framework, consider questions for development, and seek qualified administration if an assessment is appropriate. This program does not administer, score, store or interpret individual results. It does not reproduce protected assessment material. Learning and reflection can begin without taking an assessment.',
 },
 'tool-implicit-association': {
  ('summary',): 'Implicit-association tasks examine associations through response patterns such as reaction times. A single result does not establish someone\'s character or reliably predict a specific action. This program links to these resources for optional reflection and does not use individual results for workplace decisions.',
  ('body', 1): 'Purpose: compare the relative ease of associating concepts, evaluations or stereotypes. Implicit and explicitly reported attitudes may differ; the task does not establish whether a person consciously endorses an association.',
  ('body', 2): 'Evidence and limits: Project Implicit describes continuing debate about repeated scores and behavioral prediction. It cautions against treating one result as a permanent personal characteristic or a reliable prediction of one person\'s behavior on a particular occasion. Use the result as a question for reflection, not a diagnosis.',
  ('body', 4): 'Program use: optional reflection without submitting or discussing individual results here. External research sites have their own participation and data-handling terms; read those before deciding whether to use a task. This program does not administer the tests or collect their results.',
 },
}
inventory = json.loads(Path('output/editorial-source-inventory.json').read_text(encoding='utf-8'))
records = []
for id, fields in updates.items():
    source = next(row for row in inventory['resources'] if row['id'] == id)
    changes = []
    for path, after in fields.items():
        before = source
        for key in path:
            before = before[key]
        changes.append({'path': list(path), 'before': before, 'after': after, 'reason': 'Clarify the separate models, research limits and program boundaries using the identified primary sources; remove internal drafting provenance.'})
    records.append({'target': 'resource.' + id, 'kind': 'resource', 'route': '/library/' + id, 'original': source, 'changes': changes})
Path('output/assessment-tool-revisions.json').write_text(json.dumps({'records': records, 'sources': ['https://www.idiinventory.com/idc', 'https://www.idiinventory.com/assessment-and-reports', 'https://www.idrinstitute.org/dmis/', 'https://implicit.harvard.edu/implicit/faqs.html'], 'basis': 'Read original tool cards, publisher IDC and assessment pages, Project Implicit FAQ, and indexed primary Bennett DMIS model page after direct site timeout. No assessment items reproduced; no pricing or effectiveness guarantees added.'}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(sum(len(row['changes']) for row in records), 'proposed tool-card fields')
