
import { SourceLink } from "@/components/app-link";
import Link from "@/components/app-link";
import { publishedCourses } from '@/lib/content/courses/published';
import { requestedContentScope } from '@/lib/product/request-context';
import { loadStaffContentSnapshot } from '@/lib/content/staff-publications';
import { culturalIntelligenceHubAvailable } from '@/lib/content/cultural-intelligence-publication';
import { ToolDecisionQuestions } from '@/components/tool-decision-questions';
import { Hub2Choices, Hub2More } from '@/components/hub2-choices';
import selfDirected from '@/lib/content/self-directed-data.json';
import readings from '@/lib/content/reading-collection.json';
import './clas-collection.css';
export const dynamic='force-dynamic';
export const metadata={title:'National Culturally and Linguistically Appropriate Services Standards — learning and practice'};
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
 function courseList(list:typeof courses){return <div className="clas-list">{list.filter(includes).map(p=><article key={p.course.id}><div><h3><SourceLink href={`/courses/${p.course.id}`}>{p.course.title}</SourceLink></h3><p>{p.course.subtitle}</p><small>{p.course.lessons.length} lessons · {p.course.duration}</small></div><SourceLink className="clas-open" href={`/courses/${p.course.id}`}>Explore course</SourceLink></article>)}</div>}
 return <div className="clas-collection">

 <div className="clas-hero"><p className="clas-eyebrow">LEARNING • COMMUNICATION • SERVICE ACCESS</p><h1>National Culturally and Linguistically Appropriate Services Standards</h1><p className="clas-lede">Bring culturally and linguistically appropriate services into everyday practice.</p><p>Explore One DSD’s training, planning tools and references together. Start with the foundations, follow a service encounter, or consider how your team can improve access.</p><nav><SourceLink className="text-white" href="#learning">Explore the learning</SourceLink><Link prefetch={false} href="/practice/clas">Prepare a plan</Link><SourceLink href="#resources">Find a resource</SourceLink></nav></div>
 <div className="clas-main"><aside className="clas-note"><strong>A shared reference for thoughtful practice.</strong> Culturally and Linguistically Appropriate Services connects respectful communication with workforce preparation, leadership, community participation and improvement. Confirm which standards and separate legal, policy or contract requirements apply to your work.</aside>
 <form className="clas-search" action="/learn/clas"><label htmlFor="q">Find something in this collection</label><div><input id="q" name="q" type="search" defaultValue={q} placeholder="Try interpretation, leadership or language access"/><button>Search</button>{q&&<Link prefetch={false} href="/learn/clas">Clear</Link>}</div></form>
 <Hub2Choices label="Where to begin" className="lg:grid-cols-3" choices={[
  {href:"/learn/clas/curriculum",title:"Learn the standards",body:"Nine connected lessons with practice and a personal improvement plan, at your own pace.",action:"Start the lessons"},
  {href:"/practice/clas",title:"Prepare a plan",body:"A worksheet for planning cultural and language access for a service your team provides.",action:"Open the worksheet"},
  {href:"#resources",title:"Find a reference",body:"Checklists, reference material, related courses and the original standards.",action:"See the references"},
 ]}/>
 {q&&!anyMatch?<p role="status" className="clas-note">Nothing in this collection matches “{q}”. Try a different word, or <Link prefetch={false} href="/learn/clas">see the whole collection</Link>.</p>:<div>
 <Hub2More id="guided" headingId="guided-clas" title="Put the standards into your work"><p className="clas-eyebrow">A CONNECTED LEARNING PATH</p><p>Follow nine connected lessons with individual practice and a personal improvement plan. Move at your own pace and use a work example that matters to you.</p><Link prefetch={false} href="/learn/clas/curriculum">Explore the guided CLAS curriculum</Link><p><Link prefetch={false} href="/learn/clas/collection">Share the nine-part curriculum collection</Link></p><ToolDecisionQuestions tool="clas-learn" /></Hub2More>
 <Hub2More id="learning" title="Learn the standards, then put them into practice" open={Boolean(q)}><p className="clas-eyebrow">START HERE</p>{courseList(teaching.filter(p=>/National Culturally and Linguistically Appropriate Services Standards/i.test(p.course.title)))}<h3 style={{marginTop:36}}>Three ways into Culturally and Linguistically Appropriate Services</h3><p>These self-directed courses connect the foundations with service delivery and organizational practice.</p><div className="clas-cards">{directed.filter(includes).map(c=><article key={c.number}><img src={c.cover} alt=""/><div><small>{c.level}</small><h3>{c.title}</h3><p>{c.summary}</p><SourceLink href={`/learning/self-directed/index.html?course=${c.number}`}>Open the learning experience</SourceLink></div></article>)}</div></Hub2More>
 <Hub2More id="resources" title="Planning, checklists and reference material" open={Boolean(q)}><p className="clas-eyebrow">PUT IT TO WORK</p><div className="clas-list"><article><div><h3><Link prefetch={false} href="/practice/clas">Cultural and language access planning</Link></h3><p>Consider the service, relevant standards, changes, review, implementation and results.</p></div><Link prefetch={false} className="clas-open" href="/practice/clas">Open worksheet</Link></article>{resources.filter(includes).map(r=><article key={r.id}><div><h3><SourceLink href={`/library/${r.id}`}>{r.title}</SourceLink></h3><p>{r.summary}</p></div><SourceLink className="clas-open" href={`/library/${r.id}`}>Read and use</SourceLink></article>)}</div></Hub2More>
 <Hub2More id="courses" title="Courses that discuss Culturally and Linguistically Appropriate Services" open={Boolean(q)}><p className="clas-eyebrow">DEEPEN YOUR PRACTICE</p><p>{teaching.filter(includes).length} courses include CLAS in their teaching or accompanying job aid. Each opens with its existing lessons, activities and available media.</p>{courseList(teaching)}</Hub2More>
 <Hub2More id="connections" title="Related courses using CLAS as a source" open={Boolean(q)}><p className="clas-eyebrow">FOLLOW THE CONNECTIONS</p><p>These {references.filter(includes).length} courses cite CLAS as a supporting reference. Their focus extends beyond the standards themselves.</p>{courseList(references)}</Hub2More></div>}
 <div>
 <Hub2More id="wider-program" title="Connect CLAS with the wider program"><p>Follow these connections to see how cultural and language access informs planning, learning and service decisions.</p><ul><li><Link prefetch={false} href="/program/implementation#goal-6">ADSA communication and accessibility: implementation actions</Link></li><li><Link prefetch={false} href="/learn/equity-in-practice">Equity in practice: CLAS and language-access planning</Link></li><li><Link prefetch={false} href="/learn/equity-toolkit">Equity Analysis Toolkit: plan cultural and language access</Link></li>{culturalIntelligenceAvailable && <li><Link prefetch={false} href="/learn/cultural-intelligence">Explore Cultural Intelligence and community context</Link></li>}<li><Link prefetch={false} href="/one-dsd/programs#people">The division’s work: people, access and culture</Link></li><li><Link prefetch={false} href="/learn/readings/practice/service-notice">Practice activity: improve a service notice</Link></li>{readings.filter(r=>match(r)||["reading-200","reading-289"].includes(r.id)).map(r=><li key={r.id}><SourceLink href={`/learn/readings/${r.id}`}>{r.title}</SourceLink> — reading, reflection and connection to practice</li>)}</ul></Hub2More>
 <Hub2More id="standards" title="Go to the original standards"><p>The HHS Office of Minority Health provides the National Culturally and Linguistically Appropriate Services Standards and accompanying guidance.</p><SourceLink href="https://thinkculturalhealth.hhs.gov/clas/standards" target="_blank" rel="noreferrer">Read the National Culturally and Linguistically Appropriate Services Standards</SourceLink><p><SourceLink href="/documents/engagement/clas-implementation-checklist.pdf">Open the implementation checklist and action worksheet (PDF)</SourceLink></p></Hub2More>
 </div>
</div></div>;
}
