export type GoalPlanSection = { heading: string; entries: { label: string; text: string }[] };
export type GoalPlanReport = { title: string; notes: string[]; sections: GoalPlanSection[] };

export function goalPlanText(report: GoalPlanReport): string {
  return [report.title, ...report.notes, ...report.sections.flatMap(section => [section.heading, ...section.entries.map(entry => `${entry.label}\n${entry.text}`)])].join('\n\n') + '\n';
}

export function goalPlanHtml(report: GoalPlanReport): string {
  const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(report.title)}</title><style>body{font:17px/1.6 Arial,sans-serif;color:#182f41;max-width:850px;margin:32px auto;padding:24px}h1,h2,h3{color:#173d59;line-height:1.3}h2{margin-top:32px}h3{font-size:18px;margin-bottom:6px}p{white-space:pre-wrap;overflow-wrap:anywhere}h1,h2,h3{break-after:avoid}@media print{body{margin:0;padding:0;font-size:11pt}@page{margin:20mm}}</style></head><body><h1>${escape(report.title)}</h1>${report.notes.map(note => `<p>${escape(note)}</p>`).join('')}${report.sections.map(section => `<section><h2>${escape(section.heading)}</h2>${section.entries.map(entry => `<h3>${escape(entry.label)}</h3><p>${escape(entry.text)}</p>`).join('')}</section>`).join('')}</body></html>`;
}

/** Creates a real editable Word file locally; no document upload or Office installation. */
export async function goalPlanWord(report: GoalPlanReport): Promise<Blob> {
  const {Document, Paragraph, TextRun, Packer, HeadingLevel}=await import('docx');
  const paragraph=(text:string)=>new Paragraph({children:text.split('\n').map((line,index)=>new TextRun({text:line,...(index?{break:1}:{})})),spacing:{after:160}});
  return Packer.toBlob(new Document({title:report.title,subject:"Private working plan",creator:'One DSD People, Access and Culture',styles:{default:{document:{run:{font:'Arial',size:22,color:'182F41',language:{value:'en-US'}}}}},sections:[{children:[new Paragraph({text:report.title,heading:HeadingLevel.TITLE}),...report.notes.map(paragraph),...report.sections.flatMap(section=>[new Paragraph({text:section.heading,heading:HeadingLevel.HEADING_1,keepNext:true}),...section.entries.flatMap(entry=>[new Paragraph({text:entry.label,heading:HeadingLevel.HEADING_2,keepNext:true}),paragraph(entry.text)])])]}]}));
}
