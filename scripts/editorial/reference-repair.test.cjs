const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isAcceptedReferenceRepair, isAcceptedAssetRepair } = require('./reference-repair.cjs');
const change = { path: ['pack', 'sources', 0, 'href'], before: '#', after: 'https://mn.gov/dhs/assets/equity-policy.pdf' };
const repair = { ...change, path: change.path.slice(1), review: { status: 'accepted', reviewer: 'independent reviewer', evidence: 'Read the identified source.' } };
test('requires an exact accepted repair and source path', () => {
  assert.equal(isAcceptedReferenceRepair({ referenceRepairs: [repair] }, change), true);
  assert.equal(isAcceptedReferenceRepair({}, change), false);
  for (const modified of [{ before: 'other' }, { after: 'https://example.org/other' }, { path: ['pack', 'course', 'introAudio'] }, { path: ['pack', 'sources', 1, 'href'] }]) {
    assert.equal(isAcceptedReferenceRepair({ referenceRepairs: [repair] }, { ...change, ...modified }), false);
  }
  assert.equal(isAcceptedReferenceRepair({ referenceRepairs: [{ ...repair, review: { ...repair.review, status: 'draft' } }] }, change), false);
});
test('rejects executable, insecure and credential-bearing references even if declared', () => {
  for (const after of ['javascript:alert(1)', 'http://example.org', 'https://user:pass@example.org', 'https://localhost/test', 'https://127.0.0.1/test']) {
    assert.equal(isAcceptedReferenceRepair({ referenceRepairs: [{ ...repair, after }] }, { ...change, after }), false);
  }
});

test('allows a declared independently reviewed citation title only at its exact source field', () => {
 const titleChange={path:['pack','sources',0,'title'],before:'Unverified attribution',after:'Verified author and title'};
 const titleRepair={...titleChange,path:titleChange.path.slice(1),review:repair.review};
 assert.equal(isAcceptedReferenceRepair({referenceRepairs:[titleRepair]},titleChange),true);
 assert.equal(isAcceptedReferenceRepair({},titleChange),false);
 assert.equal(isAcceptedReferenceRepair({referenceRepairs:[titleRepair]},{...titleChange,path:['pack','course','title']}),false);
});

test('permits only the accepted exact illustrative diagram without opening other media fields', () => {
  const row = require('../../lib/content/course-language-revisions.json').courses.find(c => c.courseId === 'somali-minnesota-brief');
  const repair = row.assetRepairs[0];
  const change = { ...repair, path: ['pack', ...repair.path] };
  assert.equal(isAcceptedAssetRepair(row, change), true);
  for (const modified of [{ after: '/images/other.svg' }, { path: ['pack', 'course', 'introAudio'] }, { before: '/images/other.png' }]) {
    assert.equal(isAcceptedAssetRepair(row, { ...change, ...modified }), false);
  }
  assert.equal(isAcceptedAssetRepair({ ...row, courseId: 'other-course' }, change), false);
  assert.equal(isAcceptedAssetRepair({ ...row, assetRepairs: [{ ...repair, review: { ...repair.review, status: 'draft' } }] }, change), false);
});
