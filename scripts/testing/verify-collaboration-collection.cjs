const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, ...rest) {
  const resolved = request.startsWith('@/') ? path.join(root, request.slice(2)) : request;
  const typed = !path.extname(resolved) && ['.ts', '.tsx'].map(ext => resolved + ext).find(file => fs.existsSync(file));
  return originalResolve.call(this, typed || resolved, parent, ...rest);
};
Module._extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);

const { collaborationCourses, collaborationHref, normalizeCollaborationFilters } = require(path.join(root, 'lib/learning/collaboration-collection.ts'));
const { AVAILABLE_CATALOG_COURSE_IDS } = require(path.join(root, 'lib/content/courses/authored/deia-catalog/available-courses.ts'));
const plan = require(path.join(root, 'lib/content/courses/authored/deia-catalog/plan.json'));
const available = new Set(AVAILABLE_CATALOG_COURSE_IDS);
const packs = plan.filter(row => available.has(row.id)).map(row => ({ course: { id: row.id, title: row.title, lessons: [] } }));
const before = JSON.stringify(packs);
const all = collaborationCourses(packs);
assert.equal(all.length, 99);
assert.equal(new Set(all.map(row => row.pack.course.id)).size, 99);
assert.deepEqual(['teams', 'cross-unit', 'partners'].map(focus => collaborationCourses(packs, { focus }).length), [80, 10, 9]);
assert.deepEqual(['foundation', 'intermediate', 'advanced'].map(level => collaborationCourses(packs, { level }).length), [32, 53, 14]);
assert.deepEqual(['foundation', 'intermediate', 'advanced'].map(level => collaborationCourses(packs, { focus: 'cross-unit', level }).length), [2, 5, 3]);
assert.deepEqual(['foundation', 'intermediate', 'advanced'].map(level => collaborationCourses(packs, { focus: 'partners', level }).length), [2, 6, 1]);

// Neither an excluded source topic nor an unlisted course becomes a promoted destination.
const excluded = plan.find(row => row.topicId === 'T84');
assert(excluded);
assert.equal(collaborationCourses([{ course: { id: excluded.id } }]).length, 0);
assert.equal(collaborationCourses([{ course: { id: 'new-collaboration-course' } }]).length, 0);
assert.equal(collaborationCourses([]).length, 0);

// A withdrawal must disappear from all routes and the corresponding focus and level.
const handoff = all.find(row => row.topicId === 'T75');
assert(handoff);
const withdrawn = packs.filter(pack => pack.course.id !== handoff.pack.course.id);
assert.equal(collaborationCourses(withdrawn).length, 98);
assert.equal(collaborationCourses(withdrawn, { focus: 'cross-unit' }).length, 9);
assert.equal(collaborationCourses(withdrawn, { focus: 'cross-unit', level: 'intermediate' }).length, 4);
assert(!collaborationCourses(withdrawn).some(row => row.topicId === 'T75'));
assert.equal(collaborationCourses([...packs, handoff.pack]).length, 99);
assert.equal(JSON.stringify(packs), before);

for (const level of ['Foundation', 'FOUNDATION', 'Foundations']) assert.deepEqual(normalizeCollaborationFilters({ level, focus: 'partners' }), { level: 'foundation', focus: 'partners' });
assert.deepEqual(normalizeCollaborationFilters({ level: 'expert', focus: 'anything' }), { level: undefined, focus: undefined });
assert.deepEqual(normalizeCollaborationFilters({ level: ['advanced'], focus: ['partners'] }), { level: undefined, focus: undefined });
assert.equal(collaborationHref(), '/learn/collaboration');
assert.equal(collaborationHref({ focus: 'cross-unit', level: 'advanced' }), '/learn/collaboration?focus=cross-unit&level=advanced');
assert.equal(collaborationHref({ level: 'intermediate' }), '/learn/collaboration?level=intermediate');
console.log('Collaboration discovery passed: 99 unique published courses; focus groups 80/10/9; levels 32/53/14; all level intersections; T84 excluded; withdrawals and duplicate input handled; query and route preservation.');
