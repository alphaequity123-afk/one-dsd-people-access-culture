import { defineEditableSurface, type EditableSurfaceValues } from './editable-surface-contract';
export const MEASUREMENT_RESOURCE_ID = 'pn-measurement-without-surveillance';
export const MEASUREMENT_HREF = '/practice/measurement';
export const MEASUREMENT_PLAN_FIELD_IDS = ['need','activities','outputs','outcomes','baseline','methods','protection','limits','responsibility','reflection'] as const;
export const INDICATOR_FIELD_IDS = ['indicator','calculation','population','evidenceSource','period','differences','reporting','action','approval'] as const;
export const MEASUREMENT_FIELD_IDS = [...MEASUREMENT_PLAN_FIELD_IDS, ...INDICATOR_FIELD_IDS] as const;
const copy = {
 title: 'Plan how to learn from results', intro: 'Develop an evaluation plan that connects an equity question with meaningful evidence and a practical next decision.',
 notesTitle: 'Your evaluation plan', sourceLabel: 'Read the measurement practice note',
 privacy: 'These notes are not saved. Copy or download what you want to keep before leaving. Use program-level examples and responsible roles; leave out names, private learning records, and confidential case details.',
 copyLabel: 'Copy notes', downloadLabel: 'Download notes', copied: 'Notes copied.', downloadReady: 'Your notes download is ready.', manual: 'Select and copy your notes below.', manualLabel: 'Your notes',
 needLabel: 'The question and the need', needHelp: 'What pattern, barrier, or decision do you want to understand? Whose experience will help define what matters?',
 activitiesLabel: 'Resources and activities', activitiesHelp: 'What capacity, support, or changes could address the need? Describe what will actually happen.',
 outputsLabel: 'What the work will produce', outputsHelp: 'Name the immediate products or completed activities. Keep these separate from evidence that circumstances improved.',
 outcomesLabel: 'The change you hope to see', outcomesHelp: 'Describe the change in a decision, process, service, or workplace pattern. Agree any targets and review timing with the people involved; do not invent them.',
 baselineLabel: 'The starting point', baselineHelp: 'What is known before the change? Identify the source and period, or record that a baseline still needs to be established.',
 methodsLabel: 'Numbers and experiences', methodsHelp: 'How will quantitative patterns and people’s accounts inform each other? Identify measures, questions, sources, and ways people can contribute.',
 protectionLabel: 'Differences and privacy', protectionHelp: 'Which differences could be important to examine? Agree denominators, minimum reporting groups, and suppression with the data owner. Avoid identifiable small groups and individual learning or assessment records.',
 limitsLabel: 'What the evidence cannot show', limitsHelp: 'Consider missing perspectives, incomplete data, other explanations, and whether a comparison supports a causal claim. Keep platform use separate from equity outcomes.',
 responsibilityLabel: 'Responsible roles and next decisions', responsibilityHelp: 'Which roles will gather evidence, interpret it with people affected, decide what to change, and share what was learned? Record open decisions rather than assumed commitments.',
 reflectionLabel: 'Return to what you learned', reflectionHelp: 'After reviewing evidence, what changed in your understanding? What would you keep, adjust, or investigate next?',
 indicatorLabel: 'Name and purpose of the proposed measure', indicatorHelp: 'Name one measure and explain the decision it would inform. Identify whether it concerns activity, access, experience or an outcome.',
 calculationLabel: 'How it would be calculated or interpreted', calculationHelp: 'For a count, rate or percentage, specify the numerator, denominator and calculation. For qualitative evidence, explain how accounts would be interpreted. Write not applicable or unknown where appropriate.',
 populationLabel: 'Who or what is included', populationHelp: 'Define the eligible population or process, inclusion and exclusion rules and unit of observation. Leave out personal records.',
 evidenceSourceLabel: 'Evidence source and permission', evidenceSourceHelp: 'Identify the proposed source, the role responsible for it and whether access and use are authorized, pending or unknown. Do not paste the data into this worksheet.',
 periodLabel: 'Period and comparison', periodHelp: 'Specify the observation period, comparison or baseline and proposed review frequency. Record unknown when timing has not been agreed.',
 differencesLabel: 'Differences worth examining', differencesHelp: 'Identify relevant group or service comparisons and why they matter. Plan with the data owner; do not infer an individual’s identity or treat small-group figures as anonymous.',
 reportingLabel: 'Privacy and reporting rules', reportingHelp: 'Identify the review needed for minimum group sizes, suppression, access, retention and reporting. Mark these pending unless the person or area responsible has approved them.',
 actionLabel: 'Who would act on the findings', actionHelp: 'Name responsible roles and a proposed response or further question. Describe how people affected would hear what was learned. Do not invent a target or a commitment.',
 approvalLabel: 'Review and approval still needed', approvalHelp: 'Record proposed, awaiting review or approved with the actual approving role and reference. A completed worksheet does not approve a measure or authorize collection.'
};
export const MEASUREMENT_SURFACE = defineEditableSurface({surfaceId:'practice.measurement',label:'Measurement evaluation worksheet',route:MEASUREMENT_HREF,scopePolicy:'inheritable',fields:Object.keys(copy).map(key=>({key,label:key,kind:'long' as const,required:true})),approvedValues:copy});
export function measurementText(values: Readonly<EditableSurfaceValues>,key:string):string {return typeof values[key]==='string'?values[key] as string:typeof copy[key as keyof typeof copy]==='string'?copy[key as keyof typeof copy]:'';}
export function measurementNotesText(values: Readonly<Record<string,string>>, copy: Readonly<EditableSurfaceValues>, source:{title:string;href:string}): string {
 const sections=[measurementText(copy,'title'),'Working notes'];
 for(const id of MEASUREMENT_FIELD_IDS) if(typeof values[id]==='string' && values[id].trim()) sections.push(measurementText(copy,id+'Label')+'\n'+values[id]);
 sections.push('Resource\n'+source.title+' — '+source.href);return sections.join('\n\n')+'\n';
}
