"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { canonicalResourceHref } from "@/lib/product/resource-hrefs";

/**
 * Supporting material (sources, related links, practice prompts) now sits in closed panels.
 * A link to something inside one, such as a citation to #source-3, must still land on it:
 * this opens every closed panel around the linked element and scrolls it into view.
 */
export function OpenDetailsForHash() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    function reveal() {
      const current = window.location.pathname + window.location.search + window.location.hash;
      const destination = canonicalResourceHref(current);
      if (destination !== current) { router.replace(destination); return; }
      let id: string;
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      let opened = false;
      for (let node: HTMLElement | null = target; node; node = node.parentElement) {
        if (node instanceof HTMLDetailsElement && !node.open) { node.open = true; opened = true; }
      }
      if (opened) target.scrollIntoView();
    }
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, [pathname, router]);
  return null;
}
