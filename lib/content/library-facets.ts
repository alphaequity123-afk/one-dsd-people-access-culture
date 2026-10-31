import { nativeCourseRoles } from './native-course-relevance';
import { selfDirectedRoles } from './self-directed';
import { DOMAINS,ROLE_FAMILY_LABEL,type RoleFamily,type Domain } from '@/lib/domains';
import { LAYER_LABEL, type ContentItem, type ContentLayer } from './types';
import { matchesResourceTheme, matchesResourceLevel, resourceLearningLevel } from './resource-organization';
import type { PracticeGuide } from '@/lib/program/dsd-practice-guides';
import type { LibraryFilters } from './work-index';
export type LibraryFacets = {role?:string;topic?:string;theme?:string;level?:string};
export function matchesLibraryFacets(item:ContentItem, filters:LibraryFacets, domains: readonly Pick<Domain,'tasks'>[]=DOMAINS):boolean {
  if(filters.role && (!Object.hasOwn(ROLE_FAMILY_LABEL,filters.role) || !(selfDirectedRoles(item.id).includes(filters.role as RoleFamily) || nativeCourseRoles(item).includes(filters.role as RoleFamily) || domains.some(domain=>domain.tasks.some(task=>task.roles.includes(filters.role as RoleFamily)&&task.contentIds.includes(item.id))))))return false;
  if(filters.topic && !item.tags.includes(filters.topic))return false;
  if(filters.theme && !matchesResourceTheme(item,filters.theme))return false;
  if(filters.level && !matchesResourceLevel(item,filters.level))return false;
  return true;
}

const guideConnections: Record<string,{themes:string[];roles:RoleFamily[];areas:string[];tasks:string[]}> = {
  'inclusive-meetings': {themes:['access','workforce','identity','partnership'],roles:['supervisor_manager','communications','equity_professional','program_policy','service_delivery','leadership'],areas:['access-language','culture-trust','community-engagement','workforce'],tasks:['accessible-meeting','team-climate','engagement-plan']},
  'clearer-processes': {themes:['access','policy','disability'],roles:['program_policy','communications','service_delivery','equity_professional','supervisor_manager'],areas:['policy-program-service','access-language'],tasks:['form-notice','accessible-document','service-delivery','equity-analysis']},
  'review-a-change': {themes:['evidence','leadership','workforce'],roles:['data_quality','leadership','supervisor_manager','program_policy','equity_professional','service_delivery'],areas:['measurement','leadership-systems','culture-trust'],tasks:['evaluation-plan','read-disaggregated-data','decision-record','team-climate']},
};

/** Guides retain relevant filtered/search entry points while course levels remain course-only. */
export function matchesPracticeGuideFilters(guide:PracticeGuide,filters:LibraryFilters,published:readonly ContentItem[]):boolean {
  if(filters.level || (filters.type && filters.type !== 'tool') || (filters.authority && filters.authority !== 'guidance'))return false;
  const connection=guideConnections[guide.slug];
  if(filters.role && !connection?.roles.includes(filters.role as RoleFamily))return false;
  if(filters.area && !connection?.areas.includes(filters.area))return false;
  if(filters.task && !connection?.tasks.includes(filters.task))return false;
  const linkedIds=new Set(guide.resources.filter(resource=>resource.href.startsWith('/library/')).map(resource=>resource.href.slice('/library/'.length)));
  const linked=published.filter(item=>linkedIds.has(item.id));
  if(filters.topic && !linked.some(item=>item.tags.includes(filters.topic!)))return false;
  const guideThemeAliases:Record<string,string[]>={culture:['workforce'],intercultural:['identity'],structural:['identity','policy','leadership'],facilitation:['access','workforce']};
  const themes=filters.theme ? guideThemeAliases[filters.theme] ?? [filters.theme] : [];
  if(filters.theme && !themes.some(theme=>connection?.themes.includes(theme)) && !linked.some(item=>matchesResourceTheme(item,filters.theme!)))return false;
  return true;
}

/** Course level is distinct from a practical resource's reading depth. */
export function resourceDepthLabel(item: ContentItem | undefined, fallbackLayer?: ContentLayer): string {
  const level = item ? resourceLearningLevel(item) : null;
  if (level) return level.charAt(0).toUpperCase() + level.slice(1);
  const layer = item?.layer ?? fallbackLayer;
  return layer ? LAYER_LABEL[layer] : "";
}
