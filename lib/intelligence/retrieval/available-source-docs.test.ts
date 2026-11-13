import { expect, it, vi } from 'vitest';
import type { Doc } from './search';
vi.mock('@/lib/content/external-readings', () => ({
  externalReadingHref: (url:string) => url === 'https://example.org/local-copy' ? '/source-reading/approved' : undefined,
  externalSourceHref: (url:string) => url.endsWith('/missing') || url.endsWith('/local-copy') ? undefined : url.endsWith('/moved') ? 'https://example.org/current' : url,
}));
import { availableSourceDocs } from './available-source-docs';
const reference:Doc = {id:'ref',kind:'content',title:'External reference',href:'https://example.org/moved',authority:'external_verify',type:'external_reference',status:'published',reviewDate:'2026-11-13',scope:'public',summary:'A directory summary.',text:'A directory summary.',tags:[],intents:[]};
it('uses verified destinations without changing source identity or evidence depth',()=>{
 const docs=availableSourceDocs([reference,{...reference,id:'removed',href:'https://example.org/missing'},{...reference,id:'copy',href:'https://example.org/local-copy'}]);
 expect(docs.map(doc=>doc.href)).toEqual(['https://example.org/current','/source-reading/approved']);
 expect(docs[0]).toMatchObject({id:reference.id,type:'external_reference',text:reference.text,graphLinks:[reference.href]});
 expect(availableSourceDocs([reference])[0]).toBe(docs[0]);
 expect(availableSourceDocs(docs)).toEqual(docs);
});
