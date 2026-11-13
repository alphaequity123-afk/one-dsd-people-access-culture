import type { Metadata } from "next";
import Link from "next/link";
import { CoreFifteen } from "@/components/core-fifteen";

export const metadata: Metadata = { title: "The Core 15" };

export default function CoreFifteenPage() {
  return <article className="pilot-topic">
    <header><Link href="/learn">Back to Learn</Link><h1>The Core 15</h1></header>
    <section aria-label="Recommended courses"><CoreFifteen standalone /></section>
  </article>;
}
