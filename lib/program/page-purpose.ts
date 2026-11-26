/** v2 rebuild (2026-11-25): Home plus four pillars — Practice, Leadership, Communities, Knowledge (Gemini overhaul). About, help, support and the charter share one page, /about. Ask sits in the banner on every page; one Search.
 * Shared navigation describes the work, without changing access or page content. */
export const PAGE_AREAS = {
  start: { label: "Start", home: "/start", links: [["Start", "/start"], ["New to DSD", "/start#new-to-dsd"], ["How to use this site", "/user-guide"]] },
  learn: { label: "Knowledge", home: "/knowledge", links: [["Learning", "/learn"], ["Library", "/library"], ["Courses", "/courses"], ["Themes and collections", "/collections"], ["Course collections", "/learn/collections"], ["Paths", "/learn/paths"], ["Listen", "/audio-library"]] },
  tools: { label: "Practice", home: "/practice", links: [["Guided practices", "/practice"], ["Equity Analysis Toolkit", "/learn/equity-toolkit"], ["Equity reviews", "/equity-review"], ["Tools", "/program/resources"]] },
  support: { label: "Support", home: "/support", links: [["Support", "/support"], ["Ask", "/ask"], ["Minnesota communities", "/minnesota-communities"]] },
  programs: { label: "One DSD", home: "/one-dsd", links: [["One DSD", "/one-dsd"], ["Programs and services", "/one-dsd/programs"], ["Planning and progress", "/one-dsd/planning"], ["Equity leadership and growth", "/one-dsd/leadership"], ["Understanding DHS", "/understanding-dhs"], ["About", "/about"]] },
  leading: { label: "Leadership", home: "/leadership", links: [["Leadership", "/leadership"], ["What are you deciding?", "/leading"], ["Suggested paths", "/leading/paths"], ["Your leadership journey", "/leading/journey"], ["How this works", "/leading/how-this-works"]] },
  about: { label: "About and help", home: "/about", links: [["About and help", "/about"], ["Program charter", "/about#charter"], ["How the program works", "/program/model"]] },
  communities: { label: "Communities", home: "/communities", links: [["Communities", "/communities"], ["Minnesota communities", "/minnesota-communities"], ["Culture Calendar", "/minnesota-communities/calendar"], ["Community Outreach and Engagement", "/community-outreach"], ["Employee resource groups", "/employee-resource-groups"]] },
  consultant: { label: "Consultant workspace", home: "/consultant", links: [["Workspace", "/consultant"], ["My work", "/my-work"], ["Return to the program", "/home"]] },
} as const;
export type PageArea = keyof typeof PAGE_AREAS;
/**
 * The four main menu sections. My work and For leaders, supervisors, managers, and directors are header utilities; About lives in the footer and under One DSD.
 * Support stays in the menu. Ask is available in the banner and the Support row;
 * Themes and collections sits under Learn; Community Outreach and Engagement sits under Cultural Intelligence. */
export const PRIMARY_SECTIONS: ReadonlyArray<readonly [string, string, PageArea]> = [
  ["Practice", "/practice", "tools"], ["Leadership", "/leadership", "leading"], ["Communities", "/communities", "communities"], ["Knowledge", "/knowledge", "learn"],
];
export function pageArea(path: string): PageArea {
  if (/^\/consultant(?:\/|$)/.test(path)) return "consultant";
  if (/^\/(leadership|leading|team-kits|people-and-growth|growth)(?:\/|$)/.test(path) || /^\/learn\/(leadership|leadership-styles)(?:\/|$)/.test(path) || /^\/one-dsd\/leadership(?:\/|$)/.test(path)) return "leading";
  if (/^\/(communities|minnesota-communities|community-outreach|employee-resource-groups|minnesota-agencies)(?:\/|$)/.test(path) || /^\/learn\/tribal-referral(?:\/|$)/.test(path)) return "communities";
  if (/^\/(charter|program-foundation|about)(?:\/|$)/.test(path) || /^\/program\/model(?:\/|$)/.test(path)) return "about";
  if (/^\/(start|orientation|user-guide)(?:\/|$)/.test(path)) return "start";
  if (/^\/(one-dsd|administrations|understanding-dhs)(?:\/|$)/.test(path)) return "programs";
  if (/^\/(support|ask|contribute)(?:\/|$)/.test(path)) return "support";
  if (/^\/learn\/(equity-toolkit|tools)(?:\/|$)/.test(path) || /^\/(practice|practice-guides|toolkit-studio|equity-policy|equity-review|operationalizing-equity|my-work)(?:\/|$)/.test(path) || /^\/program\/(resources|practice|progress|impact)(?:\/|$)/.test(path)) return "tools";
  if (/^\/(knowledge|learn|collections|courses|paths|journeys|resources|library|audio-library|podcasts)(?:\/|$)/.test(path)) return "learn";
  return "about";
}
export function internalPage(path: string) { return path !== "/" && path !== "/home" && !path.startsWith("/embedded-tools/"); }
