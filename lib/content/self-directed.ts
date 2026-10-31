import type { RoleFamily } from '@/lib/domains';
import data from './self-directed-data.json';
import type {ContentItem} from './types';
export const SELF_DIRECTED_COURSES=data;
export function selfDirectedThemes(id:string):string[]{
  const course=data.find(c=>'self-directed-'+c.number===id);
  if(!course)return [];
  const family=course.family.toLowerCase();
  if(family.includes('intercultural'))return ['intercultural','partnership'];
  if(family.includes('bias'))return ['structural','culture'];
  if(family.includes('disability'))return ['access','structural'];
  if(family.includes('community'))return ['partnership','intercultural'];
  if(family.includes('work'))return ['culture','facilitation'];
  return ['structural','partnership'];
}
export function selfDirectedHref(id:string):string|undefined{
  const course=data.find(c=>'self-directed-'+c.number===id);
  return course?'/learning/self-directed/index.html?course='+course.number:undefined;
}
export function selfDirectedItems():ContentItem[]{
  return data.map(course=>({id:'self-directed-'+course.number,title:course.title,type:'learning_module',authority:'learning',layer:'L3',summary:course.summary,body:course.body,nextActions:[{label:'Explore this self-directed course',href:selfDirectedHref('self-directed-'+course.number)!}],tags:[course.level,course.family,'self-directed',...(course.curriculum?['policy','legislation','Equity in Policy and Legislative Practice']:[])],intents:['practice_method'],owner:'One DSD People, Access and Culture',reviewDate:'2026-10-09',status:'approved',scope:'dsd',accessibility:'reviewed',version:'1'}));
}

/** Roles describe useful connections, not restrictions on participation. */
export function selfDirectedRoles(id: string): RoleFamily[] {
 const course=data.find(c=>'self-directed-'+c.number===id);
 if(!course)return [];
 const roles=new Set<RoleFamily>(['program_policy','service_delivery','supervisor_manager','equity_professional','leadership']);
 const family=course.family.toLowerCase();
 if(/work|race|bias|intercultural/.test(family)) roles.add('hiring_hr');
 if(/community|communication|access|intercultural/.test(family)) roles.add('communications');
 if(/policy|data|systems/.test(family)) {roles.add('data_quality');roles.add('fiscal_contracts');}
 return [...roles];
}

export function selfDirectedAreas(id:string):string[]{
 const course=data.find(c=>'self-directed-'+c.number===id);if(!course)return [];
 const family=course.family.toLowerCase();
 if(/intercultural/.test(family))return ['culture-trust','community-engagement'];
 if(/race|bias/.test(family))return ['culture-trust','workforce','policy-program-service'];
 if(/disability|access/.test(family))return ['access-language','policy-program-service'];
 if(/community|communication/.test(family))return ['community-engagement','access-language'];
 if(/work/.test(family))return ['workforce','culture-trust','leadership-systems'];
 return ['policy-program-service','measurement','leadership-systems'];
}
