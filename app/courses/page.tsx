import type { Metadata } from "next";
import Link from "@/components/app-link";
import { CourseFinder } from "@/components/course-finder";
import { PageIntro } from "@/components/ui";
import { courseHref, courseSummary, publishedCourses } from "@/lib/content/courses/published";
import { requestedContentScope } from "@/lib/product/request-context";
import { TRAINING_CREDIT_NOTICE } from "@/lib/program/learning-credit";
import {SELF_DIRECTED_COURSES,selfDirectedHref} from "@/lib/content/self-directed";
export const metadata: Metadata = {title:"Courses"};
export const dynamic="force-dynamic";
export default async function CoursesPage({searchParams}:{searchParams?:Promise<{browse?:string;q?:string;level?:string;page?:string}>}){
 const params=await searchParams||{};const scope=await requestedContentScope();const native=await publishedCourses(scope);
 const all=[...native.map(({pack})=>({id:pack.course.id,title:pack.course.title,summary:courseSummary(pack),href:courseHref(pack.course.id),level:/advanced/i.test(pack.course.seriesLabel||'')?'Advanced':/intermediate/i.test(pack.course.seriesLabel||'')?'Intermediate':/foundation/i.test(pack.course.seriesLabel||'')?'Foundation':'',detail:pack.course.duration+' · '+pack.course.lessons.length+' lessons',series:pack.course.seriesLabel||''})),...SELF_DIRECTED_COURSES.map(course=>({id:'self-directed-'+course.number,title:course.title,summary:course.summary,href:selfDirectedHref('self-directed-'+course.number)!,level:course.level,detail:course.audience+' · Editable PowerPoint',series:'Self-directed learning'}))];
 const q=(params.q||'').trim().slice(0,200);const level=['Foundation','Intermediate','Advanced'].includes(params.level||'')?params.level||'':'';
 return <div><PageIntro kicker="Learning and resources" title="Courses" lede="Courses organized by subject and by level, each built around situations you will recognize from your work. Study at your own pace."/><div className="wrap max-w-5xl space-y-8 py-10"><p><Link href="/learn">Learn</Link></p><section aria-labelledby="emotions-values-title"><h2 id="emotions-values-title">Emotions, Values, and Everyday Practice</h2><p>Explore two emotional-intelligence courses and two cultural-values courses, with situations, practice, and feedback.</p><p><Link href="/learn/emotions-and-values">Explore the four-course series</Link></p></section><section aria-labelledby="self-directed-series-title"><h2 id="self-directed-series-title">One DSD Self-Directed Learning Series</h2><p>Explore courses with service and workplace situations, reflection, and practice with feedback.</p><p><Link href="/learn/self-directed">Explore the full learning series</Link> · <Link href="/learn/self-directed?curriculum=policy">Equity in Policy and Legislative Practice</Link></p></section><CourseFinder all={all} initial={{q,level,browse:params.browse==='all',page:Number.parseInt(params.page||'1',10)||1}}/><p className="text-sm">{TRAINING_CREDIT_NOTICE}</p></div></div>;
}
