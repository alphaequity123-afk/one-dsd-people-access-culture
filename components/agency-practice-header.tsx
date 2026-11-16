"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { agencyHref, agencyZoneEnabled } from "@/lib/program/agency-zone";
import paths from "@/lib/program/agency-learning-paths.json";
import "./agency-practice-header.css";
import { useLearningTrail, trailHref } from "./use-learning-trail";

const sections = [["Home", "/"], ["Your work", "/work"], ["Across DHS", "/areas"], ["Learn", "/learn"], ["Library", "/library"], ["Communities", "/library?collection=minnesota-communities"], ["Ask", "/ask"]];

/** Agency branding spans the connected program; the learning trail survives related-page visits. */
export function AgencyPracticeHeader({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const trail = useLearningTrail(paths);
  if (!agencyZoneEnabled) return children;
  const title = trail ? paths[trail.path as keyof typeof paths] : undefined;
  const returnHref = agencyHref(trail ? trailHref(trail) : "/learn");

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
      <nav aria-label="Program"><ul className="agency-practice-shell">{sections.map(([label, href]) => <li key={label}><a href={agencyHref(href)} aria-current={pathname === href ? "page" : label === "Learn" && trail ? "location" : undefined}>{label}</a></li>)}</ul></nav>
    </header>
    {title ? <aside className="agency-practice-return" aria-label="Learning pathway">
      <a href={returnHref}>Back to learning pathway: {title}</a>
      <p>Return to your pathway when you are ready. Copy or download any practice notes you want to keep before leaving.</p>
    </aside> : <aside className="agency-practice-return" aria-label="Learning navigation"><a href={returnHref}>Explore learning pathways</a></aside>}
  </>;
}
