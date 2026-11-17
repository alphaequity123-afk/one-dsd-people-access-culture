import { notFound, permanentRedirect } from "next/navigation";
import { getDomain } from "@/lib/domains";
import { canonicalDomainHref } from "@/lib/product/domain-hrefs";

export default async function LegacyDomainPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  if (!getDomain(id)) notFound();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams ?? {})) {
    if (Array.isArray(value)) value.forEach(item => query.append(key, item));
    else if (value !== undefined) query.set(key, value);
  }
  const suffix = query.size ? `?${query}` : "";
  permanentRedirect(canonicalDomainHref(`/domains/${id}${suffix}`));
}
