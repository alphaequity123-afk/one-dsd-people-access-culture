import Link from 'next/link';
import {ownerPageGuard} from '@/lib/auth/owner-page';
import {requestedContentScope} from '@/lib/product/request-context';
import {loadStaffContentSnapshot} from '@/lib/content/staff-publications';
import {publishedCourses,courseContentItem} from '@/lib/content/courses/published';
import {selfDirectedItems,selfDirectedHref} from '@/lib/content/self-directed';
import {contentReviewPriorities} from '@/lib/content/review-priorities';
import type {ContentItem} from '@/lib/content/types';
export const dynamic='force-dynamic';
export const metadata={title:'Keep resources useful'};
const href=(item:ContentItem)=>selfDirectedHref(item.id)??(item.id.startsWith('course-')?'/courses/'+encodeURIComponent(item.id.slice(7)):'/library/'+encodeURIComponent(item.id));
export default async function ContentReview(){
 if(!(await ownerPageGuard()))return null;
 const scope=await requestedContentScope();
 const [snapshot,courses]=await Promise.all([loadStaffContentSnapshot({scope}),publishedCourses(scope)]);
 const items=[...new Map([...snapshot.items,...selfDirectedItems(),...courses.map(({pack})=>courseContentItem(pack,{includeLessonBody:false}))].map(item=>[item.id,item])).values()];
 const report=contentReviewPriorities(items);
 return <article className="wrap max-w-5xl space-y-6 py-8"><Link href="/consultant/library">← Program collection</Link><h1 className="text-3xl font-bold">Keep resources useful</h1><p>Review the current collection for clear responsibility, source dates, accessibility, and useful next steps. These signals help prioritize a review; they do not establish that a resource is inaccurate or no longer needed.</p><p>{report.total} published resources considered. {report.priorities.length} have a review question. {report.duplicates.length} groups have matching text and resource type.</p>
 <section className="space-y-4"><h2 className="text-2xl font-semibold">Resources to check</h2>{report.priorities.length?report.priorities.map(({item,reasons})=><details key={item.id} className="border-b border-line py-3"><summary className="cursor-pointer font-semibold">{item.title}</summary><p>Responsible team or person: {item.owner||'Not recorded'}. Recorded review date: {item.reviewDate||'Not recorded'}.</p><ul className="list-disc pl-6">{reasons.map(reason=><li key={reason}>{reason}</li>)}</ul><Link href={href(item)}>Read this resource</Link></details>):<p>No questions were raised by these checks. Source accuracy and usefulness still require judgment.</p>}</section>
 <section className="space-y-4"><h2 className="text-2xl font-semibold">Possible overlap</h2><p>Compare purpose, audience, sources, and formats before consolidating anything. A transcript, recording, and worksheet may be useful companions. For courses, this check uses the catalog description, not every lesson. Nothing is archived automatically.</p>{report.duplicates.map(group=><ul className="list-disc border-b border-line pb-4 pl-6" key={group[0].id}>{group.map(item=><li key={item.id}><Link href={href(item)}>{item.title}</Link></li>)}</ul>)}</section>
 <section className="space-y-3"><h2 className="text-2xl font-semibold">Before replacing a resource</h2><ol className="list-decimal space-y-2 pl-6"><li>Confirm its current source and who maintains it.</li><li>Compare its purpose with the proposed replacement, including accessibility and alternative formats.</li><li>Identify links and learning activities that still depend on it.</li><li>Record the reason and replacement before changing availability, then check the affected journeys.</li></ol></section>
 <section className="space-y-3"><h2 className="text-2xl font-semibold">Learn from how people use the program</h2><p>Invite someone to try a familiar task: find a resource, prepare a decision, improve a notice, plan participation, or review a result. Notice where they hesitate, what they expected, and whether they reach a useful next step. Summarize themes without recording personal work or sensitive search text.</p><Link href="/program/model#work-examples">Use the five everyday examples</Link></section></article>;
}
