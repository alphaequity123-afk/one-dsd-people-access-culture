const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const ts = require('typescript');
const originalResolve = Module._resolveFilename;
const originalLoad = Module._load;
Module._load = function(request, parent, ...rest) {
  if (request === 'server-only') return {};
  return originalLoad.call(this, request, parent, ...rest);
};
Module._resolveFilename = function(request, parent, ...rest) {
  const resolved = request.startsWith('@/') ? path.join(root, request.slice(2)) : request;
  const typed = !path.extname(resolved) && ['.ts', '.tsx'].map(ext => resolved + ext).find(file => fs.existsSync(file));
  return originalResolve.call(this, typed || resolved, parent, ...rest);
};
for (const ext of ['.ts', '.tsx']) Module._extensions[ext] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
Module._extensions['.css'] = module => { module.exports = {}; };
process.chdir(root);
const { listAudioLibraryShelves } = require(path.join(root, 'lib/content/audio-library.ts'));
const { audioEntryThemeIds, filterAudioShelves, audioThemeLabels, podcastThemeIds, podcastMatchesTheme } = require(path.join(root, 'lib/content/audio-organization.ts'));
const { listCourseListening } = require(path.join(root, 'lib/content/course-listening.ts'));
const { ALL_COURSE_SURFACES } = require(path.join(root, 'lib/content/courses/definitions.ts'));
const { selfDirectedItems } = require(path.join(root, 'lib/content/self-directed.ts'));
const { RESOURCE_THEMES } = require(path.join(root, 'lib/content/resource-organization.ts'));
const { ResourceFormatLinks } = require(path.join(root, 'components/resource-format-links.tsx'));
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const cohort = new Set(require('./fixtures/resource-organization-public-inventory.json').map(row => row.id));
const shelves = listAudioLibraryShelves();
const original = JSON.stringify(shelves);
const entries = shelves.flatMap(shelf => shelf.entries);
assert.equal(entries.length, 2, 'Staff listening lists the two published podcasts; lesson audio samples stay in their lessons.');
assert.deepEqual(filterAudioShelves(shelves), shelves);
assert.deepEqual(filterAudioShelves(shelves, 'unknown'), shelves);
const union = new Set();
for (const theme of RESOURCE_THEMES) {
  const selected = filterAudioShelves(shelves, theme.id);
  for (const shelf of selected) {
    assert(shelves.some(originalShelf => originalShelf.id === shelf.id));
    for (const entry of shelf.entries) {
      union.add(entry.id);
      assert(audioEntryThemeIds(entry).includes(theme.id));
      assert.deepEqual(entry, entries.find(originalEntry => originalEntry.id === entry.id), 'Filtering must not rewrite audio, transcripts, download paths or related lessons.');
    }
  }
}
assert.equal(union.size, entries.length);
assert.equal(JSON.stringify(shelves), original, 'Filtering must not mutate the source shelves.');
const unknown = { ...entries[0], id: 'future-unclassified-recording', related: null };
assert.deepEqual(audioEntryThemeIds(unknown), []);
assert.equal(filterAudioShelves([{ ...shelves[0], entries: [unknown] }]).flatMap(shelf => shelf.entries).length, 1);
assert.equal(filterAudioShelves([{ ...shelves[0], entries: [unknown] }], 'policy').length, 0);
assert.deepEqual(podcastThemeIds('equity-toolkit'), ['policy', 'partnership']);
assert.deepEqual(podcastThemeIds('anti-racism-public-service'), ['identity', 'policy']);
assert(podcastMatchesTheme('anti-racism-public-service', 'policy'));
assert(podcastMatchesTheme('anti-racism-public-service', 'culture'));
assert(podcastMatchesTheme('equity-toolkit', 'structural'));
assert(podcastMatchesTheme('equity-toolkit', 'partnership'));
assert(!podcastMatchesTheme('equity-toolkit', 'identity'));
assert.equal(Object.keys(audioThemeLabels(shelves)).length, entries.length);

const packs = ALL_COURSE_SURFACES.map(surface => surface.approvedValues.pack).filter(pack => cohort.has('course-' + pack.course.id));
const selfDirected = selfDirectedItems();
const listening = listCourseListening(packs, selfDirected);
assert(listening.length > 0);
assert.equal(listening.length, new Set(listening.map(item => item.id)).size);
for (const item of listening) {
  assert(cohort.has(item.id));
  assert(item.sources.length > 0);
  assert(item.themes.length > 0);
  assert(!Object.hasOwn(item, 'level'), 'A recording is not assigned a course progression level.');
  for (const src of item.sources) assert(fs.existsSync(path.join(root, 'public', src.split(/[?#]/)[0])));
}
const withoutSelf = listCourseListening(packs, []);
assert(withoutSelf.every(item => !item.id.startsWith('self-directed-')), 'A manifest-present course omitted from the published input must not return.');
const withdrawn = selfDirected.map(item => ({ ...item, status: 'withdrawn' }));
assert(listCourseListening([], withdrawn).length === 0, 'Withdrawal must win over existing recordings and manifest entries.');
assert.deepEqual(listCourseListening([], []), [], 'No native course can be promoted when no published course is supplied.');

for (const theme of RESOURCE_THEMES) {
  const html = renderToStaticMarkup(React.createElement(ResourceFormatLinks, { theme: theme.id, current: 'listening' }));
  for (const route of ['/library', '/learn', '/learn/sources', '/audio-library']) assert(html.includes(route + '?theme=' + theme.id));
}
const baselineFile = process.argv[2];
if (baselineFile) {
  const baseline = JSON.parse(fs.readFileSync(path.resolve(baselineFile), 'utf8'));
  assert.deepEqual(shelves.map(({ id, title, entries }) => ({ id, title, entries })), baseline.shelves.map(({ id, title, entries }) => ({ id, title, entries })), 'All existing entry identities, source bytes references, transcripts, links and order must match the production baseline.');
}
const output = process.argv[3];
if (output) fs.writeFileSync(path.resolve(output), JSON.stringify({ shelves, listening, themeCounts: Object.fromEntries(RESOURCE_THEMES.map(theme => [theme.id, { recordings: filterAudioShelves(shelves, theme.id).flatMap(shelf => shelf.entries).length, courses: listening.filter(item => item.themes.includes(theme.id)).length }])) }, null, 2));
console.log(JSON.stringify({ passed: true, existingRecordings: entries.length, coursesWithListening: listening.length, selfDirectedCourses: listening.filter(item => item.id.startsWith('self-directed-')).map(item => item.id), sourceFiles: new Set(listening.flatMap(item => item.sources)).size, checks: 'preserved recordings, full theme coverage, unknown retained in All, shared podcast topics, published-course gate, withdrawn and absent exclusion, cross-format links' }));
