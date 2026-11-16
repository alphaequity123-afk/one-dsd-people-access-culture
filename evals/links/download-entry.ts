/**
 * The download adapters and the catalogs their ids come from, gathered into one module so the A10 eval
 * loads the application once (evals/links/load-app.ts). Nothing here changes the adapters.
 */
export { resolveDownloadDocument, SINGLETON_IDS, TOOLKIT_STUDIO_IDS } from "@/lib/downloads/resolve";
export { DOWNLOAD_KINDS } from "@/lib/downloads/catalog";
export { documentToPlainText } from "@/lib/downloads/exporters/text";
export { renderDocx } from "@/lib/downloads/exporters/docx";
export { elearningDownloadIds } from "@/lib/downloads/adapters/elearning";
export { selfDirectedCourseDocument } from "@/lib/downloads/adapters/self-directed";
export { COMMUNITY_OUTREACH_IDS } from "@/lib/downloads/adapters/hub-outreach";
export { extraPageIds } from "@/lib/downloads/adapters/hub-pages";
export { EQUITY_REVIEW_IDS } from "@/lib/downloads/adapters/hub-review";
export { AMPLIFY_PAGES } from "@/lib/content/amplify";
export { DSD_PROGRAMS, DSD_SCENARIOS } from "@/lib/dsd";
export { BRIEFS } from "@/lib/content/briefs";
export { DOMAINS } from "@/lib/domains";
export { GRADUATION_PATHS } from "@/lib/content/paths";
export { ORGANIZATIONS } from "@/lib/content/hub/organizations";
export { getPolicies } from "@/lib/content/hub/dsd-policies";
export { communityDesignEntries } from "@/lib/content/community-design";
export { staffCorpus } from "@/lib/content/staff-corpus";
