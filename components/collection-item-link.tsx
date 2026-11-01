import Link from "next/link";
import { RIGHT_PERSON_HREF, collectionItem, collectionItemHref } from "@/lib/content/collections";
import styles from "./collections.module.css";

export function RequiredLabel({ label }: { label: string }) {
  return <span className={styles.required}>{label}</span>;
}

/**
 * One listed item. A listed item is never dropped from view: if it is not being
 * served right now, its title stays on the page and says so, so a reader can tell
 * something is missing, including the one course all DHS staff are required to take.
 */
export function CollectionItemLink({ id, published }: { id: string; published: ReadonlySet<string> }) {
  const item = collectionItem(id);
  if (!item) return <span className={styles.unavailable}>This item could not be found. <Link href={RIGHT_PERSON_HREF}>Find the right person or office</Link>.</span>;
  const missing = item.kind === "course" && !published.has(item.id);
  return <>
    {missing ? <span>{item.title}</span> : <Link href={collectionItemHref(item)} prefetch={false}>{item.title}</Link>}
    {item.required ? <RequiredLabel label={item.required} /> : null}
    {missing ? <span className={styles.unavailable}> This course is not available right now. <Link href={RIGHT_PERSON_HREF}>Find the right person or office</Link>.</span> : null}
  </>;
}
