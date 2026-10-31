import Link from "next/link";
import { RESOURCE_THEMES } from "@/lib/content/resource-organization";

export type ResourceFormatView = "library" | "learning" | "reading" | "listening";

export function ResourceFormatLinks({ theme, current }: { theme?: string; current: ResourceFormatView }) {
  const selected = RESOURCE_THEMES.find(item => item.id === theme);
  const suffix = selected ? `?theme=${selected.id}` : "";
  const links = [
    { id: "library", href: "/library", title: "Learning, tools and guidance" },
    { id: "learning", href: "/learn", title: "Courses and practice" },
    { id: "reading", href: "/learn/sources", title: "Books and research" },
    { id: "listening", href: "/audio-library", title: "Recordings and podcasts" },
  ];
  return <nav aria-label={selected ? `More ways to explore ${selected.title}` : "Ways to explore resources"} className="my-6 flex flex-wrap gap-x-6 gap-y-2">
    {links.map(link => <Link key={link.id} href={link.href + suffix} aria-current={link.id === current ? "page" : undefined} className="inline-flex min-h-11 items-center font-semibold text-[var(--blue)] underline underline-offset-4">{link.title}</Link>)}
  </nav>;
}
