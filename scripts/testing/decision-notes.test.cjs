/* eslint-disable @typescript-eslint/no-require-imports -- Isolated client storage and document contract checks. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const JSZip = require('jszip');
const root = path.resolve(__dirname, '../..');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }, fileName: filename,
}).outputText, filename);
const notes = require(path.join(root, 'lib/client/decision-notes.ts'));
const plans = require(path.join(root, 'lib/client/dsd-practice-plans.ts'));
const documents = require(path.join(root, 'lib/program/goal-plan-report.ts'));
const clone = value => JSON.parse(JSON.stringify(value));
let checks = 0;
function check(name, run) { run(); checks += 1; process.stdout.write(`PASS ${name}\n`); }
function memory(initial = null) {
  let raw = initial; let writes = 0; let readsFail = false; let writesFail = false;
  return {
    access: () => ({ getItem: () => { if (readsFail) throw Error('read denied'); return raw; },
      setItem: (_key, value) => { if (writesFail) throw Error('quota'); raw = value; writes += 1; },
      removeItem: () => { if (writesFail) throw Error('quota'); raw = null; writes += 1; } }),
    get raw() { return raw; }, get writes() { return writes; },
    failReads: value => { readsFail = value; }, failWrites: value => { writesFail = value; },
    external: value => { raw = value; },
  };
}
function completeNotes() {
  const value = notes.emptyDecisionNotes();
  value.title = 'Notice review'; value.task = 'notice';
  for (const field of notes.decisionFields) value.fields[field.key] = `Distinct_${field.key}_content`;
  value.fields.reviewDate = '2027-02-15';
  for (const [index, option] of value.options.entries()) for (const key of ['title', 'benefits', 'risks', 'burden', 'evidence']) option[key] = `Option_${index}_${key}_content`;
  value.resources = [{ id: 'language', title: 'Cultural and language access', href: '/practice/clas' }];
  for (const item of notes.decisionChecks) value.checklist[item.key] = { status: 'needs-work', note: `Distinct_${item.key}_review_note` };
  return value;
}

async function run() {
  const legacy = plans.newPlan('Existing private plan');
  legacy.fields.evidence = 'Keep my existing evidence';
  const legacyCollection = { version: 1, activeId: legacy.id, plans: [legacy] };
  const storage = memory(JSON.stringify(legacyCollection));
  let opening;
  check('opening and editing in memory do not write, choose a plan, or change legacy data', () => {
    opening = plans.loadDecisionNotes(storage.access);
    assert.equal(opening.ok, true); assert.equal(opening.planId, null);
    opening.notes.fields.decision = 'Still unsaved';
    assert.equal(storage.writes, 0); assert.deepEqual(JSON.parse(storage.raw), legacyCollection);
    assert.equal(plans.validPlans(legacyCollection), true);
  });
  const content = completeNotes(); let saved;
  check('explicit save adds one complete analysis and preserves the legacy plan', () => {
    saved = plans.saveDecisionNotes(storage.access, content, opening.raw);
    assert.equal(saved.ok, true); assert.equal(storage.writes, 1);
    const collection = plans.loadPlans(storage.access).data;
    assert.equal(collection.plans.length, 2); assert.deepEqual(collection.plans[0], legacy);
    assert.deepEqual(collection.plans[1].analysis, content); assert.equal(plans.validPlans(collection), true);
  });
  check('reopening preserves every field and returns an independent object', () => {
    const opened = plans.loadDecisionNotes(storage.access, saved.planId);
    assert.deepEqual(opened.notes, content); assert.equal(storage.writes, 1);
    opened.notes.options[0].evidence = 'Unsaved change';
    assert.deepEqual(plans.loadDecisionNotes(storage.access, saved.planId).notes, content);
  });
  check('legacy plans become complete drafts only when explicitly saved', () => {
    const local = memory(JSON.stringify(legacyCollection));
    const opened = plans.loadDecisionNotes(local.access, legacy.id);
    assert.equal(local.writes, 0); assert.equal(opened.notes.fields.evidence, legacy.fields.evidence);
    assert.equal(plans.saveDecisionNotes(local.access, opened.notes, opened.raw, legacy.id).ok, true);
    assert.equal(plans.loadPlans(local.access).data.plans.length, 1);
    assert.equal(plans.loadPlans(local.access).data.plans[0].createdAt, legacy.createdAt);
  });
  check('stale saves and deleted or invalid plan IDs never overwrite other plans', () => {
    const oldRaw = storage.raw;
    const other = plans.newPlan('Created in another tab');
    const latest = plans.loadPlans(storage.access).data; latest.plans.push(other);
    storage.external(JSON.stringify(latest));
    const current = storage.raw;
    assert.equal(plans.saveDecisionNotes(storage.access, content, oldRaw, saved.planId).reason, 'conflict');
    assert.equal(plans.saveDecisionNotes(storage.access, content, current, 'missing-id').reason, 'not-found');
    assert.equal(plans.loadDecisionNotes(storage.access, 'missing-id').reason, 'not-found');
    assert.equal(storage.raw, current); assert.equal(storage.writes, 1);
    latest.plans = latest.plans.filter(plan => plan.id !== saved.planId); latest.activeId = legacy.id;
    storage.external(JSON.stringify(latest));
    assert.equal(plans.saveDecisionNotes(storage.access, content, storage.raw, saved.planId).reason, 'not-found');
    assert.equal(storage.writes, 1);
  });
  check('unreadable, unavailable, and failed-write storage preserve current data and caller notes', () => {
    const bad = memory('{broken-json');
    assert.equal(plans.loadDecisionNotes(bad.access).reason, 'invalid');
    assert.equal(plans.saveDecisionNotes(bad.access, content, bad.raw).reason, 'unreadable');
    assert.equal(plans.saveDecisionNotes(bad.access, content, undefined).reason, 'unreadable');
    assert.equal(bad.raw, '{broken-json'); assert.equal(bad.writes, 0);
    bad.failReads(true); assert.equal(plans.loadDecisionNotes(bad.access).reason, 'unavailable');
    const blocked = memory(); blocked.failWrites(true);
    const before = clone(content);
    assert.equal(plans.saveDecisionNotes(blocked.access, content, null).reason, 'unavailable');
    assert.equal(blocked.raw, null); assert.deepEqual(content, before);
  });
  check('malformed notes and unsafe imported links are rejected before a write', () => {
    const mutations = [
      value => { delete value.fields.participation; },
      value => { value.fields.unknown = 'would otherwise be lost'; },
      value => { value.options.pop(); },
      value => { value.options[1].id = value.options[0].id; },
      value => { value.options[0].evidence = 42; },
      value => { value.checklist.access = true; },
      value => { value.checklist.authority.status = 'approved'; },
      value => { value.resources[0].href = 'javascript:alert(1)'; },
      value => { value.resources[0].href = '//external.example/path'; },
      value => { value.resources[0].href = '/\\external.example/path'; },
      value => { value.resources[0].href = '/\n/external.example/path'; },
    ];
    for (const mutate of mutations) {
      const invalid = clone(content); mutate(invalid);
      assert.equal(notes.validDecisionNotes(invalid), false);
      const target = memory(); assert.equal(plans.saveDecisionNotes(target.access, invalid, null).reason, 'invalid');
      assert.equal(target.writes, 0);
      const imported = clone(legacyCollection); imported.plans[0].analysis = invalid;
      assert.equal(plans.validPlans(imported), false);
    }
  });
  check('native and consultant HTTPS resource links survive save, reopen, and JSON import', () => {
    const validUrls = [
      '/practice/clas', '/library?theme=policy#find-resource',
      'https://mn.gov/dhs/', 'https://www.health.state.mn.us/communities/practice?topic=language%20access#guidance',
      'HTTPS://example.org/source',
    ];
    for (const href of validUrls) {
      const value = clone(content); value.resources[0].href = href;
      assert.equal(notes.validDecisionNotes(value), true, href);
      const target = memory(); const result = plans.saveDecisionNotes(target.access, value, null);
      assert.equal(result.ok, true, href);
      assert.equal(plans.loadDecisionNotes(target.access, result.planId).notes.resources[0].href, href);
      const imported = JSON.parse(target.raw);
      assert.equal(plans.validPlans(imported), true, href);
      const restored = memory(); assert.equal(plans.savePlans(restored.access, imported, null).ok, true);
      assert.ok(plans.planText(imported.plans[0]).includes(href), href);
    }
  });
  check('unsafe external resource URLs cannot be saved or imported', () => {
    const unsafeUrls = [
      'http://example.org/source', 'javascript:alert(1)', 'data:text/html,test',
      '//example.org/source', 'https:example.org/source', 'https:///example.org/source',
      'https://user:password@example.org/source', 'https://user@example.org/source', 'https://@example.org/source',
      'https://example.org\\\\@other.example/source', 'https://example.org/\\nsource',
      'https://example.org/\\u0000source', 'https://example.org/\\u007fsource',
      'https://example.org/%0d%0aLocation:source', 'https://example.org/%5csource',
      'https://', 'https://example .org/source',
    ];
    for (const href of unsafeUrls) {
      const value = clone(content); value.resources[0].href = href;
      assert.equal(notes.validDecisionNotes(value), false, href);
      const target = memory(); assert.equal(plans.saveDecisionNotes(target.access, value, null).reason, 'invalid', href);
      assert.equal(target.writes, 0, href);
      const imported = clone(legacyCollection);
      imported.plans[0] = { ...imported.plans[0], title: value.title,
        fields: Object.fromEntries(plans.planFields.map(field => [field.key, value.fields[field.key]])), analysis: value };
      assert.equal(plans.validPlans(imported), false, href);
    }
  });
  check('analysis and plan summary cannot silently diverge', () => {
    const local = memory(); const result = plans.saveDecisionNotes(local.access, content, null);
    const collection = plans.loadPlans(local.access).data;
    collection.plans[0].fields.action = 'Conflicting planner edit';
    assert.equal(plans.validPlans(collection), false);
    assert.equal(plans.savePlans(local.access, collection, result.raw).reason, 'invalid');
    assert.equal(local.writes, 1);
  });
  check('JSON import round trip and conflict recovery retain complete analysis', () => {
    const local = memory(); plans.saveDecisionNotes(local.access, content, null);
    const exported = JSON.stringify(plans.loadPlans(local.access).data);
    const imported = JSON.parse(exported);
    assert.equal(plans.validPlans(imported), true);
    const changed = clone(imported); changed.plans[0].analysis.fields.feedback = 'A different response';
    const recovered = plans.keepPlanCopies(imported, changed);
    assert.equal(recovered.plans.length, 2); assert.equal(plans.validPlans(recovered), true);
    assert.notEqual(recovered.plans[0].id, recovered.plans[1].id);
    assert.equal(recovered.plans[1].analysis.title, recovered.plans[1].title);
    assert.equal(recovered.plans[1].analysis.fields.feedback, 'A different response');
    assert.deepEqual(recovered.plans[0].analysis, content);
    const restored = memory(); assert.equal(plans.savePlans(restored.access, recovered, null).ok, true);
    assert.deepEqual(plans.loadPlans(restored.access).data, recovered);
  });
  check('generated-ID collisions cannot replace another plan', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: { randomUUID: () => legacy.id } });
    try {
      const local = memory(JSON.stringify(legacyCollection));
      const result = plans.saveDecisionNotes(local.access, content, local.raw);
      assert.equal(result.ok, true); assert.notEqual(result.planId, legacy.id);
      assert.deepEqual(plans.loadPlans(local.access).data.plans[0], legacy);
    } finally { if (original) Object.defineProperty(globalThis, 'crypto', original); else delete globalThis.crypto; }
  });
  check('analysis reports use readable task names and working-draft wording without changing ordinary plans', () => {
    const labels = { notice: 'A notice, form, or message', policy: 'A policy or legislative question',
      service: 'A service, process, or handoff', workforce: 'Hiring, onboarding, or team practice',
      participation: 'Participation and community feedback', contracts: 'A contract or purchase' };
    for (const [task, label] of Object.entries(labels)) {
      const value = { ...content, task };
      assert.equal(notes.decisionNotesSections(value)[0].entries[0].text, label);
      assert.ok(notes.decisionNotesText(value).includes(label));
    }
    for (const task of ['Local planning question', 'constructor', '  A different question  ']) {
      assert.equal(notes.decisionNotesSections({ ...content, task })[0].entries[0].text, task);
    }
    assert.equal(notes.decisionNotesSections({ ...content, task: '   ' })[0].entries[0].text, 'Not yet selected.');
    assert.ok(notes.decisionNotesText(content).includes('Working draft. This is not submitted, approved, or a completed official equity analysis.'));
    assert.ok(!notes.decisionNotesText(content).includes('Private working draft'));
    assert.ok(plans.planText(legacy).includes('Private working draft.'));
  });
  const local = memory(); const result = plans.saveDecisionNotes(local.access, content, null);
  const plan = plans.loadPlans(local.access).data.plans[0];
  const report = { title: plan.title, notes: ['Private working draft'], sections: plans.practicePlanSections(plan) };
  const allText = [content.task, ...Object.values(content.fields), ...content.options.flatMap(option => [option.title, option.benefits, option.risks, option.burden, option.evidence]), ...content.resources.flatMap(resource => [resource.title, resource.href]), ...Object.values(content.checklist).map(item => item.note)];
  check('text and print/PDF report include all notes, options, resources and review notes', () => {
    for (const value of allText) {
      assert.ok(plans.planText(plan).includes(value), value);
      assert.ok(documents.goalPlanHtml(report).includes(value), value);
    }
    assert.ok(plans.planText(plan, 'dhs').startsWith('One DHS'));
    assert.ok(plans.planText(plan, 'dsd').startsWith('One DSD'));
    const unsafe = clone(report); unsafe.sections[0].entries[0].text = '<img src=x onerror=alert(1)>';
    const html = documents.goalPlanHtml(unsafe);
    assert.ok(!html.includes('<img src=x')); assert.ok(html.includes('&lt;img'));
    assert.equal(result.ok, true);
  });
  const blob = await documents.goalPlanWord(report);
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const xml = await zip.file('word/document.xml').async('string');
  check('real editable Word document retains the complete analysis', () => {
    for (const value of allText) assert.ok(xml.includes(value.replaceAll('&', '&amp;')), value);
  });
  process.stdout.write(`PASS ${checks} decision-note storage/export checks\n`);
}
run().catch(error => { console.error(error); process.exitCode = 1; });
