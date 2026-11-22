"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { agencyHref, agencyOrigin, agencyZoneEnabled } from "@/lib/program/agency-zone";
import { onDsdFrontDoor, toFrontDoor } from "@/lib/program/front-door";
import paths from "@/lib/program/agency-learning-paths.json";
import "./agency-practice-header.css";
import { useLearningTrail, trailHref } from "./use-learning-trail";

// Owner decision 2026-11-22: these pages now reach people only through the One DSD site, so they carry its menu
// (same items and order as the front door's components/site-header.tsx for One DSD; Ask and Search sit in the banner).
const sections = [["Home", "/"], ["Your work", "/work"], ["Begin with equity", "/start"], ["Learn", "/learn"], ["Leadership", "/learn/leadership"], ["Library", "/library"], ["Communities", "/communities"]];

/** Agency branding spans the connected program; the learning trail survives related-page visits. */
export function AgencyPracticeHeader({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const trail = useLearningTrail(paths);
  // On a One DSD front door, agency links lead to the same page there, so people stay in One DSD.
  useEffect(() => {
    if (!agencyZoneEnabled || !onDsdFrontDoor()) return;
    const retarget = () => document.querySelectorAll<HTMLAnchorElement>("a[href^='http']").forEach(a => {
      const next = toFrontDoor(a.href, agencyOrigin);
      if (next !== a.href) a.href = next;
    });
    retarget();
    const observer = new MutationObserver(retarget);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  if (!agencyZoneEnabled) return children;
  const title = trail ? paths[trail.path as keyof typeof paths] : undefined;
  const returnHref = agencyHref(trail ? trailHref(trail) : "/learn");

  return <>
    <header className="agency-practice-header">
      <div className="agency-practice-shell agency-practice-brand-row">
        <a className="agency-practice-brand" href="/">
          {/* The existing DHS logo is kept at its original aspect ratio. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/dhs-logo.png" width={319} height={68} alt="Minnesota Department of Human Services" />
          <span><strong className="pac-unit-dhs">One DHS</strong><strong className="pac-unit-dsd">One DSD</strong><span>People, Access and Culture</span></span>
        </a>
        <div className="agency-practice-tools"><a href="/ask">Ask</a><a href="/library">Search</a></div>
      </div>
      <nav aria-label="Program"><ul className="agency-practice-shell">{sections.map(([label, href]) => <li key={label}><a href={href} aria-current={pathname === href ? "page" : label === "Learn" && trail ? "location" : undefined}>{label}</a></li>)}</ul></nav>
    </header>
    {title ? <aside className="agency-practice-return" aria-label="Learning pathway">
      <a href={returnHref}>Back to learning pathway: {title}</a>
      <p>Return to your pathway when you are ready. Copy or download any practice notes you want to keep before leaving.</p>
    </aside> : null}
  </>;
}
