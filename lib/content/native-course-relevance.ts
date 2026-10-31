import type { ContentItem } from './types';
import type { DomainId, RoleFamily } from '@/lib/domains';
import catalog from './courses/authored/deia-catalog/catalog.json';
import plan from './courses/authored/deia-catalog/plan.json';
import themes from './courses/theme-memberships.json';

type Topic = { title: string; outcome: string; category: string; pathway: string; audience: string; core_roles: string[] };
const topics = catalog.topics as Record<string, Topic>;
const topicByCourse = new Map(plan.map(row => [`course-${row.id}`, topics[row.topicId]]));
const rolesByCode: Record<string, RoleFamily[]> = {
  LD: ['leadership'], SUP: ['supervisor_manager'], TL: ['supervisor_manager'],
  POL: ['program_policy'], DATA: ['data_quality'], FIS: ['fiscal_contracts'],
  TRN: ['communications'], CLN: ['service_delivery'],
};
const roleRules: [RoleFamily, RegExp][] = [
  ['program_policy', /\b(?:polic(?:y|ies)|legislat\w*|bill analysis|statut(?:e|es|ory)|regulat\w*|rulemaking|budget\w*|waiver|program design|service design|equity analysis)\b/],
  ['supervisor_manager', /\b(?:supervis\w*|manag\w*|team\w*|workplace|employee\w*|performance review|onboard\w*|meeting\w*|conflict|feedback|work culture)\b/],
  ['hiring_hr', /\b(?:hir\w*|recruit\w*|interview\w*|job descriptions?|qualifications?|pay equity|pay transparency|pay practices?|pay gaps?|pay decisions?|pay and classification|salary|classification|promotion\w*|succession|retention|onboard\w*|workforce|employee resource groups?)\b/],
  ['fiscal_contracts', /\b(?:procure\w*|contracts?|contracting|grants?|vendors?|budgets?|fiscal|purchas\w*|funding|resource allocation|cost(?:s|ing)?)\b/],
  ['communications', /\b(?:communicat\w*|language|interpret\w*|plain language|documents?|messag\w*|media|outreach|translat\w*|caption\w*|clas)\b/],
  ['data_quality', /\b(?:data|measur\w*|evaluat\w*|surveys?|statistic\w*|research|indicators?|baseline|quality improvement|privacy|evidence review)\b/],
  ['service_delivery', /\b(?:services?|case management|providers?|support planning|waivers?|disabilit\w*|person centered|lifecourse|clients?|eligibility|care planning|language access)\b/],
  ['equity_professional', /\b(?:equity|bias\w*|racis\w*|racial|inclus\w*|intersectional\w*|privilege|cultural|intercultural|clas|discriminat\w*|civil rights|accessibility|disparit\w*)\b/],
  ['leadership', /\b(?:leader\w*|strateg\w*|governance|systems change|systems thinking|accountability|sponsorship|decision authority|resource allocation)\b/],
];
const areaRules: [DomainId, RegExp][] = [
  ['workforce', /\b(?:hir\w*|recruit\w*|interview\w*|job descriptions?|qualifications?|pay equity|pay transparency|pay practices?|pay gaps?|pay decisions?|pay and classification|salary|classification|promotion\w*|succession|retention|onboard\w*|workforce|career|employee resource groups?)\b/],
  ['policy-program-service', /\b(?:polic(?:y|ies)|legislat\w*|bill analysis|statut(?:e|es|ory)|regulat\w*|rulemaking|budget\w*|waiver\w*|program design|service design|services?|eligibility|equity analysis)\b/],
  ['community-engagement', /\b(?:communit\w*|partnership\w*|co design\w*|community engagement|public engagement|stakeholder engagement|community consultation|stakeholder\w*|cultural intelligence|community brief)\b/],
  ['access-language', /\b(?:accessibility|accessible|language|interpret\w*|accommodat\w*|ada|plain language|caption\w*|clas|disabilit\w*)\b/],
  ['culture-trust', /\b(?:intercultural|cultur\w*|bias\w*|racis\w*|racial|trust|psychological safety|privilege|workplace|team\w*|microaggression\w*|conflict|belonging|respect\w*|identity)\b/],
  ['leadership-systems', /\b(?:leader\w*|organizational|institution\w*|structural|governance|systems|strateg\w*|accountability|procure\w*|contracts?|grants?)\b/],
  ['measurement', /\b(?:data|measur\w*|evaluat\w*|surveys?|statistic\w*|research|indicators?|baseline|quality improvement|evidence review|charts?|graphs?|disaggregat\w*|denominators?)\b/],
];
const pathwayAreas: Record<string, DomainId[]> = {
  'Equity Leadership': ['leadership-systems'], 'Inclusive Workplace and Culture': ['culture-trust','workforce'],
  'Intercultural Learning': ['culture-trust'], 'Accessibility and Language Access': ['access-language'],
  'Equity Analysis and Data': ['policy-program-service','measurement'],
  'Disability Rights and Person-Centered Practice': ['policy-program-service','access-language'],
  'Communities and Tribal Relations': ['community-engagement'],
};
const themeAreas: Record<string, DomainId[]> = {intercultural:['culture-trust','community-engagement'],access:['access-language'],culture:['culture-trust'],structural:['leadership-systems','policy-program-service'],partnership:['community-engagement'],facilitation:['culture-trust']};
const themeRoles: Record<string, RoleFamily[]> = {intercultural:['equity_professional','communications'],access:['service_delivery','communications'],culture:['supervisor_manager','equity_professional'],structural:['program_policy','equity_professional'],partnership:['program_policy','service_delivery'],facilitation:['supervisor_manager']};
const taskRules: Record<string, RegExp> = {
 'workforce/design-role': /\b(?:job descriptions?|qualifications?|job related|essential functions|design\w* (?:a )?role)\b/,
 'workforce/run-selection': /\b(?:hir\w*|recruit\w*|interview\w*|candidate\w*|selection)\b/,
 'workforce/advancement-pay': /\b(?:pay|classification|promotion\w*|advancement|compensation)\b/,
 'workforce/accessible-leadership-pathways': /\b(?:leadership pathways?|sponsorship|succession|career|advancement)\b/,
 'workforce/retention': /\b(?:retention|retain\w*|stay interviews?|turnover)\b/,
 'policy-program-service/equity-analysis': /\b(?:equity analysis|equity scan|impact assessment|bill analysis|legislat\w*|policy analysis)\b/,
 'policy-program-service/new-program': /\b(?:program design|service design|design\w* (?:a )?(?:program|service)|new program|implementation)\b/,
 'policy-program-service/form-notice': /\b(?:polic(?:y|ies)|forms?|notices?|plain language|documents?)\b/,
 'policy-program-service/service-delivery': /\b(?:services?|support planning|person centered|waivers?|providers?)\b/,
 'community-engagement/engagement-plan': /\b(?:community engagement|public engagement|stakeholder engagement|co design|partnership\w*|stakeholder\w*|community listening)\b/,
 'community-engagement/report-back': /\b(?:report back|feedback loops?|closing the loop|partners informed)\b/,
 'community-engagement/community-context': /\b(?:community brief|cultural intelligence|minnesota communit\w*|somali|hmong|cultural context)\b/,
 'access-language/accessible-meeting': /\b(?:meetings?|facilitat\w*|participation|captions?)\b/,
 'access-language/accessible-document': /\b(?:documents?|forms?|notices?|plain language|web content|digital accessibility)\b/,
 'access-language/language-plan': /\b(?:language|interpret\w*|translat\w*|clas)\b/,
 'culture-trust/team-climate': /\b(?:team\w*|workplace|psychological safety|climate|belonging|conflict)\b/,
 'culture-trust/intercultural': /\b(?:intercultural|cultural humility|cultural intelligence|cultural competence|cultural differences?)\b/,
 'culture-trust/power-identity': /\b(?:power|identity|race|racial|racis\w*|structural|privilege|bias\w*|intersectional\w*)\b/,
 'leadership-systems/decision-record': /\b(?:decision\w*|accountability|governance|equity analysis)\b/,
 'leadership-systems/procurement': /\b(?:procure\w*|contracts?|grants?|vendors?|solicitation\w*)\b/,
 'leadership-systems/leadership-pathways': /\b(?:leadership development|leadership pathways?|sponsorship|succession|mentoring)\b/,
 'measurement/evaluation-plan': /\b(?:evaluat\w*|measur\w*|indicators?|baseline|surveys?)\b/,
 'measurement/read-disaggregated-data': /\b(?:data|disaggregat\w*|statistic\w*|sample\w*|denominator\w*)\b/,
};

