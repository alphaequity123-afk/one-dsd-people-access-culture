"use client";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const KEY = "one-dhs-learning-trail-v1";
const families = new Set(["executive", "managers", "supervisors", "policy-program", "licensing-integrity", "eligibility-public", "data-research", "finance-contracts", "enterprise-services", "admin-support"]);
export type LearningTrail = { path: string; family?: string };
export function validTrail(value: unknown, titles: Record<string, string>): LearningTrail | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.path !== "string" || !Object.hasOwn(titles, v.path)) return null;
  return { path: v.path, ...(typeof v.family === "string" && families.has(v.family) ? { family: v.family } : {}) };
}
/** Remember only the selected learning path and role within this browser tab. */
export function useLearningTrail(titles: Record<string, string>) {
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString();
  const [saved, setSaved] = useState<LearningTrail | null>(null);
  const explicit = validTrail({ path: params.get("learningPath") || (pathname === "/learn" ? params.get("task") : pathname.startsWith("/r/") ? params.get("path") : null), family: params.get("learningFamily") || params.get("family") }, titles);
  const restart = pathname === "/learn" && !explicit;
  useEffect(() => {
    if (restart) {
      setSaved(null);
      try { sessionStorage.removeItem(KEY); } catch { /* Navigation works when storage is unavailable. */ }
      return;
    }
    if (explicit) {
      setSaved(explicit);
      try { sessionStorage.setItem(KEY, JSON.stringify(explicit)); } catch { /* The explicit URL still provides a return link. */ }
    } else {
      try { setSaved(validTrail(JSON.parse(sessionStorage.getItem(KEY) || "null"), titles)); } catch { setSaved(null); }
    }
    // The URL is the source for explicit context; titles are a static registry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, query]);
  return restart ? null : explicit || saved;
}
export function trailHref(trail: LearningTrail) {
  const query = new URLSearchParams({ task: trail.path });
  if (trail.family) query.set("family", trail.family);
  return `/learn?${query}`;
}
