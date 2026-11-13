"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** "Connected across Minnesota": the state agencies the knowledge graph links to this page. Hidden when there are none. */
export function ConnectedMinnesota() {
  const pathname = usePathname();
  // Kept with the path they belong to, so a page never shows the previous page's agencies.
  const [found, setFound] = useState<{ path: string; agencies: { title: string; href: string }[] }>({ path: "", agencies: [] });
  useEffect(() => {
    if (!pathname || pathname === "/" || pathname === "/home" || pathname.startsWith("/minnesota-agencies")) return;
    const controller = new AbortController();
    fetch(`/api/connected?path=${encodeURIComponent(pathname)}`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : { agencies: [] })
      .then(data => setFound({ path: pathname, agencies: data.agencies ?? [] }))
      .catch(() => undefined);
    return () => controller.abort();
  }, [pathname]);
  const agencies = found.path === pathname ? found.agencies : [];
  if (!agencies.length) return null;
  return <aside className="connected-mn dsd-shell" aria-labelledby="connected-mn-title">
    <h2 id="connected-mn-title">Connected across Minnesota</h2>
    <ul>{agencies.map(agency => <li key={agency.href}><Link href={agency.href}>{agency.title}</Link></li>)}</ul>
    <style>{`
      .connected-mn { margin: 2.5rem auto 1.5rem; padding: 18px 22px; background: #f1f5f9; border-top: 4px solid #475569; border-radius: 10px; }
      .connected-mn h2 { margin: 0 0 .6rem; font-size: 1.1rem; color: #1e293b; }
      .connected-mn ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px 10px; }
      .connected-mn a { display: inline-block; padding: 6px 12px; background: #fff; border: 1px solid #cbd5e1; border-radius: 999px; font-weight: 600; font-size: .92rem; text-decoration: none; color: #1e3a8a; }
      .connected-mn a:hover { border-color: #1e3a8a; text-decoration: underline; }
    `}</style>
  </aside>;
}