/** Individually reviewed concepts whose specific titles need more than a keyword rule. */
const conceptConnections: Record<string,{roles:RoleFamily[];areas:DomainId[];basis:string}> = {
 'course-div-f06-social-identity': {roles:['equity_professional','supervisor_manager','hiring_hr'],areas:['culture-trust','workforce'],basis:'Social identity, group membership and belonging inform workplace participation and fair evaluation.'},
 'course-div-i01-microinterventions': {roles:['equity_professional','supervisor_manager','service_delivery'],areas:['culture-trust'],basis:'Responding to microaggressions and subtle exclusion applies to team and service interactions.'},
 'course-div-i04-code-switching': {roles:['equity_professional','supervisor_manager','communications','hiring_hr'],areas:['culture-trust','workforce'],basis:'Identity concealment and authenticity concern communication expectations and conditions of workplace participation.'},
 'course-div-i06-classism': {roles:['equity_professional','program_policy','service_delivery','hiring_hr'],areas:['policy-program-service','workforce','culture-trust'],basis:'Hidden resource assumptions and class barriers affect service design and employment opportunity.'},
 'course-div-i07-gender-double-binds': {roles:['equity_professional','supervisor_manager','hiring_hr'],areas:['workforce','culture-trust'],basis:'Gender stereotypes and personality judgments affect assessment, opportunity and team expectations.'},
 'course-div-a04-epistemic-injustice': {roles:['equity_professional','program_policy','data_quality','leadership'],areas:['community-engagement','policy-program-service','leadership-systems'],basis:'Credibility and whose knowledge counts concern the use of community and staff knowledge in evidence and decisions.'},
 'course-div-a07-networks-opportunity-hoarding': {roles:['hiring_hr','supervisor_manager','leadership','equity_professional'],areas:['workforce','leadership-systems'],basis:'Information and advocacy through networks affect fair access to development and advancement.'},
 'course-dc-s5-how-systems-create-unequal-outcomes': {roles:['program_policy','service_delivery','leadership','equity_professional'],areas:['policy-program-service','leadership-systems'],basis:'Rules, information and handoffs can create barriers in service systems and institutional decisions.'},
 'course-dc-s7-protected-classes-under-the-minnesota-human-righ': {roles:['hiring_hr','program_policy','service_delivery','equity_professional'],areas:['workforce','policy-program-service'],basis:'Recognizing protected characteristics and the proper concern process supports employment and service-policy orientation; it is not legal advice.'},
 'course-dc-s8-executive-order-23-12-for-staff': {roles:['leadership','equity_professional','program_policy'],areas:['leadership-systems','workforce'],basis:'The course describes councils and agency-plan direction relevant to equity governance and workforce priorities; current requirements must be confirmed.'},
 'course-div-f10-equality-equity-fairness': {roles:['equity_professional','program_policy','supervisor_manager'],areas:['culture-trust','policy-program-service'],basis:'Comparing sameness, meaningful opportunity and reasoned fairness supports workplace and policy judgments.'},
 'course-dc-s6-your-role-in-equity-whatever-your-job': {roles:['program_policy','supervisor_manager','hiring_hr','fiscal_contracts','communications','data_quality','service_delivery','equity_professional','leadership'],areas:['culture-trust','policy-program-service'],basis:'This particular source title explicitly addresses equity responsibilities whatever the staff member’s job; this is not a default for other courses.'},
 'course-dc-s9-intersectionality-in-everyday-work': {roles:['equity_professional','program_policy','hiring_hr','service_delivery'],areas:['culture-trust','workforce','policy-program-service'],basis:'Intersecting identities, power and practical conditions affect workplace and service decisions.'},
 'course-dc-s10-where-to-get-help-with-equity-questions': {roles:['program_policy','supervisor_manager','hiring_hr','fiscal_contracts','communications','data_quality','service_delivery','equity_professional','leadership'],areas:['culture-trust','leadership-systems'],basis:'This specific staff-orientation course concerns finding guidance and keeping formal responsibilities clear across roles.'},
};

