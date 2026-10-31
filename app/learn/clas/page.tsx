import { publishedCourses } from '@/lib/content/courses/published';
import { requestedContentScope } from '@/lib/product/request-context';
import { loadStaffContentSnapshot } from '@/lib/content/staff-publications';
import { culturalIntelligenceHubAvailable } from '@/lib/content/cultural-intelligence-publication';
import { ToolDecisionQuestions } from '@/components/tool-decision-questions';
import selfDirected from '@/lib/content/self-directed-data.json';
import readings from '@/lib/content/reading-collection.json';
import './clas-collection.css';
export const dynamic='force-dynamic';
export const metadata={title:'National CLAS Standards — learning and practice'};
const match=(value:unknown)=>/\bCLAS\b|culturally and linguistically appropriate/i.test(JSON.stringify(value));
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}) {
 const q=(await searchParams).q?.trim()||'';
 const includes=(value:unknown)=>!q||JSON.stringify(value).toLowerCase().includes(q.toLowerCase());
 const scope=await requestedContentScope();
 const [published,snapshot,culturalIntelligenceAvailable]=await Promise.all([publishedCourses(scope),loadStaffContentSnapshot({scope}),culturalIntelligenceHubAvailable(scope)]);
 const courses=published.map(row=>row.pack).filter(match);
 const teaching=courses.filter(p=>match(p.course)||match(p.jobAid));
 const references=courses.filter(p=>!teaching.includes(p));
 const resources=snapshot.items.filter(r=>r.status==="approved").filter(match);
 const directed=selfDirected.filter(match);
 const anyMatch=[...courses,...resources,...directed].some(includes);
 function courseList(list:typeof courses){return <div className="clas-list">{list.filter(includes).map(p=><article key={p.course.id}><div><h3><a href={`/courses/${p.course.id}`}>{p.course.title}</a></h3><p>{p.course.subtitle}</p><small>{p.course.lessons.length} lessons · {p.course.duration}</small></div><a className="clas-open" href={`/courses/${p.course.id}`}>Explore course →</a></article>)}</div>}
 return <div className="clas-collection">

 <div className="clas-hero"><p className="clas-eyebrow">LEARNING • COMMUNICATION • SERVICE ACCESS</p><h1>National CLAS Standards</h1><p className="clas-lede">Bring culturally and linguistically appropriate services into everyday practice.</p><p>Explore One DSD’s training, planning tools and references together. Start with the foundations, follow a service encounter, or consider how your team can improve access.</p><nav><a className="text-white" href="#learning">Explore the learning</a><a href="/practice/clas">Prepare a plan</a><a href="#resources">Find a resource</a></nav></div>
 <div className="clas-main"><aside className="clas-note"><strong>A shared reference for thoughtful practice.</strong> CLAS connects respectful communication with workforce preparation, leadership, community participation and improvement. Confirm which standards and separate legal, policy or contract requirements apply to your work.</aside>
 <form className="clas-search" action="/learn/clas"><label htmlFor="q">Find something in this collection</label><div><input id="q" name="q" type="search" defaultValue={q} placeholder="Try interpretation, leadership or language access"/><button>Search</button>{q&&<a href="/learn/clas">Clear</a>}</div></form>
 {q&&!anyMatch?<p role="status" className="clas-note">Nothing in this collection matches “{q}”. Try a different word, or <a href="/learn/clas">see the whole collection</a>.</p>:<><section aria-labelledby="guided-clas"><p className="clas-eyebrow">A CONNECTED LEARNING PATH</p><h2 id="guided-clas">Put the standards into your work</h2><p>Follow nine connected lessons with individual practice and a personal improvement plan. Move at your own pace and use a work example that matters to you.</p><a href="/learn/clas/curriculum">Explore the guided CLAS curriculum →</a></section><ToolDecisionQuestions tool="clas-learn" /><section id="learning"><p className="clas-eyebrow">START HERE</p><h2>Learn the standards, then put them into practice</h2>{courseList(teaching.filter(p=>/National CLAS Standards/i.test(p.course.title)))}<h2 style={{marginTop:36}}>Three ways into CLAS</h2><p>These self-directed courses connect the foundations with service delivery and organizational practice.</p><div className="clas-cards">{directed.filter(includes).map(c=><article key={c.number}><img src={c.cover} alt=""/><div><small>{c.level}</small><h3>{c.title}</h3><p>{c.summary}</p><a href={`/learning/self-directed/index.html?course=${c.number}`}>Open the learning experience →</a></div></article>)}</div></section>
 <section id="resources"><p className="clas-eyebrow">PUT IT TO WORK</p><h2>Planning, checklists and reference material</h2><div className="clas-list"><article><div><h3><a href="/practice/clas">Cultural and language access planning</a></h3><p>Consider the service, relevant standards, changes, review, implementation and results.</p></div><a className="clas-open" href="/practice/clas">Open worksheet →</a></article>{resources.filter(includes).map(r=><article key={r.id}><div><h3><a href={`/library/${r.id}`}>{r.title}</a></h3><p>{r.summary}</p></div><a className="clas-open" href={`/library/${r.id}`}>Read and use →</a></article>)}</div></section>
 <section id="courses"><p className="clas-eyebrow">DEEPEN YOUR PRACTICE</p><h2>Courses that discuss CLAS</h2><p>{teaching.filter(includes).length} courses include CLAS in their teaching or accompanying job aid. Each opens with its existing lessons, activities and available media.</p>{courseList(teaching)}</section>
 <section id="connections"><p className="clas-eyebrow">FOLLOW THE CONNECTIONS</p><h2>Related courses using CLAS as a source</h2><p>These {references.filter(includes).length} courses cite CLAS as a supporting reference. Their focus extends beyond the standards themselves.</p><details><summary>Browse the related courses</summary>{courseList(references)}</details></section></>}
 <section><h2>Connect CLAS with the wider program</h2><p>Follow these connections to see how cultural and language access informs planning, learning and service decisions.</p><ul><li><a href="/program/implementation#goal-6">ADSA communication and accessibility: implementation actions</a></li><li><a href="/learn/equity-in-practice">Equity in practice: CLAS and language-access planning</a></li><li><a href="/learn/equity-toolkit">Equity Analysis Toolkit: plan cultural and language access</a></li>{culturalIntelligenceAvailable && <li><a href="/learn/cultural-intelligence">Explore Cultural Intelligence and community context</a></li>}<li><a href="/one-dsd/programs#people">The division’s work: people, access and culture</a></li><li><a href="/learn/readings/practice/service-notice">Practice activity: improve a service notice</a></li>{readings.filter(r=>match(r)||["reading-200","reading-289"].includes(r.id)).map(r=><li key={r.id}><a href={`/learn/readings/${r.id}`}>{r.title}</a> — reading, reflection and connection to practice</li>)}</ul></section>
 <section><h2>Go to the original standards</h2><p>The HHS Office of Minority Health provides the National CLAS Standards and accompanying guidance.</p><a href="https://thinkculturalhealth.hhs.gov/clas/standards" target="_blank" rel="noreferrer">Read the National CLAS Standards ↗</a><p><a href="/documents/engagement/clas-implementation-checklist.pdf">Open the implementation checklist and action worksheet (PDF)</a></p></section>
</div></div>;
}



