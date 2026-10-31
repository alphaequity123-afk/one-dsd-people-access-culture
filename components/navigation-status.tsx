"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const SHOW_AFTER_MS = 300;
const GIVE_UP_AFTER_MS = 20_000;

/** Tells people a slow page is on its way. A route-level loading screen would make every missing page report success. */
export function NavigationStatus() {
  const pathname = usePathname();
  const [opening, setOpening] = useState(false);
  useEffect(() => {
    let show: ReturnType<typeof setTimeout> | undefined;
    let giveUp: ReturnType<typeof setTimeout> | undefined;
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      clearTimeout(show); clearTimeout(giveUp);
      show = setTimeout(() => setOpening(true), SHOW_AFTER_MS);
      giveUp = setTimeout(() => setOpening(false), GIVE_UP_AFTER_MS);
    }
    document.addEventListener("click", onClick);
    return () => { document.removeEventListener("click", onClick); clearTimeout(show); clearTimeout(giveUp); setOpening(false); };
  }, [pathname]);
  return <div role="status" aria-live="polite" style={opening ? { position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, padding: "0.4rem 1rem", background: "#003865", color: "#fff", fontWeight: 600, textAlign: "center" } : { position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>{opening ? "Opening your page…" : ""}</div>;
}
