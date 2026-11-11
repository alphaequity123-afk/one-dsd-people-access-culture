"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";

type Agency = { id: string; name: string; href: string; description: string; connected: boolean };

/** A filterable A to Z list of the State of Minnesota agencies. */
export function AgencyDirectory({ agencies }: { agencies: Agency[] }) {
  const [q, setQ] = useState("");
  const id = useId();
  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return words.length ? agencies.filter(agency => words.every(word => `${agency.name} ${agency.description}`.toLowerCase().includes(word))) : agencies;
  }, [q, agencies]);
  const groups = useMemo(() => {
    const map = new Map<string, Agency[]>();
    for (const agency of shown) {
      const letter = agency.name.replace(/^(Minnesota|Governor's)\s+/, "")[0]?.toUpperCase() ?? "#";
      (map.get(letter) ?? map.set(letter, []).get(letter)!).push(agency);
    }
    return [...map].sort(([a], [b]) => a.localeCompare(b));
  }, [shown]);
  return <div className="agency-directory">
    <label htmlFor={id} className="agency-directory-label">Find an agency</label>
    <input id={id} type="search" value={q} onChange={event => setQ(event.target.value)} placeholder="For example: employment, revenue, health, housing" />
    <p className="agency-directory-count" role="status">{shown.length} of {agencies.length}</p>
    {groups.map(([letter, list]) => <section key={letter}>
      <h2>{letter}</h2>
      <ul>
        {list.map(agency => <li key={agency.id}>
          <a href={agency.href} target="_blank" rel="noreferrer">{agency.name}</a>
          <p>{agency.description}</p>
          {agency.connected ? <Link href={`/explore/community/agency-${agency.id}`}>Connected program work</Link> : null}
        </li>)}
      </ul>
    </section>)}
    <style>{`
      .agency-directory-label { display:block; font-weight:650; margin:1.25rem 0 .4rem; }
      .agency-directory input { width:100%; max-width:560px; min-height:44px; padding:8px 14px; border:1px solid #677a85; border-radius:999px; font:inherit; }
      .agency-directory-count { color:#4c606d; font-size:.9rem; }
      .agency-directory h2 { margin:1.6rem 0 .5rem; padding-bottom:.25rem; border-bottom:2px solid #c6cfd3; color:#003865; font-size:1.3rem; }
      .agency-directory ul { list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; }
      .agency-directory li { padding:12px 14px; background:#fff; border:1px solid #dfe5e9; border-top:4px solid #475569; border-radius:8px; }
      .agency-directory li > a { font-weight:650; }
      .agency-directory li p { margin:.35rem 0; font-size:.9rem; line-height:1.45; color:#42525f; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
      .agency-directory li > a + p + a, .agency-directory li > p + a { font-size:.9rem; font-weight:600; }
    `}</style>
  </div>;
}
