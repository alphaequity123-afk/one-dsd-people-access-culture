"use client";

import { useState } from "react";
import Link from "@/components/app-link";

export type FinderCourse = { id: string; title: string; summary: string; href: string; level: string; detail: string; series: string };

const LEVELS = ["Foundation", "Intermediate", "Advanced"] as const;
const PER_PAGE = 24;

export function matchingCourses(all: FinderCourse[], q: string, level: string): FinderCourse[] {
  const text = q.trim().toLowerCase();
  return all.filter(course => (!text || [course.title, course.summary, course.detail, course.series].join(" ").toLowerCase().includes(text)) && (!level || course.level === level));
}

/**
 * Find a course. The words typed stay in this page; a level chosen from the list and a link's starting words
 * (for example /courses?browse=all&q=collaboration) arrive as `initial`.
 */
export function CourseFinder({ all, initial }: { all: FinderCourse[]; initial: { q: string; level: string; browse: boolean; page: number } }) {
  const [draft, setDraft] = useState(initial.q);
  const [draftLevel, setDraftLevel] = useState(initial.level);
  const [q, setQ] = useState(initial.q);
  const [level, setLevel] = useState(initial.level);
  const [browse, setBrowse] = useState(initial.browse);
  const [page, setPage] = useState(initial.page);
  const expanded = browse || Boolean(q || level);
  const filtered = matchingCourses(all, q, level);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(totalPages, Math.max(1, page));
  const visible = expanded ? filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE) : filtered.slice(0, 6);
  const show = (next: number) => { setPage(next); document.getElementById("course-list-title")?.scrollIntoView(); };
  const clear = () => { setDraft(""); setDraftLevel(""); setQ(""); setLevel(""); setBrowse(true); setPage(1); };
  return <>
    <form className="flex flex-wrap gap-4" onSubmit={event => { event.preventDefault(); setQ(draft.trim().slice(0, 200)); setLevel(draftLevel); setBrowse(true); setPage(1); }}>
      <label>Find a course<input value={draft} onChange={event => setDraft(event.target.value)} maxLength={200} type="search" autoComplete="off" /></label>
      <label>Learning level<select value={draftLevel} onChange={event => setDraftLevel(event.target.value)}><option value="">All levels</option>{LEVELS.map(value => <option key={value}>{value}</option>)}</select></label>
      <button type="submit">Find courses</button>
      {q || level ? <button type="button" className="text-button" onClick={clear}>Clear filters</button> : null}
    </form>
    <p>Levels describe the depth of a course, not the standing or development of the person taking it. Courses without a recorded level are included when you choose All levels.</p>
    <section aria-labelledby="course-list-title">
      <h2 id="course-list-title">{expanded ? filtered.length + " matching courses" : "Start with a course"}</h2>
      {visible.length ? <ul className="mt-4 grid list-none gap-x-12 gap-y-7 p-0 md:grid-cols-2">{visible.map(course => <li key={course.id} className="border-t border-line pt-4"><p className="kicker">{course.level || course.series}</p><h3 className="text-xl font-extrabold"><Link href={course.href}>{course.title}</Link></h3><p>{course.summary}</p><p className="text-sm">{course.detail}</p></li>)}</ul> : <p>No courses match these choices. Try a broader subject or clear the filters.</p>}
      {expanded
        ? <nav aria-label="Course result pages" className="flex flex-wrap gap-6 mt-6">{current > 1 ? <button type="button" className="text-button" onClick={() => show(current - 1)}>Previous results</button> : null}<span>Page {current} of {totalPages}</span>{current < totalPages ? <button type="button" className="text-button" onClick={() => show(current + 1)}>Next results</button> : null}</nav>
        : <p className="mt-6"><Link href="/courses?browse=all" onClick={event => { event.preventDefault(); setBrowse(true); }}>Browse all {all.length} courses</Link></p>}
    </section>
  </>;
}
