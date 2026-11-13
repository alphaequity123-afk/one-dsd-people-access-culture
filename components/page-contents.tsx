import type { ReactNode } from "react";
import styles from "./page-contents.module.css";

export type PageContentsItem = { href: `#${string}`; label: string };

/** Keep the reading or task in one column, with its contents available on demand. */
export function PageContents({ items, children, className = "" }: {
  items: readonly PageContentsItem[];
  children: ReactNode;
  className?: string;
}) {
  const links = <ul>{items.map(item => <li key={item.href}><a href={item.href}>{item.label}</a></li>)}</ul>;
  return <div className={`${styles.layout} ${className}`}>
    <aside className={styles.rail}>
      <details className={styles.contents}>
        <summary>On this page</summary>
        <nav aria-label="On this page">{links}</nav>
      </details>
    </aside>
    <div className={styles.body}>{children}</div>
  </div>;
}
