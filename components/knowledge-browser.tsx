"use client";

import { useId, useMemo, useState } from "react";
import Link from "@/components/app-link";
import type { Tier } from "@/lib/program/catalog";
import { FORMATS, FORMAT_LABEL, type Format, type KnowledgeRow, type LearningPath } from "@/lib/program/knowledge-index";
import styles from "./knowledge-browser.module.css";

/**
 * The Knowledge browser (v2 prototype): one list of courses, guides, readings, policy references and audio,
 * filtered by learning path, Start / Apply / Lead and format, with "Ask about this" beside each item. Filters run in
 * the browser; nothing about what a person looks at is recorded.
 */
const TIERS: { id: Tier | "all"; label: string }[] = [{ id: "all", label: "All" }, { id: "start", label: "Start" }, { id: "apply", label: "Apply" }, { id: "lead", label: "Lead" }];
const PAGE = 24;

export function KnowledgeBrowser({ rows, paths }: { rows: KnowledgeRow[]; paths: LearningPath[] }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [path, setPath] = useState("");
  const [tier, setTier] = useState<Tier | "all">("all");
  const [format, setFormat] = useState<Format | "all">("all");
  const [shown, setShown] = useState(PAGE);
  const matches = useMemo(() => {
    const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return rows.filter(([title, , rowFormat, rowTier, rowPaths]) =>
      (!path || rowPaths.includes(path)) && (tier === "all" || rowTier === tier) && (format === "all" || rowFormat === format) &&
      words.every(word => title.toLocaleLowerCase().includes(word)));
  }, [rows, query, path, tier, format]);
  const reset = () => { setQuery(""); setPath(""); setTier("all"); setFormat("all"); setShown(PAGE); };
  const filtered = Boolean(query || path || tier !== "all" || format !== "all");
  const choose = <T,>(setter: (value: T) => void) => (value: T) => { setter(value); setShown(PAGE); };

  return <section className={styles.browser} aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>Find something to learn or look up</h2>
    <p className={styles.lede}>Everything in the program is here: courses, guides, readings, policy references and audio. Narrow it down by what you want to do, where you are in the work or the kind of resource.</p>
    <div className={styles.filters}>
      <label className={styles.search}>Search by title<input type="search" value={query} onChange={event => choose(setQuery)(event.target.value)} placeholder="For example: plain language, interpreter, budget" /></label>
      <label>Learning path<select value={path} onChange={event => choose(setPath)(event.target.value)}>
        <option value="">All paths</option>
        {paths.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select></label>
      <fieldset><legend>Where you are in the work</legend><div className={styles.choices}>{TIERS.map(item => <button key={item.id} type="button" aria-pressed={tier === item.id} onClick={() => choose(setTier)(item.id)}>{item.label}</button>)}</div></fieldset>
      <fieldset><legend>Kind of resource</legend><div className={styles.choices}>
        <button type="button" aria-pressed={format === "all"} onClick={() => choose(setFormat)("all")}>All</button>
        {FORMATS.map(item => <button key={item} type="button" aria-pressed={format === item} onClick={() => choose(setFormat)(item)}>{FORMAT_LABEL[item]}</button>)}
      </div></fieldset>
    </div>
    <p className={styles.count} aria-live="polite">{matches.length === 1 ? "1 resource" : `${matches.length.toLocaleString()} resources`}{filtered ? <> <button type="button" className={styles.reset} onClick={reset}>Clear filters</button></> : null}</p>
    {path ? <p className={styles.pathLink}><Link href={`/learn/paths/${encodeURIComponent(path)}`}>Open the {paths.find(item => item.id === path)?.title} path, step by step</Link></p> : null}
    <ul className={styles.list}>{matches.slice(0, shown).map(([title, href, rowFormat, rowTier]) => <li key={href}>
      <Link href={href} className={styles.title}>{title}</Link>
      <span className={styles.meta}>{FORMAT_LABEL[rowFormat]}, {rowTier === "start" ? "Start" : rowTier === "apply" ? "Apply" : "Lead"}</span>
      <Link className={styles.ask} href={`/ask?q=${encodeURIComponent(`What should I know about "${title}", and how can I use it in my work?`)}`} aria-label={`Ask about ${title}`}>Ask about this</Link>
    </li>)}</ul>
    {matches.length > shown ? <p><button type="button" className={styles.more} onClick={() => setShown(count => count + PAGE * 2)}>Show more</button></p> : null}
    {!matches.length ? <p>Nothing matches yet. Try fewer words, or <button type="button" className={styles.reset} onClick={reset}>clear the filters</button>.</p> : null}
  </section>;
}