type Relevance = {roles:RoleFamily[];areas:DomainId[];text:string};
const cache = new WeakMap<ContentItem,Relevance>();
/** Render-only discovery suggestions grounded in source topics and subject metadata, not eligibility or an official assignment. Lesson-body search does not change facet membership. */
function relevance(item:ContentItem):Relevance {
 const saved=cache.get(item);if(saved)return saved;
 if(!item.id.startsWith('course-'))return {roles:[],areas:[],text:''};
 const topic=topicByCourse.get(item.id);
 const text=[item.title,item.summary,topic?.title,topic?.outcome,topic?.category,topic?.pathway].filter(Boolean).join(' ').replace(/<[^>]+>/g,' ').replace(/[-–—]/g,' ').toLowerCase();
 const roles=new Set<RoleFamily>(),areas=new Set<DomainId>();
 const concept=conceptConnections[item.id];for(const role of concept?.roles??[])roles.add(role);for(const area of concept?.areas??[])areas.add(area);
 for(const code of topic?.core_roles??[])for(const role of rolesByCode[code]??[])roles.add(role);
 if(topic?.audience.toLowerCase()==='leaders'){roles.add('leadership');roles.add('supervisor_manager');}
 for(const [role,pattern] of roleRules)if(pattern.test(text))roles.add(role);
 for(const [area,pattern] of areaRules)if(pattern.test(text))areas.add(area);
 for(const area of pathwayAreas[topic?.pathway??'']??[])areas.add(area);
 for(const [theme,ids] of Object.entries(themes))if(ids.includes(item.id)){for(const area of themeAreas[theme]??[])areas.add(area);for(const role of themeRoles[theme]??[])roles.add(role);}
 const result={roles:[...roles],areas:[...areas],text};cache.set(item,result);return result;
}
export function nativeCourseRoles(item:ContentItem):RoleFamily[]{return relevance(item).roles;}
export function nativeCourseAreas(item:ContentItem):DomainId[]{return relevance(item).areas;}
export function nativeCourseMatchesTask(item:ContentItem,area:string,task:string):boolean {const r=relevance(item);return r.areas.includes(area as DomainId)&&Boolean(taskRules[`${area}/${task}`]?.test(r.text));}

export const NATIVE_COURSE_CONCEPT_CONNECTIONS = conceptConnections;
