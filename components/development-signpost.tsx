"use client";

import Link from "@/components/app-link";
import { usePathname } from "next/navigation";
import { developmentContext, journeyHref } from "@/lib/program/development";

export function DevelopmentSignpost() {
  const context = developmentContext(usePathname());
  if (!context) return null;
  return <aside className="development-signpost wrap" aria-label="Connect learning and practice">
    <div><h2>{context.title}</h2><p>{context.body}</p></div>
    <Link href={context.journeyId ? journeyHref(context.journeyId) : "/learn/paths"}>Explore a guided pathway</Link>
  </aside>;
}
