'use client';
import { useState } from 'react';
import { MeasurementEvidenceExample } from '@/components/multimedia/measurement-evidence-example';
import type { EditableSurfaceValues } from '@/lib/content/editable-surface-contract';
import { MEASUREMENT_PLAN_FIELD_IDS, INDICATOR_FIELD_IDS, measurementText, measurementNotesText } from '@/lib/content/measurement-practice';
const fictionalExample: Record<string, string> = {
 need: 'Can people identify the next step in a revised program notice? Invite readers with different language and access needs to help define clarity.',
 activities: 'Revise the notice, review accessibility and translations, and invite readers to find the next action and share feedback in more than one way.',
 outputs: 'A revised notice, a record of reader feedback, and a summary of proposed changes.',
 outcomes: 'More readers can identify and explain the next action. Agree on a target and review date with participants.',
 baseline: 'Fictional example: 60 of 100 readers found the next action in the earlier notice. Verify the source, period, and comparison conditions.',
 methods: 'Compare the number and proportion identifying the action with readers’ accounts of what was clear or confusing. Document recruitment and reading conditions.',
 protection: 'Agree on denominators, minimum reporting groups, and suppression with the data owner. Avoid identifying people in small groups.',
 limits: 'Different groups and conditions may explain the result. Some perspectives may be missing; this comparison alone does not prove causation.',
 responsibility: 'Program staff prepare the notice; researchers organize the review; participants interpret findings with the team; the program manager decides next steps.',
 reflection: 'If readers still struggle with the deadline or contact information, revise those sections and test again before broader use.',
 indicator: 'Outcome: the proportion of readers who can identify the next action in the notice.',
 calculation: 'Divide the number of participating readers who identify the action by the total number who attempted the task, then multiply by 100.',
 population: 'Readers invited to review each version; document recruitment, inclusion rules, and the number participating.',
 evidenceSource: 'Proposed source: a structured notice review and participant feedback. Permission and access are pending review by the responsible program and data owners.',
 period: 'Compare the earlier and revised notices over a review period to be agreed; confirm whether conditions are comparable.',
 differences: 'Consider language and accessibility needs where relevant and appropriate; agree on comparisons with the data owner.',
 reporting: 'Minimum group size, suppression, access, retention, and reporting rules are pending data-owner review.',
 action: 'The program manager would review findings with participants and research staff, then decide whether to revise and retest.',
 approval: 'Proposed measure; data collection, privacy safeguards, and any target require review and approval by the responsible roles.'
};
export function MeasurementWorksheet({copy,source}:{copy:Readonly<EditableSurfaceValues>;source:{title:string;href:string}}){
 const [values,setValues]=useState<Record<string,string>>({});const [notice,setNotice]=useState('');const [manual,setManual]=useState(false);
 const text=measurementNotesText(values,copy,source);
 async function copyNotes(){try{await navigator.clipboard.writeText(text);setNotice(measurementText(copy,'copied'));setManual(false)}catch{setNotice(measurementText(copy,'manual'));setManual(true)}}
 function downloadNotes(){let url:string|undefined;try{url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='equity-evaluation-working-notes.txt';document.body.appendChild(link);link.click();link.remove();setNotice(measurementText(copy,'downloadReady'));}catch{setNotice(measurementText(copy,'manual'));setManual(true)}finally{if(url){const pending=url;setTimeout(()=>URL.revokeObjectURL(pending),1000)}}}
 return <><MeasurementEvidenceExample /><section aria-labelledby="measurement-notes-title" className="space-y-6"><h2 id="measurement-notes-title" className="text-2xl font-bold">{measurementText(copy,'notesTitle')}</h2><p className="notice" id="measurement-note-privacy">{measurementText(copy,'privacy')}</p>
 <div className="rounded-lg border border-line p-4"><p>Explore a fictional example about making a program notice easier to understand. Your existing notes will stay in place; the example fills empty fields only.</p><button type="button" className="btn btn--light mt-3" onClick={() => { setValues(current => { const next = { ...current }; for (const [key, value] of Object.entries(fictionalExample)) if (!current[key]?.trim()) next[key] = value; return next; }); setNotice('Fictional example added to empty fields. You can edit the answers.'); setManual(false); }}>Load fictional example</button></div>
 {MEASUREMENT_PLAN_FIELD_IDS.map(id=><div key={id} className="space-y-2"><label htmlFor={'measurement-'+id} className="block text-lg font-bold">{measurementText(copy,id+'Label')}</label><p id={'measurement-'+id+'-help'} className="text-muted">{measurementText(copy,id+'Help')}</p><textarea id={'measurement-'+id} aria-describedby={'measurement-'+id+'-help measurement-note-privacy'} rows={4} className="w-full rounded-lg border border-line p-3" value={values[id]??''} onChange={event=>setValues(current=>({...current,[id]:event.target.value}))}/></div>)}
 <details className="rounded-lg border border-line p-5"><summary className="cursor-pointer text-lg font-bold">Define a proposed measure</summary><p className="my-4">Use this when you need a precise measure for review. You can leave unknowns explicit; this does not authorize collecting data.</p><div className="space-y-6">{INDICATOR_FIELD_IDS.map(id=><div key={id} className="space-y-2"><label htmlFor={'measurement-'+id} className="block font-bold">{measurementText(copy,id+'Label')}</label><p id={'measurement-'+id+'-help'} className="text-muted">{measurementText(copy,id+'Help')}</p><textarea id={'measurement-'+id} aria-describedby={'measurement-'+id+'-help measurement-note-privacy'} rows={3} className="w-full rounded-lg border border-line p-3" value={values[id]??''} onChange={event=>setValues(current=>({...current,[id]:event.target.value}))}/></div>)}</div></details>
 <div className="flex flex-wrap gap-3"><button type="button" className="btn btn--primary" onClick={copyNotes}>{measurementText(copy,'copyLabel')}</button><button type="button" className="btn btn--light" onClick={downloadNotes}>{measurementText(copy,'downloadLabel')}</button></div><p role="status">{notice}</p>
 {manual?<label className="block">{measurementText(copy,'manualLabel')}<textarea className="mt-2 w-full rounded-lg border border-line p-3" readOnly rows={14} value={text} onFocus={event=>event.target.select()}/></label>:null}</section></>;
}
