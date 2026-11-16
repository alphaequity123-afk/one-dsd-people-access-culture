import type { Metadata } from 'next';
import Link from "@/components/app-link";
import { PageIntro } from '@/components/ui';
import { readings, readingSections, readingHref } from '@/lib/content/reading-collection';
import { RESOURCE_THEMES } from '@/lib/content/resource-organization';
import { catOneLine, catParam } from '@/lib/cat-paging';
import { CatRow } from '@/components/cat-list';
import { PrivateCatalogForm, PrivateCatalogProvider, PrivateCatalogResults, type CatalogRow } from '@/components/private-catalog';
import styles from './reading.module.css';
export const metadata: Metadata = { title: 'Books and ideas for your work' };
const PER_PAGE = 12;
const BASE = '/learn/readings';
type Query = { q?: string | string[]; theme?: string | string[]; section?: string | string[]; page?: string | string[] };
export default async function ReadingsPage({searchParams}:{searchParams:Promise<Query>}) {
  const params=await searchParams;
  const q=catParam(params.q);
  const theme=catParam(params.theme);
  const section=catParam(params.section);
  // Every reading is drawn once. The words typed go to /api/catalog-search in a request body, never into the
  // address; the subject and collection lists narrow the rows in the page.
  const rows:CatalogRow[]=readings.map(book=>({
    key:book.id,
    values:{theme:book.themes,section:String(book.section)},
    node:<CatRow key={book.id}
      title={<Link href={readingHref(book.id)}>{book.title}</Link>}
      line={book.mainPoints[0] ? catOneLine(book.mainPoints[0]) : undefined}
      meta={`${book.authors} · ${readingSections[book.section-1]}`} />,
  }));
  const choices={
    theme:RESOURCE_THEMES.some(t=>t.id===theme)?theme:'',
    section:readingSections.some((_,i)=>String(i+1)===section)?section:'',
  };
  return <div className={styles.page}>
    <div className={styles.body}><Link href="/learn/sources" className={styles.back}>Books and research</Link></div>
    <PageIntro kicker="Read, reflect and put ideas to work" title="Books and ideas for your work" lede="Find a perspective that helps you understand a situation, ask a better question or try a different approach. Explore at your own pace." />
    <div className={styles.body}>
      <p><Link href="/learn/readings/pathways">Find a reading path for a question in your work</Link></p>
      <details className="course-more-item">
        <summary>How each reading works and where to start</summary>
        <p className={styles.intro}>Each reading brings together an introduction, key ideas, a fuller summary and questions for reflection or conversation. The authors offer different perspectives; use them alongside the evidence, guidance and people relevant to your work.</p>
        <section className={styles.path}><h2>Start with a question from your work</h2><p>How could a service notice become easier to understand and act on?</p><Link href="/learn/readings/practice/service-notice">Explore an example and try it yourself</Link></section>
      </details>
      <PrivateCatalogProvider key={`${choices.theme}|${choices.section}`} basePath={BASE} rows={rows} choices={choices} perPage={PER_PAGE} initial={{q,page:catParam(params.page)}} endpoint="readings"
        lists={[
          {name:'theme',label:'Subject',allLabel:'All subjects',options:RESOURCE_THEMES.map(t=>({value:t.id,label:t.title}))},
          {name:'section',label:'Reading collection',allLabel:'All collections',options:readingSections.map((s,i)=>({value:String(i+1),label:s}))},
        ]}>
        <PrivateCatalogForm className={styles.filters} ariaLabel="Find a reading" searchLabel="Find a reading" inputId="reading-q" placeholder="Title, author or idea" buttonLabel="Find readings" clearLabel="Clear choices" alwaysShowClear />
        <PrivateCatalogResults noun="reading" nouns="readings" of={readings.length} empty="No readings match those choices." emptyWithWords="No readings match “{words}” with those choices." listLabel="Readings" pagerLabel="Reading result pages"
          emptyBlock={{className:styles.empty,title:'No readings match those choices',body:'Try a shorter phrase or choose a broader subject.',resetLabel:'Explore all readings'}} />
      </PrivateCatalogProvider>
    </div>
  </div>;
}
