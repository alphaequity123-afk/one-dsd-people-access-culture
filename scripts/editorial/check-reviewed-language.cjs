/** Verify exact source matches and publication contracts before reviewed copy ships. */
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === 'server-only') return require.resolve('./server-only-stub.cjs');
  return originalResolve.call(this, request.startsWith('@/') ? path.join(root, request.slice(2)) : request, parent, isMain, options);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, fileName: filename,
}).outputText, filename);
const { EDITABLE_SURFACE_REGISTRY } = require(path.join(root, 'lib/content/staff-surface-registry.ts'));
const { parseEditableSurfaceDocument } = require(path.join(root, 'lib/content/editable-surface-contract.ts'));
const { staffCorpus } = require(path.join(root, 'lib/content/staff-corpus.ts'));
const { staticPageCopy } = require(path.join(root, 'lib/content/page-copy-contract.ts'));
const { inspectLanguageRevision } = require(path.join(root, 'lib/content/professional-language.ts'));
const data = JSON.parse(fs.readFileSync(path.join(root, 'lib/content/professional-language-revisions.json'), 'utf8'));
const courses = JSON.parse(fs.readFileSync(path.join(root, 'lib/content/course-language-revisions.json'), 'utf8'));
const rows = [...data.revisions, ...courses.courses.map(row => ({ ...row, kind: 'surface', target: `course.${row.courseId}`, changes: row.changes.map(c => ({ ...c, path: ['pack', ...c.path] })) }))];
const seen = new Set(); let fields = 0, reviewed = 0;
for (const row of rows) {
  if (seen.has(row.target)) throw Error(`Duplicate revision: ${row.target}`);
  seen.add(row.target);
  if (row.status !== 'reviewed') continue;
  const definition = EDITABLE_SURFACE_REGISTRY.find(s => s.surfaceId === row.target);
  const resource = row.kind === 'resource' ? staffCorpus().find(r => `resource.${r.id}` === row.target) : undefined;
  const original = definition?.approvedValues ?? resource ?? (row.target.startsWith('page.') ? staticPageCopy(row.target.slice(5)) : undefined);
  if (!original) throw Error(`Missing original: ${row.target}`);
  for (const change of row.changes) {
    const sourceNote = change.path[0] === 'pack' && change.path[1] === 'sources' && typeof change.path[2] === 'number' && change.path[3] === 'note' && change.path.length === 4;
    if (!sourceNote && change.path.some(key => typeof key === 'string' && /^(?:sources?|href|url|src|introTranscript|introAudio|transcript|captions|poster|audio|video|id|correct|correctAnswer)$/i.test(key))) throw Error(`Protected field changed: ${row.target} ${change.path.join('.')}`);
    if (definition?.protectedFields?.includes(change.path[0])) throw Error(`Protected surface field changed: ${row.target}`);
    if (/<script|<iframe|javascript:/i.test(change.after)) throw Error(`Unsafe markup: ${row.target}`);
  }
  const result = inspectLanguageRevision(row.target, original, row);
  if (!result.applied || result.conflicts.length) throw Error(`Source changed for ${row.target}: ${result.conflicts.join(', ')}`);
  if (definition) parseEditableSurfaceDocument(definition, { schemaVersion: 1, surfaceId: row.target, scope: definition.scopePolicy === 'dsd' ? 'dsd' : 'one-dhs', values: result.value });
  reviewed++; fields += row.changes.length;
}
console.log(`Verified ${reviewed} reviewed page/resource revisions (${fields} fields); originals, protected fields, and current source matches are preserved.`);
