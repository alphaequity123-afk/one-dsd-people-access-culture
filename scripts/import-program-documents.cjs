const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const sources = [
  ['three-year-plan', 'one-dsd-three-year-plan.txt', 'e174397f-e39c-4b41-a664-631de9b68dfc'],
  ['dhs-landscape', 'dhs-equity-landscape.txt', 'f8ebb6ff-6f6a-4203-bdce-d689e69e73ff'],
  ['minnesota-government', 'minnesota-equity-research.txt', '149dc81a-3302-483a-9e7b-fb5016bb393f'],
];
const destination = path.join(root, 'public/documents/program-evidence');
fs.mkdirSync(destination, { recursive: true });
fs.mkdirSync(path.join(root, 'data/program-documents'), { recursive: true });
fs.mkdirSync(path.join(root, 'evidence/program-documents-integration'), { recursive: true });
const documents = {};
const receipts = [];
for (const [slug, filename, attachment] of sources) {
  const source = path.join('C:/Users/garyb/.codex/attachments', attachment, 'Pasted text.txt');
  const bytes = fs.readFileSync(source);
  fs.writeFileSync(path.join(destination, filename), bytes);
  documents[slug] = bytes.toString('utf8').replace(/^\uFEFF/, '');
  receipts.push({ slug, filename, source, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), exactCopy: bytes.equals(fs.readFileSync(path.join(destination, filename))) });
}
fs.writeFileSync(path.join(root, 'data/program-documents/source-text.json'), JSON.stringify(documents, null, 2));
fs.writeFileSync(path.join(root, 'evidence/program-documents-integration/source-preservation.json'), JSON.stringify({ integratedOn: '2026-10-04', authorization: 'User supplied these three documents and requested app integration.', receipts }, null, 2));
console.log(JSON.stringify(receipts.map(({slug,bytes,exactCopy})=>({slug,bytes,exactCopy}))));
