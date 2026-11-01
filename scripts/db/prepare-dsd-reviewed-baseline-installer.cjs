const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const directory = path.join(root, 'evidence/activation-20261004/baseline-seeding');
fs.mkdirSync(directory, { recursive: true });
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'evidence/activation-20261004', name), 'utf8').replace(/^\uFEFF/, ''));
const resources = read('current-resource-corpus.json').items;
const allSurfaces = read('current-surface-registry.json');
const surfaces = allSurfaces.filter(item => item.scopePolicy !== 'one-dhs');
const manifest = {};
for (const [kind, items] of [['resource', resources], ['surface', surfaces]]) {
  for (const item of items) {
    const id = kind === 'resource' ? item.id : item.surfaceId;
    const serialized = JSON.stringify(item);
    const key = `${kind}:${id}`;
    if (manifest[key]) throw new Error(`Duplicate approved item: ${key}`);
    manifest[key] = crypto.createHash('sha256').update(serialized).digest('hex');
  }
}
const template = fs.readFileSync(path.join(root, 'scripts/db/dsd-reviewed-baseline-installer.sql'), 'utf8');
const sql = template.replace('__APPROVED_MANIFEST_JSON__', JSON.stringify(manifest));
fs.writeFileSync(path.join(directory, 'install-bounded-import.sql'), sql);
fs.writeFileSync(path.join(directory, 'remove-bounded-import.sql'), 'drop function if exists pac.install_one_dsd_reviewed_baseline(text,text);\n');
fs.writeFileSync(path.join(directory, 'approved-manifest.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(directory, 'selected-surfaces.txt'), surfaces.map(item => item.surfaceId).join(','));
const oldText = fs.readFileSync(path.join(root, 'db/migrations/0018_pac_editable_surfaces.sql'), 'utf8');
const oldSurfaces = JSON.parse(oldText.match(/registry_seed constant jsonb := \$pac_registry\$(.*?)\$pac_registry\$::jsonb;/s)[1]);
const equal = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const changes = surfaces.map(current => {
  const previous = oldSurfaces.find(item => item.surfaceId === current.surfaceId);
  return { id: current.surfaceId, newDefinition: !previous,
    definitionChanged: !!previous && !equal({ ...previous, approvedValues: null }, { ...current, approvedValues: null }),
    valuesChanged: !!previous && !equal(previous.approvedValues, current.approvedValues) };
});
const report = { resources: resources.length, selectedSurfaces: surfaces.length,
  courseSurfaces: surfaces.filter(item => item.surfaceId.startsWith('course.')).length,
  excludedAgencyOnlySurfaces: allSurfaces.length - surfaces.length,
  sourceRegistryBytes: fs.statSync(path.join(root, 'evidence/activation-20261004/current-surface-registry.json')).size,
  installerSqlBytes: Buffer.byteLength(sql),
  newDefinitions: changes.filter(item => item.newDefinition).length,
  definitionChanges: changes.filter(item => item.definitionChanged).length,
  valueChanges: changes.filter(item => item.valuesChanged).length,
  changed: changes.filter(item => item.newDefinition || item.definitionChanged || item.valuesChanged) };
fs.writeFileSync(path.join(directory, 'preparation.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, changed: undefined }));
