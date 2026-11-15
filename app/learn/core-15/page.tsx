import type { Metadata } from "next";
import Link from "@/components/app-link";
import { CoreFifteen } from "@/components/core-fifteen";

export const metadata: Metadata = { title: "The Core 15" };

export default function CoreFifteenPage() {
  return <article className="pilot-topic">
    <header><Link href="/learn">Back to Learn</Link><h1>The Core 15</h1><p>The Core 15 is a set of 15 recommended courses for staff of the Disability Services Division (DSD). Start with the first course, An Equity Lens for Ordinary Decisions, or choose the one closest to your work.</p></header>
    <section aria-label="Recommended courses"><CoreFifteen standalone /></section>
  </article>;
}
