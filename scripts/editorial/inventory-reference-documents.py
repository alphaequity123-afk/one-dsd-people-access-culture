"""Inventory public authored reference documents without changing content.

HTML text and Word paragraphs are separate review units. Script literals need
their own review; this collector never treats their exclusion as acceptance.
"""
import hashlib
import json
from pathlib import Path
import zipfile
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup, NavigableString

root = Path('public/library')
units = []
for file in sorted(root.rglob('*')):
    if file.suffix.lower() not in {'.html', '.htm', '.docx'}:
        continue
    raw = file.read_bytes()
    unit = {'id': file.as_posix().replace('/', '--'), 'file': file.as_posix(),
            'sourceSha256': hashlib.sha256(raw).hexdigest(), 'status': 'unreviewed',
            'kind': 'html-reference' if file.suffix != '.docx' else 'word-reference',
            'fields': [], 'protected': [], 'additionalReview': []}
    if file.suffix == '.docx':
        with zipfile.ZipFile(file) as archive:
            xml = ET.fromstring(archive.read('word/document.xml'))
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        for i, paragraph in enumerate(xml.findall('.//w:p', ns)):
            text = ''.join(n.text or '' for n in paragraph.findall('.//w:t', ns))
            if text.strip():
                unit['fields'].append({'fieldId': len(unit['fields']),
                                       'path': ['word/document.xml', 'paragraph', i],
                                       'before': text, 'classification': 'source_context_review'})
        unit['additionalReview'].append('Word structure, fields, tables and visual layout must remain intact if edited; matching HTML is a separate artifact.')
    else:
        soup = BeautifulSoup(raw.decode('utf-8-sig'), 'html.parser')
        body = soup.body or soup
        for i, node in enumerate(body.find_all(string=True)):
            if not isinstance(node, NavigableString) or not str(node).strip():
                continue
            parents = list(node.parents)
            tag = node.parent.name
            if any(p.name in {'script', 'style', 'noscript'} for p in parents):
                continue
            text = str(node)
            unit['fields'].append({'fieldId': len(unit['fields']),
                                   'path': ['body', 'textNode', i], 'tag': tag,
                                   'before': text, 'classification': 'source_context_review'})
        unit['protected'] = [{'kind': 'link', 'href': a.get('href'), 'label': a.get_text(' ', strip=True)}
                             for a in body.find_all('a', href=True)]
        scripts = [str(s.string or s.get_text()) for s in soup.find_all('script') if str(s.string or s.get_text()).strip()]
        unit['additionalReview'].append({'kind': 'script_literals_and_dynamic_templates',
                                        'scriptCount': len(scripts), 'characters': sum(map(len, scripts)),
                                        'status': 'not_in_static_text_review'})
        unit['additionalReview'].append('Input placeholders, accessible labels and generated text require UI review; DOM text review is not whole-artifact completion.')
    companion = file.with_suffix('.docx' if file.suffix != '.docx' else '.html')
    unit['companion'] = companion.as_posix() if companion.exists() else None
    units.append(unit)
out = Path('output/community-editorial/reference-document-inventory.json')
out.write_text(json.dumps({'units': units, 'scope': 'Authored public reference documents; preserve exact source quotations, figures, legal scope and identifiers after contextual classification.'}, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'files': len(units), 'html': sum(u['kind'] == 'html-reference' for u in units),
                  'word': sum(u['kind'] == 'word-reference' for u in units),
                  'textFields': sum(len(u['fields']) for u in units)}))
