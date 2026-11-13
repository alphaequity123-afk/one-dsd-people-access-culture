/** Shared navigation describes the work, without changing access or page content. */
export const PAGE_AREAS = {
  start: { label: "Start", home: "/start", links: [["Start", "/start"], ["New to DSD", "/start#new-to-dsd"], ["How to use this site", "/user-guide"]] },
  learn: { label: "Learn", home: "/learn", links: [["Learning", "/learn"], ["Library", "/library"], ["Courses", "/courses"], ["Themes and collections", "/collections"], ["Course collections", "/learn/collections"], ["Paths", "/learn/paths"], ["Listen", "/audio-library"]] },
  tools: { label: "Practice", home: "/practice", links: [["Guided practices", "/practice"], ["Equity Analysis Toolkit", "/learn/equity-toolkit"], ["Equity reviews", "/equity-review"], ["Tools", "/program/resources"]] },
  support: { label: "Support", home: "/support", links: [["Support", "/support"], ["Ask", "/ask"], ["Minnesota communities", "/minnesota-communities"]] },
  programs: { label: "One DSD", home: "/one-dsd", links: [["One DSD", "/one-dsd"], ["Programs and services", "/one-dsd/programs"], ["Planning and progress", "/one-dsd/planning"], ["Equity leadership and growth", "/one-dsd/leadership"], ["Understanding DHS", "/understanding-dhs"], ["About", "/about"]] },
  leading: { label: "For leaders, supervisors, managers, and directors", home: "/leading", links: [["What are you deciding?", "/leading"], ["Suggested paths", "/leading/paths"], ["Your leadership journey", "/leading/journey"], ["How this works", "/leading/how-this-works"]] },
  about: { label: "About the program", home: "/about", links: [["About", "/about"], ["How the program works", "/program/model"], ["Program charter", "/program-foundation"]] },
  consultant: { label: "Consultant workspace", home: "/consultant", links: [["Workspace", "/consultant"], ["My work", "/my-work"], ["Return to the program", "/home"]] },
} as const;
export type PageArea = keyof typeof PAGE_AREAS;
/**
 * The five main menu sections. My work and For leaders, supervisors, managers, and directors are header utilities; About lives in the footer and under One DSD.
 * Support stays in the menu. Ask is available in the banner and the Support row;
 * Themes and collections sits under Learn; Community Outreach and Engagement sits under Cultural Intelligence. */
export const PRIMARY_SECTIONS: ReadonlyArray<readonly [string, string, PageArea]> = [
  ["Start", "/start", "start"], ["Learn", "/learn", "learn"], ["Practice", "/practice", "tools"], ["Support", "/support", "support"], ["One DSD", "/one-dsd", "programs"],
];
export function pageArea(path: string): PageArea {
  if (/^\/consultant(?:\/|$)/.test(path)) return "consultant";
  if (/^\/leading(?:\/|$)/.test(path)) return "leading";
  if (/^\/(start|orientation|user-guide)(?:\/|$)/.test(path)) return "start";
  if (/^\/(one-dsd|administrations|understanding-dhs)(?:\/|$)/.test(path)) return "programs";
  if (/^\/(support|ask|minnesota-communities|employee-resource-groups|contribute)(?:\/|$)/.test(path)) return "support";
  if (/^\/learn\/equity-toolkit(?:\/|$)/.test(path) || /^\/(practice|practice-guides|toolkit-studio|equity-policy|equity-review|operationalizing-equity|my-work)(?:\/|$)/.test(path) || /^\/program\/(resources|practice|progress|impact)(?:\/|$)/.test(path)) return "tools";
  if (/^\/(learn|collections|courses|paths|journeys|resources|library|audio-library|podcasts)(?:\/|$)/.test(path)) return "learn";
  return "about";
}
export function internalPage(path: string) { return path !== "/" && path !== "/home"; }
