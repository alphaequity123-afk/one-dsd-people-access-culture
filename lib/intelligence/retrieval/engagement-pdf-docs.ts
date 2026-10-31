import type { ContentItem } from '@/lib/content/types';
import type { Doc } from './search';
import pages from './engagement-pdf-pages.json';

/** Only index originals whose resource remains in the current approved publication. */
export function engagementPdfDocs(items: ContentItem[]): Doc[] {
  const visible=new Map(items.filter(item=>item.status==='approved').map(item=>[item.id,item]));
  return pages.flatMap(page=>{
    const resource=visible.get(page.resourceId);
    const href=resource?.nextActions.find(action=>action.href.startsWith('/documents/engagement/'))?.href;
    if(!resource || !href)return [];
    return [{kind:'content' as const,id:`${resource.id}-pdf-page-${page.page}`,title:`${resource.title} — PDF page ${page.page}`,
      href:`${href}#page=${page.page}`,authority:resource.authority,type:resource.type,layer:resource.layer,
      status:resource.status,reviewDate:resource.reviewDate,scope:resource.scope,summary:page.text.slice(0,250),text:page.text,
      tags:resource.tags,intents:resource.intents}];
  });
}
