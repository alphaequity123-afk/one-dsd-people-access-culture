"use client";

import { useEffect } from "react";

/**
 * Keeps links to a single entry working on paged lists. When the address ends in #<id> and that
 * entry is on another page, reload with ?find=<id> so the server shows the page that holds it.
 * When the entry is here, open it if it sits in a closed panel and bring it into view.
 */
export function CatHashLocator({ prefix }: { prefix: string }) {
  useEffect(() => {
    const locate = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id.startsWith(prefix)) return;
      const target = document.getElementById(id);
      if (target) {
        const panel = target.closest("details");
        if (panel && !panel.open) panel.open = true;
        window.requestAnimationFrame(() => target.scrollIntoView());
        return;
      }
      const url = new URL(window.location.href);
      if (url.searchParams.get("find") === id) return;
      url.searchParams.set("find", id);
      url.searchParams.delete("page");
      window.location.replace(url.toString());
    };
    locate();
    window.addEventListener("hashchange", locate);
    return () => window.removeEventListener("hashchange", locate);
  }, [prefix]);
  return null;
}
