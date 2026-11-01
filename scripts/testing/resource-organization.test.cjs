const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }, fileName: filename,
  }).outputText, filename);
};
const organization = require(path.join(root, 'lib/content/resource-organization.ts'));
const rows = require('./fixtures/resource-organization-public-inventory.json');
const memberships = require(path.join(root, 'lib/content/courses/theme-memberships.json'));
const plan = require(path.join(root, 'lib/content/courses/authored/deia-catalog/plan.json'));
const item = (id, type = 'learning_module', tags = []) => ({ id, type, tags });

assert.equal(rows.length, 760, 'The reviewed public cohort is an inventory of resources, not image or download files.');
assert.equal(new Set(rows.map(row => row.id)).size, 760);
const cohort = rows.map(row => item(row.id, row.type));
assert.deepEqual(organization.resourceOrganizationCoverage(cohort), {
  total: 760, categorized: 760, uncategorizedIds: [], learningWithoutLevelIds: [],
}, 'All observed public resources must remain findable in at least one theme.');
const allowed = new Set(organization.RESOURCE_THEMES.map(theme => theme.id));
assert.equal(allowed.size, 8);
assert.ok(allowed.has('identity') && !allowed.has('culture'), 'Do not reinterpret the old workplace-culture URL as identity.');
for (const row of cohort) {
  const themes = organization.resourceThemeIds(row);
  assert.ok(themes.length > 0 && themes.every(theme => allowed.has(theme)), row.id);
  assert.equal(new Set(themes).size, themes.length, row.id);
  assert.ok(organization.resourceOrganizationDecision(row.id).basis.length > 20, `Document classification evidence for ${row.id}`);
}

// The same level view includes the established native and self-directed collections.
for (const id of ['self-directed-F06', 'course-div-f01-white-privilege', 'course-sf-unconscious-bias-everyday-decisions']) {
  assert.equal(organization.resourceLearningLevel(item(id)), 'foundation', id);
  assert.equal(organization.matchesResourceLevel(item(id), 'Foundation'), true);
}
assert.equal(organization.resourceLearningLevel(item('self-directed-I03')), 'intermediate');
assert.equal(organization.resourceLearningLevel(item('course-div-a04-epistemic-injustice')), 'advanced');
assert.equal(organization.resourceLearningLevel(item('self-directed-A21')), 'advanced');
assert.equal(organization.resourceLearningLevel(item('course-di-capstone-remove-a-real-barrier')), 'advanced');
for (const course of plan) {
  if (!organization.resourceOrganizationDecision('course-' + course.id)) {
    assert.ok(!rows.some(row => row.id === 'course-' + course.id), 'Every live course must have a recorded decision.');
    continue;
  }
  const expected = course.level.toLowerCase().startsWith('found') ? 'foundation' : course.level.toLowerCase();
  assert.equal(organization.resourceLearningLevel(item('course-' + course.id)), expected, course.title);
}

// A tool can be used directly at any stage. Staff rank and L1–L4 are not difficulty.
assert.equal(organization.resourceLearningLevel(item('ja-language-access-checklist', 'job_aid', ['Advanced'])), null);
assert.equal(organization.resourceLearningLevel(item('new-tool', 'tool', ['foundation'])), null);
assert.equal(organization.resourceLearningLevel({ ...item('future-learning'), layer: 'L4', title: 'Leadership', body: ['advanced advanced'] }), null);
assert.equal(organization.resourceLearningLevel(item('future-learning', 'learning_module', ['foundation', 'advanced'])), null);
assert.equal(organization.resourceLearningLevel(item('future-learning', 'learning_module', ['level:intermediate'])), 'intermediate');
assert.equal(organization.matchesResourceLevel(item('new-tool', 'tool'), 'foundation'), false);
assert.equal(organization.matchesResourceLevel(item('self-directed-F06'), 'L1'), false);

// A learner's subject choice must find applied cross-theme work, not just the
// shelf where a course happened to be authored.
for (const [id, theme] of [
  ['self-directed-A01', 'policy'], ['self-directed-A20', 'leadership'],
  ['self-directed-A08', 'evidence'], ['self-directed-A12', 'evidence'],
  ['self-directed-A16', 'evidence'], ['self-directed-F08', 'disability'],
  ['self-directed-F04', 'access'], ['self-directed-I01', 'access'],
  ['course-dc-l95-plain-language-as-an-equity-practice', 'access'],
  ['course-cq-leading-multicultural-teams', 'leadership'],
  ['course-dc-i97-intercultural-skills-on-multicultural-teams', 'workforce'],
  ['course-div-a08-bias-reduction-interventions', 'evidence'],
]) assert.ok(organization.matchesResourceTheme(item(id), theme), `${id} must be findable under ${theme}`);

// Current headings and lesson content do not silently add themes to known resources.
const f06 = item('self-directed-F06');
assert.deepEqual(organization.resourceThemeIds({ ...f06, tags: ['procurement'], body: ['policy procurement contracts budgets'] }), ['identity']);
assert.deepEqual(organization.resourceThemeIds({ ...item('unclassified'), title: 'Equity leadership', body: ['policy accessibility'] }), []);
assert.deepEqual(organization.resourceThemeIds(item('new-language-tool', 'tool', ['language access'])), ['access']);
assert.deepEqual(organization.resourceThemeIds(item('new-theme-tool', 'tool', ['theme:disability'])), ['disability']);
assert.equal(organization.matchesResourceTheme(item('new-theme-tool', 'tool', ['theme:disability']), 'invented'), false);

// Retired theme URLs keep their previously registered resource membership.
for (const theme of Object.keys(organization.RESOURCE_LEGACY_THEME_LABELS)) {
  for (const id of memberships[theme]) {
    if (organization.resourceOrganizationDecision(id)) assert.ok(organization.matchesResourceTheme(item(id), theme), `${theme}: ${id}`);
    else assert.ok(!rows.some(row => row.id === id), 'An absent definition must not remove a published resource.');
  }
}
assert.ok(organization.matchesResourceTheme(item('lm-workplace-climate'), 'culture'));
assert.ok(organization.matchesResourceTheme(item('self-directed-F17'), 'culture'));
assert.ok(organization.matchesResourceTheme(item('lm-facilitation-application'), 'facilitation'));
assert.ok(organization.matchesResourceTheme(item('self-directed-F01'), 'intercultural'));
assert.ok(organization.matchesResourceTheme(item('self-directed-A21'), 'structural'));
assert.equal(organization.matchesResourceTheme(item('course-div-f04-cultural-values'), 'culture'), memberships.culture.includes('course-div-f04-cultural-values'));

// Guides remain classifiable alongside resources instead of becoming an unfilterable shelf.
assert.deepEqual(organization.resourceThemeIds(item('practice-guide-inclusive-meetings', 'practice_note')), ['access', 'partnership', 'workforce']);
assert.deepEqual(organization.resourceThemeIds(item('practice-guide-review-a-change', 'practice_note')), ['evidence']);
assert.equal(organization.resourceLearningLevel(item('practice-guide-review-a-change', 'practice_note')), null);

console.log('PASS: 760 published resources remain classified; cross-catalog levels, legacy themes, future metadata, and direct-use tools verified.');
