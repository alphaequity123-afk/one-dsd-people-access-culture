import {parseDocument} from 'htmlparser2';
import {findAll,getOuterHTML} from 'domutils';

/** @param {string} html @param {(href: string) => string | undefined} resolveHref */
export function rewriteSourceReadingLinks(html, resolveHref) {
  const document=parseDocument(html);let changed=false;
  for(const link of findAll(node=>node.name==='a' && /^https?:\/\//.test(node.attribs.href || ''),document.children)){
    const original=link.attribs.href,destination=resolveHref(original);
    if(!destination){
      link.name='span';delete link.attribs.href;delete link.attribs.target;delete link.attribs.rel;changed=true;
    }else if(destination!==original){link.attribs.href=destination;changed=true;}
  }
  return changed ? getOuterHTML(document) : html;
}
