import Link from "next/link";
import type { ReactNode } from "react";
import { catHref, catPageNumbers, type CatPage, type CatParams } from "@/lib/cat-paging";
import styles from "./cat-list.module.css";

export { styles as catStyles };

/** "Showing 1–20 of 274 policies." announced to screen readers when the results change. */
export function CatResultStatus({ page, noun, nouns, of, empty }: { page: CatPage<unknown>; noun: string; nouns: string; of?: number; empty?: string }) {
  const word = page.total === 1 ? noun : nouns;
  const filtered = of !== undefined && of !== page.total;
  return <p role="status" className={styles.status}>
    {page.total === 0
      ? empty ?? `No ${nouns} match these choices. Try fewer choices or different words.`
      : `Showing ${page.first}–${page.last} of ${page.total}${filtered ? " matching" : ""} ${word}${filtered ? ` (${of} in all)` : ""}.`}
  </p>;
}

/** Previous, numbered and next page links. The current page carries aria-current. */
export function CatPager({ page, basePath, params, label }: { page: CatPage<unknown>; basePath: string; params: CatParams; label: string }) {
  if (page.pageCount <= 1) return null;
  const href = (n: number) => catHref(basePath, params, { page: String(n) });
  return <nav className={styles.pager} aria-label={label}>
    <ul>
      {page.page > 1 ? <li><Link href={href(page.page - 1)} rel="prev">Previous<span className="sr-only"> page</span></Link></li> : null}
      {catPageNumbers(page.page, page.pageCount).map((n, i) => n === 0
        ? <li key={`gap-${i}`} className={styles.gap} aria-hidden="true">…</li>
        : <li key={n}><Link href={href(n)} aria-current={n === page.page ? "page" : undefined}><span className="sr-only">Page </span>{n}</Link></li>)}
      {page.page < page.pageCount ? <li><Link href={href(page.page + 1)} rel="next">Next<span className="sr-only"> page</span></Link></li> : null}
    </ul>
  </nav>;
}

/** A compact list of rows. */
export function CatList({ label, children }: { label?: string; children: ReactNode }) {
  return <ul className={styles.list} aria-label={label}>{children}</ul>;
}

/** One row: a title (usually a link) and one line under it. */
export function CatRow({ id, title, line, meta }: { id?: string; title: ReactNode; line?: ReactNode; meta?: ReactNode }) {
  return <li className={styles.row} id={id}>
    <span className={styles.title}>{title}</span>
    {line ? <p className={styles.line}>{line}</p> : null}
    {meta ? <p className={styles.meta}>{meta}</p> : null}
  </li>;
}

/** One row whose full entry opens in place, for items without a page of their own. */
export function CatExpandRow({ id, title, line, children }: { id?: string; title: ReactNode; line?: ReactNode; children: ReactNode }) {
  return <li className={styles.row}>
    <details className={styles.expand} id={id}>
      <summary><span className={styles.title}>{title}</span>{line ? <span className={styles.meta}> · {line}</span> : null}</summary>
      <div className={styles.body}>{children}</div>
    </details>
  </li>;
}
