import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderPdf } from './exporters/pdf';
import { renderDocx } from './exporters/docx';
import { renderXlsx } from './exporters/xlsx';
import { renderPptx } from './exporters/pptx';
import { documentToHtml } from './exporters/text';
import type { ResourceDocument } from './model';

const document: ResourceDocument = { title: 'Accessible evaluation plan', subtitle: 'An example for reviewing evidence and deciding a next step.', kicker: 'One DHS', attribution: 'One DHS People, Access and Culture', meta: [{label:'Purpose',value:'Practice'}], sections: [{heading:'Your plan',blocks:[
 {kind:'paragraph',runs:[{text:'Keep the question connected to the evidence. ',bold:true},{text:'Check the limits before acting.'}]},
 {kind:'heading',level:2,text:'Compare the options'},
 {kind:'list',ordered:true,items:[[{text:'Name the decision.'}],[{text:'Review the sources.'}]]},
 {kind:'quote',text:'A comparison does not establish the cause.',cite:'Example teaching point'},
 {kind:'callout',label:'Privacy',text:'Use fictional information for this practice.'},
 {kind:'fields',rows:[{label:'Question',value:'What changed?'},{label:'Limit',value:'The groups differed.'}]},
 {kind:'table',headers:['Measure','Result'],rows:Array.from({length:40},(_,i)=>[`Measure ${i+1}`,`Evidence ${i+1}; clarify what is known.`])},
 ]}],sources:[{title:'Minnesota accessibility standard',href:'https://mn.gov/mnit/government/policies/accessibility/'}]};

function keep(name:string,bytes:Buffer){const dir=process.env.A11Y_ARTIFACT_DIR;if(dir){mkdirSync(dir,{recursive:true});writeFileSync(join(dir,name),bytes);}}
describe('accessible resource exports',()=>{
 it('generates a PDF with readable semantic structure on multiple pages',async()=>{
  const data=await renderPdf(document);keep('sample.pdf',data);
  const pdf=await import('pdfjs-dist/legacy/build/pdf.mjs');
  const reader=await pdf.getDocument({data:new Uint8Array(data),disableFontFace:true,useSystemFonts:true}).promise;
  const metadata=await reader.getMetadata();expect(metadata.info).toMatchObject({Title:document.title,Language:'en-US'});
  const markInfo: unknown = await reader.getMarkInfo();
  expect(markInfo instanceof Map ? markInfo.get("Marked") : (markInfo as {Marked?:boolean} | null)?.Marked).toBe(true);
  expect(reader.numPages).toBeGreaterThan(1);
  let structure='';let content='';
  for(let i=1;i<=reader.numPages;i++){const p=await reader.getPage(i);structure+=JSON.stringify(await p.getStructTree()); content+=(await p.getTextContent()).items.map(x=>'str' in x?x.str:'').join(' ');}
  expect(structure).toContain('H1');expect(structure).toContain('Table');expect(structure).toContain('TH');expect(structure).toContain('LBody');expect(content).toContain('Measure 40');

 });
 it('gives Word a title, language, subject, and table header rows',async()=>{
  const bytes=await renderDocx(document);keep('sample.docx',bytes);const zip=await JSZip.loadAsync(bytes);
  const xml=await zip.file('word/document.xml')!.async('string'); const styles=await zip.file('word/styles.xml')!.async('string');const core=await zip.file('docProps/core.xml')!.async('string');
  expect(xml).toContain('w:val="Title"'); expect(styles).toContain('en-US');expect(core).toContain('<dc:subject>');
  expect((xml.match(/<w:tbl>/g)||[]).length).toBe((xml.match(/<w:tblHeader/g)||[]).length);
 });
 it('gives Excel visible sheet titles and named tables with headers',async()=>{
  const bytes=await renderXlsx(document);keep('sample.xlsx',bytes);const zip=await JSZip.loadAsync(bytes);
  const tables=Object.keys(zip.files).filter(p=>/^xl\/tables\/table\d+\.xml$/.test(p));expect(tables.length).toBeGreaterThanOrEqual(3);
  for(const table of tables){const xml=await zip.file(table)!.async('string');expect(xml).toMatch(/ref="A3:/);expect(xml).toContain('tableColumn');}
  expect(await zip.file('docProps/core.xml')!.async('string')).toContain('<dc:subject>');
 });
 it('gives PowerPoint every slide a title placeholder',async()=>{
  const bytes=await renderPptx(document);keep('sample.pptx',bytes);const zip=await JSZip.loadAsync(bytes);
  const slides=Object.keys(zip.files).filter(p=>/^ppt\/slides\/slide\d+\.xml$/.test(p));expect(slides.length).toBeGreaterThan(2);
  for(const slide of slides){expect(await zip.file(slide)!.async('string')).toMatch(/<p:ph[^>]*type="title"/);}
  expect(await zip.file('docProps/core.xml')!.async('string')).toContain('<dc:subject>');
 });
 it('paginates long PowerPoint paragraphs and table cells without discarding source text',async()=>{
  const text='A complete source sentence for review. '.repeat(100)+'Final source marker.';
  const longDoc:ResourceDocument={...document,sections:[{heading:'Long content',blocks:[{kind:'paragraph',runs:[{text}]},{kind:'table',headers:['Item','Evidence'],rows:[['Case',text]]}]}],sources:[]};
  const bytes=await renderPptx(longDoc); const zip=await JSZip.loadAsync(bytes);
  const files=Object.keys(zip.files).filter(p=>/^ppt\/slides\/slide\d+\.xml$/.test(p));
  expect(files.length).toBeGreaterThan(6);
  const xml=(await Promise.all(files.map(p=>zip.file(p)!.async('string')))).join('');
  expect((xml.match(/Final source marker\./g)||[]).length).toBe(2);
 });
 it('keeps HTML tables associated with column headers',()=>{expect(documentToHtml(document)).toContain('<th scope="col">Measure</th>');});
});
