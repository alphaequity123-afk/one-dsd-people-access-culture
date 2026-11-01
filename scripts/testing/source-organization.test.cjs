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
const organization = require(path.join(root, 'lib/content/source-organization.ts'));
const { RESOURCE_THEMES } = require(path.join(root, 'lib/content/resource-organization.ts'));
const register = require(path.join(root, 'data/source-register/source-register.json'));
const external = register.sources.filter(source => source.kind === 'external' && source.href);
const before = JSON.stringify(external);
const get = href => {
  const source = external.find(source => source.sourceId === 'url:' + href);
  assert.ok(source, href);
  return source;
};
const coverage = organization.sourceOrganizationCoverage(external);
assert.equal(external.length, 940);
assert.equal(new Set(external.map(source => source.sourceId)).size, 940);
assert.equal(coverage.categorized, 940, JSON.stringify(coverage.uncategorizedIds));
assert.deepEqual(coverage.uncategorizedIds, []);
assert.equal(external.filter(source => organization.matchesSourceTheme(source, '')).length, 940);
const themes = new Set(RESOURCE_THEMES.map(theme => theme.id));
for (const source of external) {
  const decision = organization.sourceOrganizationDecision(source);
  assert.ok(decision.themes.every(theme => themes.has(theme)), source.sourceId);
  assert.equal(new Set(decision.themes).size, decision.themes.length);
  assert.ok(decision.basis.length > 20, source.sourceId);
  assert.equal(organization.matchesSourceTheme(source, 'unknown-theme'), false);
}

// A widely cited source keeps its actual purpose, rather than acquiring every
// subject from all the lessons that happen to cite it.
assert.deepEqual(organization.sourceThemeIds(get('https://www.plainlanguage.gov/guidelines')), ['access']);
assert.deepEqual(organization.sourceThemeIds(get('https://www.gao.gov/products/gao-20-283g')), ['evidence']);
assert.deepEqual(organization.sourceThemeIds(get('https://www.opm.gov/policy-data-oversight/assessment-and-selection/structured-interviews')), ['workforce']);
assert.deepEqual(organization.sourceThemeIds(get('https://www.beacon.org/White-Fragility-P1672.aspx')), ['identity']);
assert.ok(organization.matchesSourceTheme(get('https://academic.oup.com/book/32817'), 'identity'));
assert.ok(organization.matchesSourceTheme(get('https://www.apa.org/news/podcasts/speaking-of-psychology/microaggressions'), 'identity'));
assert.ok(organization.matchesSourceTheme(get('https://www.revisor.mn.gov/statutes/cite/10.65'), 'partnership'));

// Self-directed references already carry the catalog prefix. Their meaningful
// memberships must survive normalization just like native course references.
const sample = { sourceId: 'url:https://example.test/ref', title: 'Sample', href: 'https://example.test/ref', host: 'example.test', kind: 'external', verification: '', citations: [] };
const citation = { resourceType: 'self_directed_course', resourceId: 'self-directed-A21', resourceTitle: 'Policy and legislative analysis', route: '/learning/self-directed/index.html?course=A21', note: '', role: '' };
assert.ok(organization.matchesSourceTheme({ ...sample, citations: [citation] }, 'policy'));
assert.ok(organization.matchesSourceTheme({ ...sample, citations: [{ ...citation, resourceType: 'authored_course', resourceId: 'div-f01-white-privilege' }] }, 'identity'));
assert.deepEqual(organization.sourceThemeIds({ ...sample, title: 'Disability access leadership policy', host: 'www.ada.gov' }), []);
assert.deepEqual(organization.sourceThemeIds({ ...sample, citations: [{ ...citation, resourceId: 'unknown-course' }] }), []);
assert.equal(JSON.stringify(external), before, 'Classification must not change source titles, addresses, citations or order.');
assert.ok(!Object.hasOwn(organization.sourceOrganizationDecision(get('https://www.beacon.org/White-Fragility-P1672.aspx')), 'level'), 'Sources do not receive invented course levels.');

const page = fs.readFileSync(path.join(root, 'app/learn/sources/page.tsx'), 'utf8');
assert.ok(page.includes('id={sourceAnchor(source)}'), 'Source fragment anchors remain stable.');
assert.ok(page.includes('id={`group-${group}`}'), 'Authority-group anchors remain stable.');
assert.ok(page.includes('kind="sources" id="register"'), 'The complete source-register download remains available.');
assert.ok(page.includes('current="reading"'), 'Reading remains connected to the other learning formats.');

if (process.argv[2]) {
  fs.writeFileSync(process.argv[2], JSON.stringify({ coverage, sources: external.map(source => ({ sourceId: source.sourceId, title: source.title, href: source.href, ...organization.sourceOrganizationDecision(source) })) }, null, 2));
}
console.log(JSON.stringify({ status: 'passed', ...coverage }));
