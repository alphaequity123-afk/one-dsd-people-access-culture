import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseDocument} from 'htmlparser2';
import {findAll} from 'domutils';
import {sourceReadingText,readingAnchors,normalizeUrl} from './source-reading-format.mjs';

const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const hash=text=>createHash('sha256').update(text).digest('hex');
const manifest=read('data/source-readings/manifest.json');
const approvals=new Map(read('config/source-republication.json').approvals.map(row=>[normalizeUrl(row.url),row]));
const unavailable=new Set(read('data/source-readings/unavailable.json').map(normalizeUrl));
const bodies=new Map();
for(const entry of manifest){
  assert.match(entry.id,/^[a-f0-9]{20}$/);
  assert.ok(!bodies.has(entry.id),'Duplicate reading');
  const body=read(`data/source-readings/${entry.id}.json`);
  const permission=approvals.get(normalizeUrl(body.url));
  assert.ok(permission?.evidenceUrls?.length && permission.attribution,'Missing source rights record');
  assert.ok(['public-domain','CC-BY-4.0','CC-BY-SA-4.0','CC-BY-SA-3.0','CC0'].includes(permission.license),'Unapproved license');
  assert.equal(body.contentSha256,permission.contentSha256,'Reading differs from reviewed content');
  assert.equal(body.attribution,permission.attribution,'Source credit missing');
  assert.equal(body.licenseUrl,permission.licenseUrl,'License link missing');
  assert.equal(body.url,entry.url);assert.equal(body.original,entry.original);
  if(body.format==='html'){
    assert.ok(body.sections?.length,'Empty reading');
    assert.equal(hash(sourceReadingText(body.sections.map(section=>section.html).join(''))),permission.textSha256,'Full source text was altered or lost');
    assert.deepEqual(readingAnchors(body.sections),entry.anchors,'Fragment map differs from reading');
  }else assert.ok(body.document && fs.existsSync('public'+body.document),'Missing original document');
  bodies.set(entry.id,body);
}
let sections=0,links=0;
for(const body of bodies.values())for(const section of body.sections||[]){
  sections++;
  const dom=parseDocument(section.html);
  assert.equal(findAll(node=>['script','iframe','form','input','button'].includes(node.name)||Object.keys(node.attribs||{}).some(attr=>attr.startsWith('on')),dom.children).length,0,'Publisher script or dead control in reading');
  for(const link of findAll(node=>node.name==='a' && !!node.attribs.href,dom.children)){
    const href=link.attribs.href;
    assert.ok(!unavailable.has(normalizeUrl(href)),'Confirmed missing link in reading');
    if(!href.startsWith('/source-reading/'))continue;
    links++;
    const url=new URL(href,'https://one-dsd.example');
    const target=bodies.get(url.pathname.split('/').pop());
    assert.ok(target,'Link to an unpublished reading');
    const part=target.sections[Number(url.searchParams.get('section')||1)-1];
    assert.ok(part,'Link to missing reading section');
    if(url.hash){let anchor=url.hash.slice(1);try{anchor=decodeURIComponent(anchor);}catch{ /* Literal fragment. */ }
      assert.ok(findAll(node=>node.attribs?.id===anchor,parseDocument(part.html).children).length,'Link to missing footnote or section');
    }
  }
}
console.log(`PASS ${bodies.size} licensed readings; complete source text, attribution, ${sections} sections and ${links} internal source links verified.`);
