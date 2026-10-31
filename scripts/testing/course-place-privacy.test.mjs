import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';

const helper = readFileSync(new URL('../../public/learning/self-directed/progress-storage.js', import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(helper, context);
const progress = context.OneDsdCourseProgress;
const values = new Map();
const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
assert.equal(progress.save(storage, 'I01', 2).ok, true);
assert.equal(progress.read(storage, 'I01').place.page, 2);
values.set('one-dsd-learning-I02', '{unreadable');
assert.equal(progress.save(storage, 'I02', 2).ok, false);
assert.equal(values.get('one-dsd-learning-I02'), '{unreadable');
assert.equal(progress.save({ ...storage, setItem() { throw Error('quota'); } }, 'I01', 3).ok, false);
assert.equal(progress.read(storage, 'I01').place.page, 2);
const failedClear = progress.clear({ ...storage, removeItem(key) { if (key.endsWith('I01')) throw Error('blocked'); values.delete(key); } }, ['I01', 'I02']);
assert.equal(failedClear.ok, false);
assert.equal(failedClear.failed.join(','), 'I01');
assert.equal(values.has('one-dsd-learning-I02'), false);
assert.equal(progress.clear(storage, ['I99']).ok, false);
assert.equal(progress.read({ getItem() { throw Error('blocked'); } }, 'I01').ok, false);
assert.equal(progress.clear({ ...storage, removeItem() {} }, ['I01']).ok, false);

// Exercise the real registry while stubbing only unrelated content imports.
const registrySource = readFileSync(new URL('../../lib/client/storage-keys.ts', import.meta.url), 'utf8');
const compiled = stripTypeScriptTypes(registrySource.replace(/^import .*;$/gm, '').replace(/export /g, ''));
const registry = vm.createContext({ PRACTICE_STORAGE_KEY: 'practice-test', GRADUATION_PATHS: [] });
vm.runInContext(compiled + '\nglobalThis.keys = { isPrivateBrowserStorageKey, clearRegisteredPrivateBrowserData };', registry);
const keys = registry.keys;
assert.equal(keys.isPrivateBrowserStorageKey('local', 'one-dsd-structural-review-draft'), true);
for (const id of ['F01', 'F24', 'I01', 'I24', 'A01', 'A24']) assert.equal(keys.isPrivateBrowserStorageKey('local', `one-dsd-learning-${id}`), true);
for (const key of ['one-dsd-learning-I25', 'one-dsd-learning-I00', 'one-dsd-data-exploration-draft', 'unrelated']) assert.equal(keys.isPrivateBrowserStorageKey('local', key), false);
const removed = [];
const clearResult = keys.clearRegisteredPrivateBrowserData((area, key) => { removed.push(key); return key !== 'one-dsd-learning-I24'; }, () => ['one-dsd-learning-I01', 'one-dsd-learning-I24', 'unrelated']);
assert.equal(clearResult.ok, false);
assert.equal(clearResult.failedKeys.join(','), 'local:one-dsd-learning-I24');
assert.equal(removed.includes('one-dsd-structural-review-draft'), true);
assert.equal(removed.includes('unrelated'), false);
assert.equal(keys.clearRegisteredPrivateBrowserData(() => true, () => { throw Error('discovery denied'); }).discoveryFailed, true);

// Run the actual course viewer and confirm failures are exposed to the learner.
const html = readFileSync(new URL('../../public/learning/self-directed/index.html', import.meta.url), 'utf8');
class Element {
  constructor() {
    this.textContent = ''; this.value = ''; this.dataset = {}; this.style = {}; this.children = []; this.handlers = {}; this.hidden = false;
    const classes = new Set();
    this.classList = { remove: name => classes.delete(name), contains: name => classes.has(name), toggle: (name, on) => on ? classes.add(name) : classes.delete(name) };
  }
  addEventListener(event, callback) { this.handlers[event] = callback; }
  click() { this.handlers.click?.({ preventDefault() {} }); }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children = items; }
  setAttribute(name, value) { this[name] = value; }
  getAttribute(name) { return this[name] ?? null; }
  scrollIntoView() {}
  closest() { return this.parent ??= new Element(); }
  focus() { this.focused = true; }
}
const elements = new Map();
const embedded = html.match(/<script id="course-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
const element = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
element('course-data').textContent = embedded;
const viewerStorage = new Map();
const local = { getItem: key => viewerStorage.get(key) ?? null, setItem: (key, value) => viewerStorage.set(key, value), removeItem: key => viewerStorage.delete(key) };
const w = vm.createContext({
 document: { getElementById: element, createElement: () => new Element(), addEventListener() {} },
 localStorage: local, confirm: () => true, URL, URLSearchParams,
 location: { search: '?course=I01' }, history: { replaceState() {} },
 fetch: async path => ({ ok: true, json: async () => String(path).includes('covers') ? {} : {
  number: 'I01', title: 'Communication', level: 'Intermediate', audience: 'Staff', filename: 'courses/example.pptx', sources: [], outcomes: [],
  slides: [1, 2].map(number => ({ number, image: 'example.png', text: `Page ${number}`, narration: 'Explanation', hidden: false, links: [] }))
 } })
});
vm.runInContext(helper, w);
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
vm.runInContext(inline, w);
await new Promise(resolve => setTimeout(resolve, 20));
assert.equal(element('stage').dataset.course, 'I01');
element('dsd-menu').click();
assert.equal(element('dsd-menu').getAttribute('aria-expanded'), 'true');
assert.equal(element('dsd-navigation').classList.contains('is-open'), true);
element('dsd-menu').closest('header').handlers.keydown({ key: 'Escape' });
assert.equal(element('dsd-menu').getAttribute('aria-expanded'), 'false');
assert.equal(element('dsd-menu').focused, true);
const normalSet = local.setItem;
local.setItem = () => { throw Error('quota'); };
element('next').click();
assert.match(element('progress-status').textContent, /could not save/);
assert.equal(element('stage').dataset.slide, '2');
local.setItem = normalSet;
local.setItem('one-dsd-learning-I01', JSON.stringify({ page: 2 }));
const normalRemove = local.removeItem;
local.removeItem = key => { if (key.endsWith('I01')) throw Error('blocked'); };
element('clear').click();
assert.match(element('progress-status').textContent, /could not be cleared/);
assert.equal(element('stage').dataset.slide, '2');
local.removeItem = normalRemove;
element('clear').click();
assert.match(element('progress-status').textContent, /has been cleared/);
assert.equal(local.getItem('one-dsd-learning-I01'), null);
assert.equal(element('stage').dataset.slide, '1');
local.setItem('one-dsd-learning-I01', JSON.stringify({ page: 2 }));
local.setItem('one-dsd-learning-I02', JSON.stringify({ page: 2 }));
local.removeItem = key => { if (key.endsWith('I02')) throw Error('blocked'); normalRemove(key); };
element('clear-all').click();
assert.match(element('progress-status').textContent, /could not be cleared/);
assert.equal(local.getItem('one-dsd-learning-I01'), null);
assert.notEqual(local.getItem('one-dsd-learning-I02'), null);
console.log('PASS: course progress recovery, failure notices, partial deletion and scoped browser privacy registry.');
