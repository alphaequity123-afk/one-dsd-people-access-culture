export const agencyZoneEnabled = process.env.NEXT_PUBLIC_DHS_AGENCY_ZONE === "1";

/** These routes belong to the agency application and require a document navigation between zones. */
export function isAgencyRoute(href: string): boolean {
  if (!href.startsWith('/') || href.startsWith('//')) return false;
  const path = href.split(/[?#]/, 1)[0];
  return ['/', '/learn', '/library', '/ask', '/calendar', '/user-guide', '/work', '/dsd'].includes(path)
    || /^\/(areas|r|trainings|manage)(\/|$)/.test(path);
}
