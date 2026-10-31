import type { ReactNode } from "react";
import styles from "./page-contents.module.css";

export type PageContentsItem = { href: `#${string}`; label: string };

/** Keep local navigation beside long reading or working pages, without changing their forms. */
export function PageContents({ items, children, className = "" }: {
  items: readonly PageContentsItem[];
  children: ReactNode;
  className?: string;
}) {
  const links = <ul>{items.map(item => <li key={item.href}><a href={item.href}>{item.label}</a></li>)}</ul>;
  return <div className={`${styles.layout} ${className}`}>
    <aside className={styles.rail}>
      <nav className={styles.desktop} aria-label="On this page">
        <p className={styles.label}>On this page</p>
        {links}
      </nav>
      <details className={styles.mobile}>
        <summary>On this page</summary>
        <nav aria-label="On this page">{links}</nav>
      </details>
    </aside>
    <div className={styles.body}>{children}</div>
  </div>;
}
