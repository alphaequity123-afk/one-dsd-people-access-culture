import type { Metadata } from 'next';
import Link from 'next/link';
import { PageIntro } from '@/components/ui';
import { readings, readingSections, readingHref, searchReadings } from '@/lib/content/reading-collection';
import { RESOURCE_THEMES } from '@/lib/content/resource-organization';
import styles from './reading.module.css';
export const metadata: Metadata = { title: 'Books and ideas for your work' };
export default async function ReadingsPage({searchParams}:{searchParams:Promise<{q?:string;theme?:string;section?:string}>}) {
  const params=await searchParams;
  const q=typeof params.q==='string'?params.q:'';
  const theme=typeof params.theme==='string'?params.theme:'';
  const section=typeof params.section==='string'?params.section:'';
  const books=searchReadings(q,theme,section);
  return <div className={styles.page}>
    <div className={styles.body}><Link href="/learn/sources" className={styles.back}>← Books and research</Link></div>
    <PageIntro kicker="Read, reflect and put ideas to work" title="Books and ideas for your work" lede="Find a perspective that helps you understand a situation, ask a better question or try a different approach. Explore at your own pace." />
    <div className={styles.body}>
      <p className={styles.intro}>Each reading brings together an introduction, key ideas, a fuller summary and questions for reflection or conversation. The authors offer different perspectives; use them alongside the evidence, guidance and people relevant to your work.</p>
      <p><Link href="/learn/readings/pathways">Find a reading path for a question in your work →</Link></p>
      <section className={styles.path}><h2>Start with a question from your work</h2><p>How could a service notice become easier to understand and act on?</p><Link href="/learn/readings/practice/service-notice">Explore an example and try it yourself →</Link></section>
      <form className={styles.filters} action="/learn/readings">
        <label>Find a reading<input name="q" defaultValue={q} type="search" placeholder="Title, author or idea" /></label>
        <label>Subject<select name="theme" defaultValue={theme}><option value="">All subjects</option>{RESOURCE_THEMES.map(t=><option value={t.id} key={t.id}>{t.title}</option>)}</select></label>
        <label>Reading collection<select name="section" defaultValue={section}><option value="">All collections</option>{readingSections.map((s,i)=><option value={i+1} key={s}>{s}</option>)}</select></label>
        <button type="submit">Find readings</button><Link href="/learn/readings">Clear choices</Link>
      </form>
      <p role="status">{books.length} of {readings.length} readings{q?` matching “${q}”`:''}.</p>
      {books.length ? <ul className={styles.list}>{books.map(book=><li key={book.id} className={styles.entry}><p className={styles.label}>{readingSections[book.section-1]}</p><h2><Link href={readingHref(book.id)}>{book.title}</Link></h2><p className={styles.byline}>{book.authors}</p><p>{book.mainPoints[0]}</p></li>)}</ul> : <div className={styles.empty}><h2>No readings match those choices</h2><p>Try a shorter phrase or choose a broader subject.</p><Link href="/learn/readings">Explore all readings</Link></div>}
    </div>
  </div>;
}
