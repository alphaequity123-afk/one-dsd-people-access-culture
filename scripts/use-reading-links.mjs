import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
let count=0;
for(const file of ['app','components'].flatMap(walk).filter(f=>f.endsWith('.tsx')&&!/\.test\./.test(f)&&!f.endsWith('app-link.tsx')&&!f.replaceAll('\\','/').includes('app/source-reading/'))){
 let source=fs.readFileSync(file,'utf8');
 const tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const replacements=[];let anchor=false;
 function visit(node){
  if(ts.isImportDeclaration(node)&&node.moduleSpecifier.text==='next/link'&&node.importClause?.name)replacements.push([node.moduleSpecifier.getStart(tree),node.moduleSpecifier.end,'"@/components/app-link"']);
  if((ts.isJsxOpeningElement(node)||ts.isJsxClosingElement(node)||ts.isJsxSelfClosingElement(node))&&node.tagName.getText(tree)==='a'){replacements.push([node.tagName.getStart(tree),node.tagName.end,'SourceLink']);anchor=true;}
  ts.forEachChild(node,visit);
 }
 visit(tree);
 if(anchor&&!source.includes('import { SourceLink }')){
  const directive=tree.statements.find(s=>ts.isExpressionStatement(s)&&ts.isStringLiteral(s.expression)&&s.expression.text==='use client');
  replacements.push([directive?.end||0,directive?.end||0,'\nimport { SourceLink } from "@/components/app-link";\n']);
 }
 if(!replacements.length)continue;
 for(const [start,end,text]of replacements.sort((a,b)=>b[0]-a[0]))source=source.slice(0,start)+text+source.slice(end);
 fs.writeFileSync(file,source);count++;
}
console.log(`Updated reading navigation in ${count} components and pages.`);
