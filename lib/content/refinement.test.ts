import {describe,it,expect} from 'vitest';
import {expandedLibraryQuery,matchesExpandedLibraryQuery,libraryPage,libraryDestinations} from './library-discovery';
import {contentReviewPriorities} from './review-priorities';
import type {ContentItem} from './types';
import {WORK_EXAMPLES} from '../program/work-examples';
describe('Library discovery',()=>{
 it('connects exact abbreviations in both directions without matching substrings',()=>{
  expect(expandedLibraryQuery('CFSS')).toContain('community first services and supports');
  expect(expandedLibraryQuery('Community First Services and Supports')).toContain('cfss');
  expect(expandedLibraryQuery('classroom')).toBe('classroom');
  expect(expandedLibraryQuery('unrelated term')).toBe('unrelated term');
  expect(matchesExpandedLibraryQuery('CFSS','Community activities and other services')).toBe(false);
  expect(matchesExpandedLibraryQuery('CFSS','Community First Services and Supports')).toBe(true);
 });
 it('keeps every result accessible without duplicates across pages',()=>{
  const seen:number[]=[];
  for(let i=1;i<=64;i++){const p=libraryPage(760,String(i));for(let n=p.start;n<p.end;n++)seen.push(n);}
  expect(seen).toHaveLength(760);expect(new Set(seen).size).toBe(760);
  expect(libraryPage(0,'9')).toEqual({page:1,pages:1,start:0,end:0});
  expect(libraryPage(20,'-5').page).toBe(1);expect(libraryPage(20,'9999').page).toBe(2);
  expect(libraryPage(760,'2').end).toBe(24);
 });
 it('offers program context without pretending it is a search result or evidence',()=>{
  expect(libraryDestinations('CFSS')[0].href).toBe('/one-dsd/programs');
  expect(libraryDestinations('CLAS')[0].href).toBe('/practice/clas');
  expect(libraryDestinations('unknown')).toEqual([]);
 });
 it('connects all five examples to public routes and a practical outcome',()=>{
  expect(WORK_EXAMPLES).toHaveLength(5);
  for(const example of WORK_EXAMPLES){expect(example.links).toHaveLength(3);expect(example.check.length).toBeGreaterThan(50);for(const link of example.links){expect(link.href.startsWith('/')).toBe(true);expect(link.href).not.toContain('/consultant');}}
 });
});
describe('Content review stays advisory',()=>{
 const item={id:'a',title:'Example',type:'tool',authority:'guidance',layer:'L2',summary:'Example',body:['Specific guidance '.repeat(20)],nextActions:[{label:'Next',href:'/practice'}],tags:[],intents:[],owner:'Program team',reviewDate:'2026-10-01',status:'approved',scope:'dsd',accessibility:'reviewed',version:'1'} as ContentItem;
 it('flags missing responsibility and future dates without retiring content',()=>{
  const sample={...item,owner:'',reviewDate:'2027-01-01'};
  const report=contentReviewPriorities([sample],new Date('2026-10-16T12:00:00Z'));
  expect(report.priorities[0].reasons).toHaveLength(2);expect(sample.status).toBe('approved');
 });
 it('excludes retired content and distinguishes companion types',()=>{
  const report=contentReviewPriorities([item,{...item,id:'b',type:'learning_module'},{...item,id:'c',status:'retired'}],new Date('2026-10-16T12:00:00Z'));
  expect(report.total).toBe(2);expect(report.duplicates).toHaveLength(0);
  expect(contentReviewPriorities([item,{...item,id:'b'}]).duplicates).toHaveLength(1);
 });
});
