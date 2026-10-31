import { STRUCTURAL_STEPS, type StructuralField, type StructuralStepId } from './content';

export type StructuralValue = string | string[] | Record<string,string>[];
export type StructuralDraft = {
  meta: {date:string;v:1};
  d: Record<StructuralStepId,Record<string,StructuralValue>>;
  review: {privacyChecked:boolean;ownerConfirmed:boolean};
};
export type StructuralCheck = {id:string;label:string;met:boolean};
// Covers every permitted field and both 25-row tables, including JSON escaping
// and multibyte text. Smaller device-storage quotas still fail visibly in the UI.
export const STRUCTURAL_DRAFT_MAX_BYTES = 12_000_000;
export const STRUCTURAL_FIELD_MAX_LENGTH = 6_000;
export const STRUCTURAL_TABLE_MAX_ROWS = 25;
const problem = () => new Error('This file is not a supported structural review. Keep your current work and choose a saved working copy from this tool.');

function object(value:unknown):value is Record<string,unknown> {
  if (value===null || typeof value!=='object' || Array.isArray(value)) return false;
  const proto=Object.getPrototypeOf(value);
  return proto===Object.prototype || proto===null;
}
function keys(value:Record<string,unknown>,required:string[],optional:string[]=[]):boolean {
  const allowed=new Set([...required,...optional]);
  return required.every(key=>Object.hasOwn(value,key)) && Object.keys(value).every(key=>allowed.has(key));
}
export function isStructuralCalendarDate(value:string):boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year,month,day]=value.split('-').map(Number);
  if (year<1 || month<1 || month>12 || day<1 || day>31) return false;
  const date=new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.getUTCFullYear()===year && date.getUTCMonth()===month-1 && date.getUTCDate()===day;
}
function text(value:unknown,max=STRUCTURAL_FIELD_MAX_LENGTH):value is string {
  return typeof value==='string' && value.length<=max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
}
function localDate():string {
  const now=new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
export function freshStructuralDraft():StructuralDraft {
  const d={} as StructuralDraft['d'];
  for(const step of STRUCTURAL_STEPS) {
    const values:Record<string,StructuralValue>={};
    for(const field of step.fields) values[field.k]=field.t==='chips'?[]:'';
    if(step.table) values[step.table.k]=Array.from({length:step.table.start},()=>({...step.table!.blank}));
    d[step.id]=values;
  }
  return {meta:{date:localDate(),v:1},d,review:{privacyChecked:false,ownerConfirmed:false}};
}
function fieldValue(field:StructuralField,value:unknown):string|string[] {
  if(field.t==='chips') {
    const options=field.opts as string[];
    if(!Array.isArray(value) || value.length>options.length || value.some(v=>!text(v)||!options.includes(v)) || new Set(value).size!==value.length) throw problem();
    return [...value];
  }
  if(!text(value)) throw problem();
  if(field.t==='date' && value!=='' && !isStructuralCalendarDate(value)) throw problem();
  if(field.t==='radio' && value!=='' && !(field.opts as [string,string][]).some(([id])=>id===value)) throw problem();
  return value;
}

/** Validates before returning a new object. Original source working copies remain supported. */
export function parseStructuralDraft(value:unknown):StructuralDraft {
  try {
    if(new TextEncoder().encode(JSON.stringify(value)).length>STRUCTURAL_DRAFT_MAX_BYTES) throw problem();
  } catch {throw problem();}
  if(!object(value)||!keys(value,['meta','d'],['review'])) throw problem();
  if(!object(value.meta)||!keys(value.meta,['date','v'])||value.meta.v!==1||!text(value.meta.date,10)||!isStructuralCalendarDate(value.meta.date)) throw problem();
  if(!object(value.d)||!keys(value.d,STRUCTURAL_STEPS.map(s=>s.id))) throw problem();
  const result=freshStructuralDraft();
  result.meta={date:value.meta.date,v:1};
  for(const step of STRUCTURAL_STEPS) {
    const input=value.d[step.id];
    const required=step.fields.filter(f=>!f.optional).map(f=>f.k);
    const optional=step.fields.filter(f=>f.optional).map(f=>f.k);
    if(step.table) required.push(step.table.k);
    if(!object(input)||!keys(input,required,optional)) throw problem();
    for(const field of step.fields) result.d[step.id][field.k]=fieldValue(field,Object.hasOwn(input,field.k)?input[field.k]:field.t==='chips'?[]:'');
    if(step.table) {
      const table=step.table;
      const rows=input[table.k];
      if(!Array.isArray(rows)||rows.length>STRUCTURAL_TABLE_MAX_ROWS) throw problem();
      result.d[step.id][table.k]=rows.map(row=>{
        if(!object(row)||!keys(row,table.cols.map(c=>c.k))) throw problem();
        const clean:Record<string,string>={};
        for(const col of table.cols) {
          const cell=row[col.k];
          if(!text(cell)||col.t==='sel'&&!col.opts?.includes(cell)) throw problem();
          clean[col.k]=cell;
        }
        return clean;
      });
    }
  }
  if(Object.hasOwn(value,'review')) {
    if(!object(value.review)||!keys(value.review,['privacyChecked','ownerConfirmed'])||typeof value.review.privacyChecked!=='boolean'||typeof value.review.ownerConfirmed!=='boolean') throw problem();
    result.review={privacyChecked:value.review.privacyChecked,ownerConfirmed:value.review.ownerConfirmed};
  }
  return result;
}
export function structuralFieldValue(draft:StructuralDraft,step:StructuralStepId,key:string):string|string[] {
  const value=draft.d[step][key];
  return typeof value==='string'?value:Array.isArray(value)&&value.every(v=>typeof v==='string')?value as string[]:'';
}
export function structuralText(draft:StructuralDraft,step:StructuralStepId,key:string):string {
  const value=structuralFieldValue(draft,step,key);
  return typeof value==='string'?value:value.join(', ');
}
export function structuralRows(draft:StructuralDraft,stepId:StructuralStepId):Record<string,string>[] {
  const table=STRUCTURAL_STEPS.find(s=>s.id===stepId)?.table;
  const value=table?draft.d[stepId][table.k]:undefined;
  return Array.isArray(value)&&value.every(v=>typeof v==='object'&&v!==null)?value as Record<string,string>[]:[];
}
export function structuralRowStarted(row:Record<string,string>):boolean {
  return Object.values(row).some(value=>value.trim()!==''&&value!=='Not sure');
}
/** Entries indicate progress only. They do not verify evidence or the quality of an analysis. */
export function structuralProgress(draft:StructuralDraft,stepId:StructuralStepId):'none'|'part'|'done' {
  const step=STRUCTURAL_STEPS.find(s=>s.id===stepId)!;
  const answers=step.fields.filter(f=>!f.optional).map(f=>{
    const value=structuralFieldValue(draft,stepId,f.k);
    return typeof value==='string'?value.trim().length>0:value.length>0;
  });
  if(step.table) answers.push(structuralRows(draft,stepId).some(structuralRowStarted));
  return answers.every(Boolean)?'done':answers.some(Boolean)?'part':'none';
}
export function structuralChecks(draft:StructuralDraft):StructuralCheck[] {
  const filled=(step:StructuralStepId,key:string)=>structuralText(draft,step,key).trim()!=='';
  const checked=(label:string)=>(structuralFieldValue(draft,'evidence','checks') as string[]).includes(label);
  return [
    {id:'pattern',label:'The concern is identified as a recurring pattern',met:structuralText(draft,'pattern','scope')==='pattern'},
    {id:'stage',label:'A stage is chosen for closer review',met:filled('points','hotspot')},
    {id:'changeable',label:'A rule or requirement has a role identified that could change it',met:structuralRows(draft,'fixed').some(r=>r.item.trim()!==''&&r.remake.trim()!=='')},
    {id:'evidence',label:'Evidence describes what is available, what it shows and what remains unknown',met:filled('evidence','have')&&filled('evidence','shows')&&filled('evidence','not')},
    {id:'denominator',label:'You marked the measured group size as stated',met:checked('Denominator stated')},
    {id:'missing',label:'You marked missing data as named',met:checked('Missing data named')},
    {id:'small-groups',label:'You marked small groups as protected',met:checked('Small groups protected')},
    {id:'target',label:'You marked that no target was invented',met:checked('No target invented')},
    {id:'baseline',label:'A baseline and a follow-up measure are recorded',met:filled('evidence','baseline')&&filled('decision','measure')},
    {id:'owner',label:'A role responsible for the change is recorded',met:filled('decision','ownerRole')},
    {id:'review',label:'A valid review date is recorded',met:isStructuralCalendarDate(structuralText(draft,'decision','review'))},
    {id:'reportback',label:'A way to tell staff and communities what happened is recorded',met:filled('decision','reportback')},
    {id:'owner-confirmed',label:'You confirmed the process owner agreed to the responsibility',met:draft.review.ownerConfirmed},
    {id:'privacy',label:'You checked that this record contains no client, case, complaint or personnel details',met:draft.review.privacyChecked},
  ];
}
export function structuralRouteWarning(draft:StructuralDraft):string|null {
  const route=structuralText(draft,'decision','route');
  if(route==='tribal') return 'A Tribal government relationship belongs with the Office of Indian Affairs and the DHS offices responsible for Tribal matters through the appropriate government-to-government process. This record does not replace that process.';
  if(route==='hr'||structuralText(draft,'pattern','scope')==='single') return 'A concern about one person’s conduct belongs in the appropriate confidential HR channel. Keep personnel, client, case and complaint details out of this working record.';
  if(route==='both') return 'Keep only the systemic pattern in this record. Address any individual conduct separately through the appropriate confidential HR channel.';
  if((structuralFieldValue(draft,'pattern','groups') as string[]).includes('Tribal citizens or Native American communities')) return 'Work concerning Tribal Nations or Native American communities requires coordination with the Office of Indian Affairs and the DHS offices responsible for Tribal matters. This tool does not speak for those offices or replace government-to-government relationships.';
  return null;
}
