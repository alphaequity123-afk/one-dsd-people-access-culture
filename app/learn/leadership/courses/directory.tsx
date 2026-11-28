"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Entry = {
  id: string;
  title: string;
  series: string;
  theme: string;
  roles: string[];
};
type Family = {
  id: string;
  title: string;
  decision: string;
  practice: string;
  evidence: string;
  authority: string;
};
export default function Directory({
  courses,
  families,
}: {
  courses: Entry[];
  families: Family[];
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState("");
  const [series, setSeries] = useState("");
  const selected = families.find((f) => f.title === family);
  const filtered = courses.filter(
    (c) =>
      (!family || c.roles.includes(family)) &&
      (!series || c.series === series) &&
      (c.title + " " + c.theme)
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const groups = new Map<string, Entry[]>();
  for (const c of filtered) {
    const key = c.series + " · " + c.theme;
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }
  return (
    <>
      <div className="lo-filters">
        <label>
          Search topics
          <input
            disabled={!ready}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Job family
          <select
            disabled={!ready}
            value={family}
            onChange={(e) => setFamily(e.target.value)}
          >
            <option value="">All job families</option>
            {families.map((f) => (
              <option key={f.id}>{f.title}</option>
            ))}
          </select>
        </label>
        <label>
          Learning focus
          <select
            disabled={!ready}
            value={series}
            onChange={(e) => setSeries(e.target.value)}
          >
            <option value="">All courses</option>
            {[...new Set(courses.map((c) => c.series))].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      {selected && (
        <aside className="lo-family">
          <h3>A decision in {selected.title.toLowerCase()}</h3>
          <p>{selected.decision}</p>
          <p>
            {selected.practice} {selected.authority}
          </p>
        </aside>
      )}
      <p aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "course" : "courses"}
      </p>
      {filtered.length === 0 && (
        <button
          type="button"
          className="button"
          onClick={() => {
            setSearch("");
            setFamily("");
            setSeries("");
          }}
        >
          Show all courses
        </button>
      )}
      <div className="leadership-library">
        {Array.from(groups).map(([group, rows]) => (
          <section className="leadership-card" key={group}>
            <p>{rows[0].series}</p>
            <h3>{rows[0].theme}</h3>
            <ul>
              {rows.map((c) => (
                <li key={c.id}>
                  <Link href={"/learn/leadership/courses/" + c.id}>
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
