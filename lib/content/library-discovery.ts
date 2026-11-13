/** Library-only vocabulary; does not broaden the evidence used by automated analysis. */
const terms = [
  ['cfss', 'community first services and supports'],
  ['hcbs', 'home and community based services'],
  ['clas', 'culturally and linguistically appropriate services'],
  ['adsa', 'aging and disability services administration'],
  ['cdcs', 'consumer directed community supports'],
  ['eidbi', 'early intensive developmental and behavioral intervention'],
] as const;

export function expandedLibraryQuery(query:string):string {
  const normalized=query.toLowerCase().replace(/[-–—]/g,' ').replace(/\s+/g,' ').trim();
  const added=terms.flatMap(([short,long])=>new RegExp(`\\b${short}\\b`).test(normalized)?[long]:normalized.includes(long)?[short]:[]);
  return [query,...added].join(' ').trim();
}
export function matchesExpandedLibraryQuery(query:string,text:string):boolean {
  const normalize=(value:string)=>value.toLowerCase().replace(/[-–—]/g,' ').replace(/\s+/g,' ').trim();
  const q=normalize(query), body=normalize(text);
  return terms.some(([short,long])=>(new RegExp(`\\b${short}\\b`).test(q)&&body.includes(long))||(q.includes(long)&&new RegExp(`\\b${short}\\b`).test(body)));
}
export function libraryPage(total:number, raw:unknown) {
  const size=12;
  const pages=Math.max(1,Math.ceil(total/size));
  const requested=typeof raw==='string'&&/^\d{1,6}$/.test(raw)?Number(raw):1;
  const page=Math.min(pages,Math.max(1,requested));
  return {page,pages,start:(page-1)*size,end:Math.min(total,page*size)};
}
export type DiscoveryLink={href:string;label:string;reason:string};
export function libraryDestinations(query:string):DiscoveryLink[] {
  const q=query.toLowerCase();
  const links:DiscoveryLink[]=[];
  if (/\b(cfss|hcbs|cdcs|eidbi|mnchoices|waiver|waivers|disability hub|home care|guardianship)\b/.test(q)||/community first services/.test(q)) links.push({href:'/one-dsd/programs',label:'DSD programs and services',reason:'Find program context, equity questions, and links to official sources.'});
  if (/\b(clas|language access|interpreter|interpreters|translation)\b/.test(q)||/culturally and linguistically/.test(q)) links.push({href:'/practice/clas',label:'Plan cultural and language access',reason:'Use the standards alongside a practical planning worksheet.'});
  if (/\b(toolkit|equity analysis|policy review|legislative)\b/.test(q)) links.push({href:'/learn/equity-toolkit',label:'DHS Equity Analysis Toolkit',reason:'Find the original source, training, and a worked example together.'});
  if (/\b(adsa|outcome map|implementation goals)\b/.test(q)) links.push({href:'/learn/equity-in-practice',label:'Connect the Outcome Map with practice',reason:'Watch the foundation and DSD examples, then explore related tools.'});
  return links;
}
