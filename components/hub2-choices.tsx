
import { SourceLink } from "@/components/app-link";
import Link from "@/components/app-link";
import type { ReactNode } from "react";

export type Hub2Choice = { href: string; title: string; body: ReactNode; action: string };

/**
 * The few clear choices at the top of a hub page. A link to an id on the same page uses a plain
 * anchor so the browser fires hashchange and the closed panel holding that id opens.
 */
export function Hub2Choices({ label, choices, className = "" }: { label: string; choices: Hub2Choice[]; className?: string }) {
  return <ul aria-label={label} className={`grid list-none gap-4 p-0 sm:grid-cols-2 ${className}`.trim()}>
    {choices.map(choice => {
      const inner = <>
        <span className="block text-xl font-semibold text-[#003865]">{choice.title}</span>
        <span className="mt-2 block leading-7 text-[#1f2a33]">{choice.body}</span>
        <span className="mt-3 block font-semibold underline">{choice.action}</span>
      </>;
      const card = "block h-full rounded-[10px] border border-[#8ea2b5] bg-white p-5 no-underline hover:border-[#003865] hover:bg-[#f1f5f9] focus-visible:outline-2";
      return <li key={choice.href} className="m-0">
        {choice.href.startsWith("#") ? <SourceLink className={card} href={choice.href}>{inner}</SourceLink> : <Link prefetch={false} className={card} href={choice.href}>{inner}</Link>}
      </li>;
    })}
  </ul>;
}

/** A closed panel for material that moved off the first screen. The id stays reachable: a link to it opens the panel. */
export function Hub2More({ id, title, open, children, headingId }: { id?: string; title: ReactNode; open?: boolean; children: ReactNode; headingId?: string }) {
  // Browsers open a closed panel themselves when a link targets it, before hydration.
  return <details id={id} className="course-more-item" open={open || undefined} suppressHydrationWarning>
    <summary><h2 id={headingId}>{title}</h2></summary>
    {children}
  </details>;
}
