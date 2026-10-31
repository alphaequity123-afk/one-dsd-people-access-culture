import { structuralReportBlocks } from './report';
import type { StructuralDraft } from './draft';

/** A readable Word report prepared in the browser without uploading this record. */
export async function structuralWordBlob(draft:StructuralDraft):Promise<Blob> {
  const {Document,Paragraph,TextRun,Packer,HeadingLevel,Table,TableRow,TableCell,WidthType}=await import('docx');
  const blocks=structuralReportBlocks(draft);
  const paragraph=(text:string,bold=false)=>new Paragraph({children:text.split('\n').flatMap((line,index)=>[new TextRun({text:line,bold,...(index?{break:1}:{})})]),spacing:{after:160}});
  const children=blocks.map(block=>{
    if(block.kind==='table') return new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({tableHeader:true,children:block.headers.map(text=>new TableCell({shading:{fill:'E7EDF3'},children:[paragraph(text,true)]}))}),
      ...block.rows.map(row=>new TableRow({children:row.map(text=>new TableCell({children:[paragraph(text)]}))})),
    ]});
    if(block.kind==='title'||block.kind==='heading') return new Paragraph({text:block.text,heading:block.kind==='title'?HeadingLevel.TITLE:HeadingLevel.HEADING_1,spacing:{before:block.kind==='heading'?320:0,after:200},keepNext:true});
    return paragraph(block.text,block.kind==='note');
  });
  const title=blocks[0].kind==='title'?blocks[0].text:'Structural analysis record';
  return Packer.toBlob(new Document({creator:'One DSD People, Access and Culture',title,styles:{default:{document:{run:{font:'Calibri',size:23,color:'183149'},paragraph:{spacing:{line:300}}}}},sections:[{properties:{page:{margin:{top:1000,bottom:1000,left:900,right:900}}},children}]}));
}
