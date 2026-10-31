import {describe,it,expect} from 'vitest';
import {existsSync,writeFileSync} from 'node:fs';
import {CoursePackSchema} from './contract';
import {EMOTIONS_VALUES_COURSES} from './authored/emotions-values';
import {isRetiredCulturalWorkshop,retiredFeatureDestination} from '../../program/retired-features';
describe('Emotions and values curriculum',()=>{
 it('contains four complete seven-lesson courses with meaningful feedback and usable images',()=>{
  expect(EMOTIONS_VALUES_COURSES).toHaveLength(4);
  const ids=new Set<string>();
  for(const pack of EMOTIONS_VALUES_COURSES){
   CoursePackSchema.parse(pack);expect(pack.course.lessons).toHaveLength(7);
   expect(existsSync('public'+pack.course.coverImage)).toBe(true);
   for(const lesson of pack.course.lessons){
    expect(ids.has(lesson.id)).toBe(false);ids.add(lesson.id);
    const teaching=lesson.blocks.find(b=>b.type==='text');
    expect(teaching?.type==='text' && teaching.body.split(/\s+/).length).toBeGreaterThan(160);
    expect(lesson.scenario?.options.filter(o=>o.recommended)).toHaveLength(1);
    expect(new Set(lesson.scenario?.options.map(o=>o.response)).size).toBe(3);
    const check=lesson.blocks.find(b=>b.type==='knowledgeCheck');
    expect(check?.type==='knowledgeCheck' && check.options.filter(o=>o.correct).length).toBe(1);
   }
  }
  writeFileSync('curriculum-checks.json',JSON.stringify({courses:EMOTIONS_VALUES_COURSES.map(p=>({id:p.course.id,lessons:p.course.lessons.length,words:JSON.stringify(p).split(/\s+/).length})),lessonCount:ids.size,checkedAt:new Date().toISOString()},null,2));
 });
 it('retires the standalone workshop without hiding the adaptation or unrelated courses',()=>{
  expect(isRetiredCulturalWorkshop({id:'drive-cultural-intelligence-workshop'})).toBe(true);
  expect(isRetiredCulturalWorkshop({id:'unexpected-id',title:'Cultural Intelligence Workshop Cohort 1'})).toBe(true);
  expect(retiredFeatureDestination('/resources/drive-cultural-intelligence-workshop')).toBe('/courses/cv-understanding-your-lens');
  expect(retiredFeatureDestination('https://docs.google.com/presentation/d/1HmDVjnDGR9rsOJP-rcZ-QdNzlNDvnMNr/edit')).toBe('/courses/cv-understanding-your-lens');
  for(const pack of EMOTIONS_VALUES_COURSES)expect(isRetiredCulturalWorkshop(pack.course)).toBe(false);
  expect(isRetiredCulturalWorkshop({title:'Cultural Humility in Practice'})).toBe(false);
 });
});
