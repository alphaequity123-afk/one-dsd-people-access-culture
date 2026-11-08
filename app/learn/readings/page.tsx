import type { Metadata } from 'next';
import Link from 'next/link';
import { PageIntro } from '@/components/ui';
import { readings, readingSections, readingHref, searchReadings } from '@/lib/content/reading-collection';
import { RESOURCE_THEMES } from '@/lib/content/resource-organization';
import { catOneLine, catPaginate, catParam } from '@/lib/cat-paging';
import { CatList, CatPager, CatResultStatus, CatRow } from '@/components/cat-list';
import styles from './reading.module.css';
export const metadata: Metadata = { title: 'Books and ideas for your work' };
const PER_PAGE = 20;
const BASE = '/learn/readings';
type Query = { q?: string | string[]; theme?: string | string[]; section?: string | string[]; page?: string | string[] };
export default async function ReadingsPage({searchParams}:{searchParams:Promise<Query>}) {
  const params=await searchParams;
  const q=catParam(params.q);
  const theme=catParam(params.theme);
  const section=catParam(params.section);
  const books=searchReadings(q,theme,section);
  const page=catPaginate(books,catParam(params.page),PER_PAGE);
  const choices={q,theme,section};
  return <div className={styles.page}>
    <div className={styles.body}><Link href="/learn/sources" className={styles.back}>← Books and research</Link></div>
    <PageIntro kicker="Read, reflect and put ideas to work" title="Books and ideas for your work" lede="Find a perspective that helps you understand a situation, ask a better question or try a different approach. Explore at your own pace." />
    <div className={styles.body}>
      <p><Link href="/learn/readings/pathways">Find a reading path for a question in your work →</Link></p>
      <details className="course-more-item">
        <summary>How each reading works and where to start</summary>
        <p className={styles.intro}>Each reading brings together an introduction, key ideas, a fuller summary and questions for reflection or conversation. The authors offer different perspectives; use them alongside the evidence, guidance and people relevant to your work.</p>
        <section className={styles.path}><h2>Start with a question from your work</h2><p>How could a service notice become easier to understand and act on?</p><Link href="/learn/readings/practice/service-notice">Explore an example and try it yourself →</Link></section>
      </details>
      <form className={styles.filters} action={BASE} method="get" role="search" aria-label="Find a reading">
        <label htmlFor="reading-q">Find a reading<input id="reading-q" name="q" defaultValue={q} type="search" placeholder="Title, author or idea" /></label>
        <label htmlFor="reading-theme">Subject<select id="reading-theme" name="theme" defaultValue={theme}><option value="">All subjects</option>{RESOURCE_THEMES.map(t=><option value={t.id} key={t.id}>{t.title}</option>)}</select></label>
        <label htmlFor="reading-section">Reading collection<select id="reading-section" name="section" defaultValue={section}><option value="">All collections</option>{readingSections.map((s,i)=><option value={i+1} key={s}>{s}</option>)}</select></label>
        <button type="submit">Find readings</button><Link href={BASE}>Clear choices</Link>
      </form>
      <CatResultStatus page={page} noun="reading" nouns="readings" of={readings.length} empty={q ? `No readings match “${q}” with those choices.` : 'No readings match those choices.'} />
      {page.items.length ? <CatList label="Readings">{page.items.map(book=><CatRow key={book.id}
        title={<Link href={readingHref(book.id)}>{book.title}</Link>}
        line={book.mainPoints[0] ? catOneLine(book.mainPoints[0]) : undefined}
        meta={`${book.authors} · ${readingSections[book.section-1]}`} />)}</CatList> : <div className={styles.empty}><h2>No readings match those choices</h2><p>Try a shorter phrase or choose a broader subject.</p><Link href={BASE}>Explore all readings</Link></div>}
      <CatPager page={page} basePath={BASE} params={choices} label="Reading result pages" />
    </div>
  </div>;
}
