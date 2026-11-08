"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Supporting material (sources, related links, practice prompts) now sits in closed panels.
 * A link to something inside one, such as a citation to #source-3, must still land on it:
 * this opens every closed panel around the linked element and scrolls it into view.
 */
export function OpenDetailsForHash() {
  const pathname = usePathname();
  useEffect(() => {
    function reveal() {
      const id = decodeURIComponent(window.location.hash.slice(1));
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
  }, [pathname]);
  return null;
}
