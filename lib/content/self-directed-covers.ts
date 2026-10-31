import covers from './self-directed-covers.json';
/** Publish only validated existing image assets; an absent cover keeps the original card. */
export function selfDirectedPresentation(id:string, summary:string){
 const number=id.replace(/^self-directed-/, '');
 const cover=covers.find(c=>c.number===number);
 return cover ? {imageSrc:cover.imageSrc,imageAlt:cover.imageAlt,summary} : undefined;
}
