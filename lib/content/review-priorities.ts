import type {ContentItem} from './types';
export function contentReviewPriorities(items:readonly ContentItem[],today=new Date()) {
 const cutoff=new Date(today);cutoff.setUTCFullYear(cutoff.getUTCFullYear()-1);
 const approved=items.filter(item=>item.status==='approved');
 const priorities=approved.map(item=>{
  const reasons:string[]=[];
  if(!item.owner.trim())reasons.push('Name the person or team responsible for maintenance.');
  const parsed=Date.parse(item.reviewDate);
  const valid=/^\d{4}-\d{2}-\d{2}$/.test(item.reviewDate)&&Number.isFinite(parsed)&&new Date(parsed).toISOString().slice(0,10)===item.reviewDate;
  if(!valid)reasons.push('Confirm the review date.');
  else if(item.reviewDate>today.toISOString().slice(0,10))reasons.push('The recorded review date is in the future; confirm whether it is a planned review.');
  else if(item.reviewDate<cutoff.toISOString().slice(0,10))reasons.push('The recorded review date is more than a year ago; check whether the content needs updating.');
  if(!item.nextActions.length)reasons.push('Consider a useful next step for the reader.');
  if(item.accessibility!=='reviewed')reasons.push('Complete the recorded accessibility review.');
  return {item,reasons};
 }).filter(row=>row.reasons.length);
 const groups=new Map<string,ContentItem[]>();
 for(const item of approved){const body=item.body.join(' ').replace(/\s+/g,' ').trim().toLowerCase();if(body.length<150)continue;const key=item.type+'|'+body;groups.set(key,[...(groups.get(key)??[]),item]);}
 return {total:approved.length,priorities,duplicates:[...groups.values()].filter(group=>group.length>1)};
}
