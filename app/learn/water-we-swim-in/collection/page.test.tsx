import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render} from '@testing-library/react';

vi.mock('@/lib/product/request-context',()=>({requestedContentScope:async()=> 'dsd'}));
vi.mock('@/lib/content/community-profile',()=>({publishedCommunityProfile:async()=>null}));
vi.mock('@/components/editable-surface',()=>({prepareEditableSurface:async()=>({available:false})}));
vi.mock('@/lib/auth/request',()=>({ownerFromCookies:async()=>null}));
vi.mock('@/lib/content/intercultural-community-list',()=>({getAvailableInterculturalCommunities:async()=>[]}));
vi.mock('@/lib/content/geffen-volume',()=>({getGeffenPassageRecordings:async()=>new Map()}));
vi.mock('@/lib/content/clas-curriculum-page-data',()=>({loadCaptionCues:()=>[{start:0,end:2,text:'Module discussion.'}]}));
vi.mock('@/components/course-media-for-page',()=>({CourseMediaSlot:()=>null,CourseMediaJumpSlot:()=>null}));
vi.mock('@/components/geffen-read-aloud',()=>({GeffenReadAloud:()=>null}));
vi.mock('@/components/practice-video',()=>({PracticeVideo:()=>null}));
vi.mock('@/lib/content/water-curriculum',()=>({waterModuleId:(n:number)=>String(n),waterLesson:(id:string)=>({id,images:[],podcast:{title:`Discussion ${id}`,summary:'A module discussion.',src:`/${id}.mp3`,captions:`/${id}.vtt`,transcript:`/${id}.txt`,durationSeconds:60,chapters:[]}})}));

import WaterCollectionPage from './page';
afterEach(cleanup);

describe('Water collection headings and navigation landmarks',()=>{
 it.each(['1','2'])('keeps focused step%s headings in order',async step=>{
  const view=render(await WaterCollectionPage({searchParams:Promise.resolve({step})}));
  expect(view.getAllByRole('heading',{level:1})).toHaveLength(1);
  expect(view.getByRole('heading',{level:2,name:'Read and connect'})).toBeTruthy();
  expect(view.getByRole('heading',{level:2,name:'Try it at North Crossing'})).toBeTruthy();
  for(const item of view.container.querySelectorAll('details'))item.open=true;
  expect(view.getByRole('heading',{level:2,name:`Listen: Discussion ${step}`})).toBeTruthy();
  const levels=[...view.container.querySelectorAll('h1,h2,h3,h4')].map(h=>Number(h.tagName[1]));
  for(let i=1;i<levels.length;i++)expect(levels[i]).toBeLessThanOrEqual(levels[i-1]+1);
 });
 it('gives each expanded step and podcast transcript a distinct region name',async()=>{
  const view=render(await WaterCollectionPage({}));
  for(const item of view.container.querySelectorAll('details'))item.open=true;
  const regions=view.getAllByRole('region');
  const names=regions.map(region=>region.getAttribute('aria-label')??region.getAttribute('aria-labelledby')!.split(' ').map(id=>document.getElementById(id)!.textContent).join(' '));
  expect(names.filter(n=>n.startsWith('Read and connect'))).toHaveLength(6);
  expect(names.filter(n=>n.endsWith('podcast transcript'))).toHaveLength(6);
  expect(new Set(names).size).toBe(names.length);
 });
});
