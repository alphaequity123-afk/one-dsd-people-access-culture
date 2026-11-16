"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { agencyHref, agencyZoneEnabled } from "@/lib/program/agency-zone";
import paths from "@/lib/program/agency-learning-paths.json";
import "./agency-practice-header.css";

const sections = [["Home", "/"], ["Your work", "/work"], ["Across DHS", "/areas"], ["Learn", "/learn"], ["Library", "/library"], ["Communities", "/library?collection=minnesota-communities"], ["Ask", "/ask"]];
const families = new Set(["executive", "managers", "supervisors", "policy-program", "licensing-integrity", "eligibility-public", "data-research", "finance-contracts", "enterprise-services", "admin-support"]);

/** Explicit URL context keeps a shared practice link connected to its learning pathway. */
export function AgencyPracticeHeader({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const path = params.get("learningPath") || "";
  const title = Object.hasOwn(paths, path) ? paths[path as keyof typeof paths] : undefined;
  if (!agencyZoneEnabled || !title || !(pathname === "/practice" || pathname.startsWith("/practice/"))) return children;
  const query = new URLSearchParams({ task: path });
  const family = params.get("learningFamily");
  if (family && families.has(family)) query.set("family", family);
  const returnHref = agencyHref(`/learn?${query}`);

  return <>
    <header className="agency-practice-header">
      <div className="agency-practice-shell agency-practice-brand-row">
        <a className="agency-practice-brand" href={agencyHref("/")} aria-label="One DHS People, Access and Culture home">
          {/* The existing DHS logo is kept at its original aspect ratio. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/dhs-logo.png" width={319} height={68} alt="Minnesota Department of Human Services" />
          <span><strong>One DHS</strong><span>People, Access and Culture</span></span>
        </a>
        <div className="agency-practice-tools"><a href={agencyHref("/ask")}>Ask</a><a href={agencyHref("/library")}>Search</a></div>
      </div>
      <nav aria-label="Program"><ul className="agency-practice-shell">{sections.map(([label, href]) => <li key={label}><a href={agencyHref(href)} aria-current={label === "Learn" ? "location" : undefined}>{label}</a></li>)}</ul></nav>
    </header>
    <aside className="agency-practice-return" aria-label="Learning pathway">
      <a href={returnHref}>Back to learning pathway: {title}</a>
      <p>Apply the learning here, then return to your pathway when you are ready. Copy or download any practice notes you want to keep before leaving.</p>
    </aside>
  </>;
}
