import { STRUCTURAL_STEPS, type StructuralField, type StructuralStepId } from './content';
import { parseStructuralDraft, structuralChecks, structuralFieldValue, structuralRouteWarning, structuralRows, structuralRowStarted, structuralText, type StructuralDraft } from './draft';

export type StructuralReportBlock =
  | {kind:'title'|'heading'|'text'|'note';text:string}
  | {kind:'table';headers:string[];rows:string[][]};
export function structuralDisplayValue(draft:StructuralDraft,step:StructuralStepId,field:StructuralField):string {
  const value=structuralFieldValue(draft,step,field.k);
  if(field.t==='radio') return (field.opts as [string,string][]).find(([key])=>key===value)?.[1] || 'Not yet entered';
  return (typeof value==='string'?value:value.join(', ')).trim() || 'Not yet entered';
}
/** Shared full-depth content for readable exports. No field or populated table row is dropped. */
export function structuralReportBlocks(input:StructuralDraft):StructuralReportBlock[] {
  const draft=parseStructuralDraft(input);
  const blocks:StructuralReportBlock[]=[
    {kind:'title',text:structuralText(draft,'pattern','process').trim() || 'Structural analysis record'},
    {kind:'text',text:'One DSD People, Access and Culture'},
    {kind:'text',text:`Working review started ${draft.meta.date}. Use for any DHS process, policy or service.`},
    {kind:'note',text:'These entries are a working analysis, not a verified finding or an official decision. A filled form does not establish that the evidence supports a conclusion.'},
    {kind:'text',text:'The Equity and Inclusion Operations Consultant leads the program and provides guidance, knowledge and feedback. The process owner decides and carries out changes.'},
    {kind:'heading',text:'Before sharing'},
    {kind:'text',text:draft.review.privacyChecked?'The person preparing this record marked it as checked for client, case, complaint and personnel details. This is their confirmation; the application has not independently verified the contents.':'Privacy review has not been confirmed. Check the full record for client, case, complaint and personnel details before sharing.'},
    {kind:'text',text:draft.review.ownerConfirmed?'The person preparing this record confirmed that the process owner agreed to the responsibility.':'Agreement from the process owner has not been confirmed.'},
  ];
  const warning=structuralRouteWarning(draft);
  if(warning) blocks.push({kind:'note',text:warning});
  blocks.push({kind:'heading',text:'Review checks'});
  for(const check of structuralChecks(draft)) blocks.push({kind:'text',text:`${check.met?'Recorded':'Not yet confirmed'}: ${check.label}`});
  blocks.push({kind:'note',text:'Unchecked or unanswered evidence remains unknown. These checks record what was entered or confirmed; they do not judge the quality of the analysis.'});
  for(const [index,step] of STRUCTURAL_STEPS.entries()) {
    blocks.push({kind:'heading',text:`${index+1}. ${step.title}`});
    for(const field of step.fields) blocks.push({kind:'text',text:`${field.l}: ${structuralDisplayValue(draft,step.id,field)}`});
    if(step.table) {
      const table=step.table;
      const rows=structuralRows(draft,step.id).filter(structuralRowStarted).map(row=>table.cols.map(col=>row[col.k].trim()||'Not yet entered'));
      blocks.push(rows.length?{kind:'table',headers:table.cols.map(c=>c.l),rows}:{kind:'text',text:step.id==='points'?'No stages entered yet.':'No rules or requirements entered yet.'});
    }
  }
  return blocks;
}
export const escapeStructuralHtml=(value:string):string=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function structuralReportHtml(draft:StructuralDraft):string {
  const blocks=structuralReportBlocks(draft);
  const body=blocks.map(block=>{
    if(block.kind==='table') return `<div class="table-wrap"><table><thead><tr>${block.headers.map(h=>`<th scope="col">${escapeStructuralHtml(h)}</th>`).join('')}</tr></thead><tbody>${block.rows.map(row=>`<tr>${row.map(cell=>`<td>${escapeStructuralHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    const tag=block.kind==='title'?'h1':block.kind==='heading'?'h2':'p';
    return `<${tag}${block.kind==='note'?' class="note"':''}>${escapeStructuralHtml(block.text)}</${tag}>`;
  }).join('\n');
  const title=blocks[0].kind==='title'?blocks[0].text:'Structural analysis record';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escapeStructuralHtml(title)}</title><style>body{font:17px/1.6 system-ui,sans-serif;color:#183149;background:#fff;max-width:1000px;margin:2rem auto;padding:0 1.5rem}h1,h2{line-height:1.25}h1{color:#003865}h2{font-size:1.3rem;margin-top:2.5rem;padding-top:1rem;border-top:1px solid #8394a5}p,td,th{white-space:pre-wrap;overflow-wrap:anywhere}.note{padding:1rem;background:#eef1f4;border-left:4px solid #003865}.table-wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;margin:1.25rem 0;font-size:.95rem}th,td{border:1px solid #8394a5;text-align:left;padding:.65rem;vertical-align:top}th{background:#e7edf3}@media print{body{font-size:11pt;max-width:none;margin:0;padding:0}h2{break-after:avoid}.table-wrap{overflow:visible}thead{display:table-header-group}tr{break-inside:avoid}}</style></head><body><main>${body}</main></body></html>`;
}
/** Plain text for a deliberate handoff to the consultant workspace, never an automatic request. */
export function structuralRecordText(draft:StructuralDraft):string {
  return structuralReportBlocks(draft).map(block=>block.kind==='table'?[
    block.headers.join(' | '),
    ...block.rows.map((row,index)=>`Row ${index+1}: ${row.map((value,col)=>`${block.headers[col]}: ${value}`).join('; ')}`),
  ].join('\n'):block.text).join('\n\n');
}
