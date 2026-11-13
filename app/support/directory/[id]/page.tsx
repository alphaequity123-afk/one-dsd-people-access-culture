import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SUPPORT_SOURCES } from "@/lib/product/support-directory";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: SUPPORT_SOURCES.find(source => source.id === id)?.label ?? "DHS guidance" };
}

export default async function SupportSourcePage({ params }: Props) {
  const { id } = await params;
  const source = SUPPORT_SOURCES.find(item => item.id === id);
  if (!source) notFound();
  return <article className="pilot-topic pilot-reading-width">
    <header>
      <nav className="calm-crumbs" aria-label="Breadcrumb"><Link href="/support/directory">DHS offices and guidance</Link></nav>
      <h1>{source.label}</h1>
      <p>{source.audience}</p>
    </header>
    <section className="space-y-4" aria-label="About this resource">
      <p>{source.purpose}</p>
      <p>{source.limitation}</p>
      <p><a href={source.href}>View original</a></p>
      <p className="text-sm text-muted">Published by {source.publisher}.{source.sourceDate ? ` The source identifies its date as ${source.sourceDate}.` : " No publication date is stated here."}</p>
    </section>
  </article>;
}
