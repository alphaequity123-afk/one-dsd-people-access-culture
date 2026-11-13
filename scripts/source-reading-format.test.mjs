import test from 'node:test';
import assert from 'node:assert/strict';
import {formatSourceHtml,finalizeSourceHtml,readingSections,readingAnchors,normalizeUrl} from './source-reading-format.mjs';
import {parseDocument} from 'htmlparser2';
import {textContent} from 'domutils';

test('retains the complete reading, table, attribution and closed disclosure without publisher scripts',()=>{
  const result=formatSourceHtml('<html><head><title>A service guide</title></head><body><nav>Site menu</nav><main><h1>Service guide</h1><p>A complete explanation.</p><details><summary>More detail</summary><p>The full qualification stays.</p></details><table><caption>Evidence</caption><tr><th scope="col">Period</th><td>2025</td></tr></table><footer>Prepared by the source team.</footer><script>unsafe()</script><p onclick="unsafe()">Another paragraph.</p></main></body></html>','https://example.org/guide');
  assert.equal(result.textPreserved,true);
  for(const text of ['A complete explanation.','The full qualification stays.','Evidence','2025','Prepared by the source team.','Another paragraph.']) assert.ok(result.html.includes(text));
  assert.ok(!/unsafe|Site menu/.test(result.html));
  assert.ok(result.html.includes('scope="col"'));
});

test('keeps original reference links unless a complete local reading is available',()=>{
  const html='<p><a href="https://example.org/guide#evidence">Evidence</a> and <a href="https://example.org/other">Original reference</a>.</p>';
  const result=finalizeSourceHtml(html,'https://example.org/page',new Map([['https://example.org/guide','abc']]),new Map());
  assert.ok(result.includes('/source-reading/abc#evidence'));
  assert.ok(result.includes('href="https://example.org/other"'));
});

test('flags interactive and access pages for review and rejects credential-bearing URLs',()=>{
  const form=formatSourceHtml('<main><form action="/submit"><p>Instructions.</p><input name="answer"></form><iframe src="/video"></iframe></main>','https://example.org/guide');
  assert.deepEqual(form.interactive.map(x=>x.tag),['form','iframe']);
  assert.equal(formatSourceHtml('<title>Access Denied</title><main>Verify you are human.</main>','https://example.org/guide').blocked,true);
  assert.equal(normalizeUrl('https://user:password@example.org/guide'),null);
});

test('splitting a long reading keeps all paragraphs in their original order',()=>{
  const paragraphs=Array.from({length:5},(_,i)=>`<h2>Topic ${i+1}</h2><p>${(`Detail ${i+1} `).repeat(120)}</p>`);
  const html=paragraphs.join('');
  const sections=readingSections(html);
  assert.ok(sections.length>1);
  assert.equal(sections.map(x=>x.html).join(''),html);
});

test('publisher wrappers do not join every topic, and footnotes open their correct part',()=>{
  const html=`<div id="main-body"><h2 id="start">First topic</h2><p>${'Source detail. '.repeat(180)}<a href="#note-1">Note 1</a></p><section id="notes"><h2>Notes</h2><p id="note-1">The full qualification.</p><a href="#start">Back</a></section></div>`;
  const parts=readingSections(html);
  assert.equal(parts.length,2);
  assert.equal(textContent(parseDocument(parts.map(p=>p.html).join(''))),textContent(parseDocument(html)));
  const anchors=readingAnchors(parts);
  assert.equal(anchors['note-1'],2);
  assert.equal(anchors.notes,2);
  const available=new Map([['https://example.org/guide',{id:'abc',anchors}]]);
  assert.match(finalizeSourceHtml(parts[0].html,'https://example.org/guide',available,new Map()),/href="\/source-reading\/abc\?section=2#note-1"/);
  assert.match(finalizeSourceHtml(parts[1].html,'https://example.org/guide',available,new Map()),/href="\/source-reading\/abc\?section=1#start"/);
});

test('known missing references retain attribution text without offering a broken destination',()=>{
  const html='<p>Source: <a href="https://example.org/gone">The original author</a>.</p>';
  const result=finalizeSourceHtml(html,'https://example.org/page',new Map(),new Map(),new Set(['https://example.org/gone']));
  assert.ok(result.includes('The original author'));
  assert.ok(!result.includes('href='));
});

test('older named anchors survive as reachable footnote targets',()=>{
  const source=formatSourceHtml('<main><h1>Guide</h1><p><a href="#_ftn1">Note 1</a></p><p><a name="_ftn1"></a>The original footnote.</p></main>','https://example.org/guide');
  assert.ok(source.html.includes('id="_ftn1"'));
  assert.equal(readingAnchors(readingSections(source.html))._ftn1,1);
});
