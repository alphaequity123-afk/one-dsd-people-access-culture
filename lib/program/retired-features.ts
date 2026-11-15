/** Owner direction, October 10: remove request intake and the three-year plan. */
export const REFERRAL_ONLY_COURSE_IDS = new Set(["cultural-intelligence-tribal", "cultural-intelligence-native-american", "cultural-intelligence-alaska-native", "ipe-20-tribal-sovereignty"]);
export const CONSULTATION_REQUESTS_REMOVED = true;
export const RETIRED_RESOURCE_IDS = new Set(["ref-one-dsd-three-year-plan", "guide-one-dsd-implementation-plan", "ref-dhs-equity-landscape", "ref-minnesota-equity-research"]);

/** Retire the standalone workshop, not its historical source attribution. */
const workshopIds = new Set(['drive-cultural-intelligence-workshop','cultural-intelligence-workshop','cultural-intelligence-workshop-cohort-1','verona-mitchell-training']);
export function isRetiredCulturalWorkshop(item: {id?:string;title?:string;author?:string}): boolean {
  const id=(item.id??'').replace(/^(?:course[.-]|lm-)/,'');
  return workshopIds.has(id) || /^cultural intelligence workshop(?:\s+cohort\s*1)?$/i.test((item.title??'').trim())
    || (/verona\s+mitchell/i.test((item.author??'')+' '+(item.title??'')) && /training|workshop/i.test(item.title??''));
}

export function retiredFeatureDestination(href: string): string | undefined {
  if (href.includes('1HmDVjnDGR9rsOJP-rcZ-QdNzlNDvnMNr')) return '/courses/cv-understanding-your-lens';
  const pathname = href.split(/[?#]/)[0].replace(/\/$/, "");
  const workshop=pathname.match(/^\/(?:courses|resources|library|share\/courses|share\/library)\/([^/]+)/)?.[1];
  if (workshop && isRetiredCulturalWorkshop({id:workshop})) return '/courses/cv-understanding-your-lens';
  if (pathname === "/support/request" || pathname === "/support/track") return "/support/right-person";
  if (pathname === "/one-dsd/plan" || pathname === "/one-dsd/evidence/source/three-year-plan"
    || /\/(?:library|resources|share\/library)\/(?:ref-one-dsd-three-year-plan|guide-one-dsd-implementation-plan)$/.test(pathname)
    || pathname === "/documents/program-evidence/one-dsd-three-year-plan.txt"
    || /^\/library\/one-dsd-planning\/One_DSD_Three_Year_Implementation_Plan\.(?:html|docx|pdf|txt)$/.test(pathname)) return "/program/model";
  if (pathname === "/one-dsd/evidence" || pathname.startsWith("/one-dsd/evidence/") || /^\/documents\/program-evidence\/(?:dhs-equity-landscape|minnesota-equity-research|one-dsd-three-year-plan)\.(?:txt|pdf|docx|html)$/.test(pathname) || /\/(?:library|resources|share\/library)\/(?:ref-dhs-equity-landscape|ref-minnesota-equity-research)$/.test(pathname)) return "/program/model";
  const course = pathname.match(/^\/(?:courses|share\/courses)\/([^/]+)/)?.[1];
  if (course && /^self-directed-[FIA](?:0[1-9]|1[0-9]|2[0-4])$/.test(course)) return "/learning/self-directed/index.html?course="+course.slice(14);
  if (course && REFERRAL_ONLY_COURSE_IDS.has(course)) return "/learn/tribal-referral";
  return undefined;
}

/** Render-only link updates preserve the stored source and previous revisions. */
export function withoutRetiredLinks<T>(value: T): T {
  if (Array.isArray(value)) return value.map(withoutRetiredLinks) as T;
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  const destination = typeof record.href === "string" ? retiredFeatureDestination(record.href) : undefined;
  const result = Object.fromEntries(Object.entries(record).map(([key, entry]) => [key, withoutRetiredLinks(entry)]));
  if (destination) {
    result.href = destination;
    if (typeof record.label === "string") result.label = destination === "/support/right-person" ? "Find the person or area responsible" : destination === "/courses/cv-understanding-your-lens" ? "Explore cultural values" : "Explore One DSD";
  }
  return result as T;
}
