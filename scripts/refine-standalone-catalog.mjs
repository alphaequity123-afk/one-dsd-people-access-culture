import fs from 'node:fs';
const file='public/learning/self-directed/index.html';
let html=fs.readFileSync(file,'utf8');
// The common shell owns the menu on every portable page.
html=html.replace(/const menu=\$\('dsd-menu'\),programNavigation=\$\('dsd-navigation'\);[\s\S]*?(?=function progressOperation)/,'');
if(!html.includes('let catalogPage=')){
  html=html.replace('function catalog(){', 'let catalogPage=1,catalogFilter="";\nfunction catalog(){');
  html=html.replace("$('count').textContent=list.length+' courses available in this selection';", `const filter=[level,policy,q].join('|');if(filter!==catalogFilter){catalogPage=1;catalogFilter=filter;}const pages=Math.max(1,Math.ceil(list.length/8));catalogPage=Math.min(catalogPage,pages);const first=(catalogPage-1)*8;const visible=list.slice(first,first+8);$('count').textContent=list.length?(first+1)+'–'+(first+visible.length)+' of '+list.length+' courses':'No courses match this search. Try another subject.';let pager=$('catalog-pages');if(!pager){pager=document.createElement('nav');pager.id='catalog-pages';pager.className='standalone-topic-pager';pager.setAttribute('aria-label','Course pages');$('catalog').after(pager);}pager.replaceChildren();for(const [label,change] of [['Previous',-1],['Next',1]]){const button=document.createElement('button');button.type='button';button.textContent=label;button.disabled=change<0?catalogPage===1:catalogPage===pages;button.addEventListener('click',()=>{catalogPage+=change;catalog();$('catalog').scrollIntoView({block:'start'});pager.querySelector('button:not(:disabled)')?.focus({preventScroll:true});});pager.append(button);}pager.hidden=pages<=1;`);
  html=html.replace("$('catalog').replaceChildren();for(const c of list){", "$('catalog').replaceChildren();for(const c of visible){");
}
fs.writeFileSync(file,html);
console.log('Self-directed catalog shows eight courses per page; every course remains selectable.');
