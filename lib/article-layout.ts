/**
 * Reading pages: one readable column. Hub pages (home, section landings, lists and directories) keep their grids.
 * Each pattern matches a detail page that people read from start to finish.
 */
export const ARTICLE_PATTERNS: readonly string[] = [
  "^/learn/readings/reading-[^/]+$",
  "^/minnesota-communities/(?!calendar(?:/|$))[^/]+(?:/[^/]+)?$",
  "^/learn/water-we-swim-in(?:/.*)?$",
  "^/practice-guides/[^/]+$",
  "^/courses/[^/]+(?:/[^/]+)?$",
  "^/learn/clas/curriculum/[^/]+(?:/job-aid)?$",
  "^/learn/equity-toolkit/curriculum/[^/]+$",
  "^/learn/intercultural/curriculum/[^/]+$",
  "^/learn/leadership-styles/[^/]+$",
  "^/library/[^/]+$",
  "^/resources/[^/]+$",
  "^/podcasts/[^/]+$",
  "^/source-reading/[^/]+$",
  "^/one-dsd/(?:scenarios|programs)/[^/]+$",
  "^/one-dsd/evidence/source/[^/]+$",
  "^/community-outreach/(?:policies|organizations)/[^/]+$",
  "^/leading/(?!paths$)[^/]+$",
  "^/leading/paths/[^/]+$",
  "^/paths/[^/]+$",
  "^/program/[^/]+$",
  "^/support/directory/[^/]+$",
  "^/administrations/[^/]+$",
  "^/minnesota-agencies/[^/]+$",
  "^/(?:about|program-foundation|operationalizing-equity|understanding-dhs|user-guide)$",
];

const ARTICLE_RE = new RegExp(ARTICLE_PATTERNS.join("|"));

export function isArticlePath(pathname: string) {
  return ARTICLE_RE.test(pathname.replace(/\/+$/, "") || "/");
}

export const ARTICLE_LAYOUT_SCRIPT =
  `(function(){try{var r=new RegExp(${JSON.stringify(ARTICLE_PATTERNS.join("|"))});var p=location.pathname.replace(/\\/+$/,"")||"/";if(r.test(p))document.documentElement.setAttribute("data-layout","article");}catch(e){}})();`;
