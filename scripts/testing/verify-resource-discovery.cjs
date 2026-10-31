const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const ts = require('typescript');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, ...rest) {
  const resolved = request.startsWith('@/') ? path.join(root, request.slice(2)) : request;
  const typed = !path.extname(resolved) && ['.ts','.tsx'].map(ext => resolved + ext).find(file => fs.existsSync(file));
  return originalResolve.call(this, typed || resolved, parent, ...rest);
};
for (const ext of ['.ts', '.tsx']) Module._extensions[ext] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), { compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true} }).outputText,filename);
const {normalizeLibraryFilters, libraryHref}=require(path.join(root,'lib/content/work-index.ts'));
const {matchesLibraryFacets,matchesPracticeGuideFilters,resourceDepthLabel}=require(path.join(root,'lib/content/library-facets.ts'));
const {selectHubItems,LEARNING_HUB_SURFACE}=require(path.join(root,'lib/content/learning-hub.ts'));
const {selfDirectedItems}=require(path.join(root,'lib/content/self-directed.ts'));
const {staffCorpus}=require(path.join(root,'lib/content/staff-corpus.ts'));
const {practiceGuides}=require(path.join(root,'lib/program/dsd-practice-guides.ts'));
const {ResourceStartingPoints}=require(path.join(root,'components/resource-starting-points.tsx'));
Module._extensions['.css'] = module => { module.exports = new Proxy({}, {get: (_, key) => key === '__esModule' ? false : String(key)}); };
const {LearningTile}=require(path.join(root,'components/learning-tile.tsx'));
const {ResourceThemeNav}=require(path.join(root,'components/resource-theme-nav.tsx'));
const {RESOURCE_THEMES}=require(path.join(root,'lib/content/resource-organization.ts'));
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');

const items=[...staffCorpus(),...selfDirectedItems()];
const defaults=LEARNING_HUB_SURFACE.approvedValues;
const variants=['foundation','Foundation','FOUNDATION','Foundations'];
for(const value of variants) assert.equal(normalizeLibraryFilters({level:value}).level,'foundation');
const normalized=normalizeLibraryFilters({theme:'policy',level:'Advanced',role:'program_policy',topic:'policy'});
assert.deepEqual(normalized,{role:'program_policy',topic:'policy',theme:'policy',level:'advanced'});
assert.match(libraryHref(normalized,'bill analysis'),/theme=policy/);
assert.match(libraryHref(normalized,'bill analysis'),/level=advanced/);
assert.equal(normalizeLibraryFilters({level:'anything',theme:'anything'}).level,undefined);
assert.equal(normalizeLibraryFilters({level:'anything',theme:'anything'}).theme,undefined);

const advanced=items.find(item=>item.id==='self-directed-A21');
assert(advanced);
assert(matchesLibraryFacets(advanced,{level:'advanced',theme:'policy'}));
assert(!matchesLibraryFacets(advanced,{level:'foundation'}));
const policy=items.find(item=>item.id==='tool-one-dsd-policy-review');
assert(policy);
assert(selectHubItems(items,defaults,{theme:'policy'}).some(item=>item.id===policy.id));
assert(!selectHubItems(items,defaults,{theme:'policy',level:'advanced'}).some(item=>item.id===policy.id));
assert.equal(selectHubItems(items,defaults,{q:policy.title})[0]?.id,policy.id);
assert(selectHubItems(items,defaults,{theme:'structural'}).length>0);
assert.deepEqual(selectHubItems(items,defaults,{}).map(item=>item.id),items.map(item=>item.id));
const curatorAdded={...policy,id:'custom-workplace-guide',tags:[]};
assert.equal(selectHubItems([curatorAdded],{...defaults,cultureIds:[curatorAdded.id]},{theme:'workforce'})[0]?.id,curatorAdded.id);
assert.equal(selectHubItems([],{...defaults,cultureIds:[curatorAdded.id]},{theme:'workforce'}).length,0);

const meeting=practiceGuides.find(guide=>guide.slug==='inclusive-meetings');
assert(meeting);
assert(matchesPracticeGuideFilters(meeting,{role:'supervisor_manager'},items));
assert(matchesPracticeGuideFilters(meeting,{theme:'access',role:'supervisor_manager'},items));
assert(matchesPracticeGuideFilters(meeting,{topic:'language access'},items));
assert(!matchesPracticeGuideFilters(meeting,{level:'advanced'},items));
assert(!matchesPracticeGuideFilters(meeting,{type:'external_reference'},items));
assert(!matchesPracticeGuideFilters(meeting,{role:'fiscal_contracts'},items));

const hidden=renderToStaticMarkup(React.createElement(ResourceStartingPoints,{items:[],toolkitAvailable:false}));
assert(!hidden.includes('/library/ext-dhs-equity-toolkit'));
assert(!hidden.includes('/courses/dhs-equity-analysis-toolkit'));
assert(!hidden.includes('/learn/equity-toolkit'));
assert(!hidden.includes('course=F16'));
const shown=renderToStaticMarkup(React.createElement(ResourceStartingPoints,{items,toolkitAvailable:true}));
assert(shown.includes('/library/ext-dhs-equity-toolkit'));
assert(shown.includes('course=F16'));
assert(shown.includes('/learn/equity-toolkit'));
console.log('Resource discovery regressions passed: level normalization, theme/level intersections, direct title search, legacy themes, retained full collection, filtered practical guides, and withdrawal-aware recommendations.');

// A course's verified level must be identical in search metadata and its learning tile.
assert.equal(resourceDepthLabel(advanced,'L2'),'Advanced');
const foundation=items.find(item=>item.id==='self-directed-F21');
assert.equal(resourceDepthLabel(foundation),'Foundation');
const unknown={...advanced,id:'unclassified-new-course',title:'New course',summary:'Practice with a decision.',layer:'L2',tags:[]};
assert.equal(resourceDepthLabel(unknown),'How to do it');
assert.equal(resourceDepthLabel(undefined,'L4'),'Reference and evidence');
assert.equal(resourceDepthLabel(undefined), '');
for (const [item,label] of [[advanced,'advanced'],[foundation,'foundation']]) {
  const tile=renderToStaticMarkup(React.createElement(LearningTile,{item,showLevel:true}));
  assert(tile.includes(`data-learning-level="${label}"`));
}
const defaultTile=renderToStaticMarkup(React.createElement(LearningTile,{item:advanced}));
assert(!defaultTile.includes('data-learning-level='),'Existing tile callers must remain unchanged unless they opt in.');
const unknownTile=renderToStaticMarkup(React.createElement(LearningTile,{item:unknown,showLevel:true}));
assert(!unknownTile.includes('data-learning-level='),'Do not invent a learning level for an unclassified course.');
for (const basePath of ['/learn','/library']) {
  const nav=renderToStaticMarkup(React.createElement(ResourceThemeNav,{basePath}));
  for(const theme of RESOURCE_THEMES) assert(nav.includes(`${basePath}?theme=${theme.id}`));
  assert.equal((nav.match(/<li>/g)||[]).length,8);
  assert(!nav.includes('<details'),'Theme entry points must be visible without opening a filter.');
}
console.log('Resource labels and theme navigation passed: known level, unknown fallback, opt-in tile labels, and all eight direct theme choices.');
