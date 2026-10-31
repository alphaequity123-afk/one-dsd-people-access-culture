// Schema and staff-language policy for the full community research set. This file
// has no application imports, so scripts/content/check-community-research.mjs can
// run the same rules directly under Node.

export type ResearchSource = { label: string; href: string };

export type ResearchPhoto = {
  src: string;
  alt: string;
  credit: string;
  sourceHref: string;
  rights: string;
  width: number;
  height: number;
};

export type ResearchPerson = {
  name: string;
  aliases?: string[];
  dates: string;
  field: string;
  connection: "minnesota" | "both" | "beyond";
  body: string[];
  keyFacts?: string[];
  connectToWork: string;
  sources: ResearchSource[];
  photo?: ResearchPhoto;
};

export type ResearchInstitution = {
  name: string;
  aliases?: string[];
  dates?: string;
  type: string;
  location: string;
  body: string[];
  keyFacts?: string[];
  connectToWork: string;
  sources: ResearchSource[];
  photo?: ResearchPhoto;
  /** Shows a pointer, not a second entry, in the organizations and media lists. */
  alsoListedAs?: "organization" | "media";
};

export type ResearchContext = { heading: string; body: string[]; sources: ResearchSource[] };

export type ResearchRoute = { name: string; purpose: string; href: string; checked: string };

export type ResearchDisability = {
  intro: string;
  questions: string[];
  context: ResearchContext[];
  /** Routes specific to this community. The statewide routes are shared. */
  communityRoutes?: ResearchRoute[];
};

export type ResearchDirectoryEntry = {
  name: string;
  aliases?: string[];
  kind: "organization" | "media";
  scope: "minnesota" | "national";
  type: string;
  location: string;
  purpose: string;
  href: string;
  /** Required when the link is a reference about the entry, not its own website. */
  linkLabel?: string;
  checked: string;
};

export type CommunityResearch = {
  communityId: string;
  communityImage?: ResearchPhoto & { caption: string };
  people: ResearchPerson[];
  institutions: ResearchInstitution[];
  disability: ResearchDisability;
  organizations: { intro: string; sources: ResearchSource[]; entries: ResearchDirectoryEntry[] };
  about: { lastChecked: string; sources: ResearchSource[] };
};

export type MinnesotaAccess = {
  checked: string;
  whoDefines: ResearchContext;
  whatTheLabelUnlocks: ResearchContext;
  routes: ResearchRoute[];
};

/** Standing deference: these pages never receive research content. */
export const RESEARCH_EXCLUDED_COMMUNITY_IDS = ["native-american", "tribal-nations", "alaska-native"] as const;

const WIKI_LIKE = /wiki|fandom\.com|kiddle\.co|dbpedia|infogalactic/i;

// Staff text must not carry research machinery, any mention of outside review,
// or group-trait claims. Failing closed here keeps a draft from reaching staff.
const STAFF_TEXT_RULES: Array<[RegExp, string]> = [
  [/\b(?:editor'?s notes?|verification status|this pass|second pass|third pass|fourth pass|final round|search results?|not opened|not fetched|re-?opened|search budget|fact-?check|research gap|unverified|TODO)\b/i, "research scaffolding"],
  // Parenthetical or ISO only: "The center opened June 1, 1975" is ordinary history.
  [/\(\s*(?:last\s+|page\s+)?opened\b[^)]*\)|\bopened\s+(?:on\s+)?\d{4}-\d{2}-\d{2}\b/i, "research scaffolding"],
  [/\b(?:confirm with the owner|to be confirmed|needs? confirming)\b/i, "unresolved item"],
  [/\b(?:community review|community approval|community-approved|outside review|independently reviewed|reviewed by the community|endorse[sdr]?|endorsements?)\b/i, "reference to outside review or endorsement"],
  [/\b(?:community|paid|compensated|disabled|lived[- ]experience) (?:reviewers?|advisors?|advisers?)\b|\bco-?designers?\b|\bco-?design partners?\b|\bcommunity advice\b/i, "participant role label"],
  [/\b(?:still being prepared|under review|in review|pending review|not yet (?:included|reviewed|verified|published|approved))\b/i, "status language"],
  [/\bAI\b|\bartificial intelligence\b|\bnarrator\b/, "machinery wording"],
  [/\b(?:Hofstede|GLOBE|Schwartz|power distance|cultural competence)\b/i, "methods vocabulary"],
  [/\b(?:this|the) community (?:believes?|values?|prefers?|tends?|thinks?|sees?)\b/i, "group-trait claim"],
  [/\bcommunity value\b|\bstrong tradition of\b|\bcultural trait\b/i, "group-trait claim"],
  [/\bmany [A-Z][\w-]*(?: [A-Z][\w-]*)? (?:families|parents|people|elders|patients|Minnesotans|residents) (?:see|believe|value|prefer|take|feel|approach|place|turn)\b/, "group-trait claim"],
  [/\b(?:believes? disability|disability is seen as|views? disability as)\b/i, "group-trait claim about disability"],
];

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
function https(value: unknown): value is string {
  if (!text(value) || /[\u0000- \\]/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !!url.hostname && !url.username && !url.password;
  } catch { return false; }
}

class Collector {
  errors: string[] = [];
  add(path: string, message: string) { this.errors.push(`${path}: ${message}`); }
  staff(path: string, value: unknown) {
    if (!text(value)) return this.add(path, "must be non-empty text");
    if (/<\/?[a-z][^>]*>|\]\(https?:/i.test(value)) this.add(path, "must be plain text, without markup");
    for (const [rule, label] of STAFF_TEXT_RULES) if (rule.test(value)) this.add(path, `${label}: "${value.match(rule)?.[0]}"`);
  }
  link(path: string, value: unknown) {
    if (!https(value)) return this.add(path, "must be an HTTPS link");
    if (WIKI_LIKE.test(value)) this.add(path, "wiki sources and links are not allowed");
  }
  paragraphs(path: string, value: unknown) {
    if (!Array.isArray(value) || value.length === 0) return this.add(path, "must have at least one paragraph");
    value.forEach((item, index) => this.staff(`${path}[${index}]`, item));
  }
  optionalList(path: string, value: unknown) {
    if (value === undefined) return;
    if (!Array.isArray(value)) return this.add(path, "must be a list");
    value.forEach((item, index) => this.staff(`${path}[${index}]`, item));
  }
  sources(path: string, value: unknown) {
    if (!Array.isArray(value) || value.length === 0) return this.add(path, "must have at least one source");
    value.forEach((item, index) => {
      if (!record(item)) return this.add(`${path}[${index}]`, "must be a source");
      this.staff(`${path}[${index}].label`, item.label);
      this.link(`${path}[${index}].href`, item.href);
    });
  }
  photo(path: string, value: unknown) {
    if (value === undefined) return;
    if (!record(value)) return this.add(path, "must be a photo");
    if (typeof value.src !== "string" || !/^\/images\/community-collection\/[a-f0-9]{64}\.(?:jpg|jpeg|png|webp)$/.test(value.src)) this.add(`${path}.src`, "must be a content-addressed local image");
    this.staff(`${path}.alt`, value.alt);
    this.staff(`${path}.credit`, value.credit);
    this.staff(`${path}.rights`, value.rights);
    this.link(`${path}.sourceHref`, value.sourceHref);
    if (!Number.isInteger(value.width) || (value.width as number) < 1 || (value.width as number) > 480) this.add(`${path}.width`, "must be at most 480");
    if (!Number.isInteger(value.height) || (value.height as number) < 1 || (value.height as number) > 2400) this.add(`${path}.height`, "must be a whole number");
  }
  route(path: string, value: unknown) {
    if (!record(value)) return this.add(path, "must be a route");
    this.staff(`${path}.name`, value.name);
    this.staff(`${path}.purpose`, value.purpose);
    this.link(`${path}.href`, value.href);
    if (!isoDate(value.checked)) this.add(`${path}.checked`, "must be YYYY-MM-DD");
  }
  context(path: string, value: unknown) {
    if (!record(value)) return this.add(path, "must be a context block");
    this.staff(`${path}.heading`, value.heading);
    this.paragraphs(`${path}.body`, value.body);
    this.sources(`${path}.sources`, value.sources);
  }
}

/** Every problem found in one community file. An empty list means it may render. */
export function communityResearchProblems(data: unknown, id: string): string[] {
  const c = new Collector();
  if ((RESEARCH_EXCLUDED_COMMUNITY_IDS as readonly string[]).includes(id)) return [`${id}: standing deference, research content is not allowed`];
  if (!record(data)) return [`${id}: not a record`];
  if (data.communityId !== id) c.add("communityId", `must equal ${id}`);
  if ("draftNotes" in data) c.add("draftNotes", "remove draft notes before publishing");
  if (data.communityImage !== undefined) {
    c.photo("communityImage", data.communityImage);
    if (record(data.communityImage)) c.staff("communityImage.caption", data.communityImage.caption);
  }
  if (!Array.isArray(data.people)) c.add("people", "must be a list");
  else data.people.forEach((person, index) => {
    const path = `people[${index}]`;
    if (!record(person)) return c.add(path, "must be a person");
    c.staff(`${path}.name`, person.name);
    c.staff(`${path}.dates`, person.dates);
    c.staff(`${path}.field`, person.field);
    if (!["minnesota", "both", "beyond"].includes(person.connection as string)) c.add(`${path}.connection`, "must be minnesota, both or beyond");
    c.paragraphs(`${path}.body`, person.body);
    c.optionalList(`${path}.keyFacts`, person.keyFacts);
    c.optionalList(`${path}.aliases`, person.aliases);
    c.staff(`${path}.connectToWork`, person.connectToWork);
    c.sources(`${path}.sources`, person.sources);
    c.photo(`${path}.photo`, person.photo);
  });
  if (!Array.isArray(data.institutions)) c.add("institutions", "must be a list");
  else data.institutions.forEach((item, index) => {
    const path = `institutions[${index}]`;
    if (!record(item)) return c.add(path, "must be an institution");
    c.staff(`${path}.name`, item.name);
    c.staff(`${path}.type`, item.type);
    c.staff(`${path}.location`, item.location);
    if (item.dates !== undefined) c.staff(`${path}.dates`, item.dates);
    if (item.alsoListedAs !== undefined && !["organization", "media"].includes(item.alsoListedAs as string)) c.add(`${path}.alsoListedAs`, "must be organization or media");
    c.paragraphs(`${path}.body`, item.body);
    c.optionalList(`${path}.keyFacts`, item.keyFacts);
    c.optionalList(`${path}.aliases`, item.aliases);
    c.staff(`${path}.connectToWork`, item.connectToWork);
    c.sources(`${path}.sources`, item.sources);
    c.photo(`${path}.photo`, item.photo);
  });
  if (!record(data.disability)) c.add("disability", "must be a record");
  else {
    c.staff("disability.intro", data.disability.intro);
    c.paragraphs("disability.questions", data.disability.questions);
    if (Array.isArray(data.disability.questions) && !data.disability.questions.every(item => typeof item === "string" && /\?/.test(item))) c.add("disability.questions", "each item must be a question");
    if (!Array.isArray(data.disability.context) || data.disability.context.length === 0) c.add("disability.context", "must have verified context");
    else data.disability.context.forEach((item, index) => c.context(`disability.context[${index}]`, item));
    if (data.disability.communityRoutes !== undefined) {
      if (!Array.isArray(data.disability.communityRoutes)) c.add("disability.communityRoutes", "must be a list");
      else data.disability.communityRoutes.forEach((item, index) => c.route(`disability.communityRoutes[${index}]`, item));
    }
  }
  if (!record(data.organizations)) c.add("organizations", "must be a record");
  else {
    c.staff("organizations.intro", data.organizations.intro);
    c.sources("organizations.sources", data.organizations.sources);
    if (!Array.isArray(data.organizations.entries)) c.add("organizations.entries", "must be a list");
    else data.organizations.entries.forEach((item, index) => {
      const path = `organizations.entries[${index}]`;
      if (!record(item)) return c.add(path, "must be an entry");
      c.staff(`${path}.name`, item.name);
      c.staff(`${path}.type`, item.type);
      c.staff(`${path}.location`, item.location);
      c.staff(`${path}.purpose`, item.purpose);
      c.link(`${path}.href`, item.href);
      c.optionalList(`${path}.aliases`, item.aliases);
      if (item.linkLabel !== undefined) c.staff(`${path}.linkLabel`, item.linkLabel);
      if (!["organization", "media"].includes(item.kind as string)) c.add(`${path}.kind`, "must be organization or media");
      if (!["minnesota", "national"].includes(item.scope as string)) c.add(`${path}.scope`, "must be minnesota or national");
      if (!isoDate(item.checked)) c.add(`${path}.checked`, "must be YYYY-MM-DD");
    });
  }
  if (!record(data.about)) c.add("about", "must be a record");
  else {
    if (!isoDate(data.about.lastChecked)) c.add("about.lastChecked", "must be YYYY-MM-DD");
    c.sources("about.sources", data.about.sources);
  }
  if (c.errors.length === 0) {
    const seen = new Map<string, string>();
    const research = data as unknown as CommunityResearch;
    const named: Array<[string, string]> = [
      ...research.people.map(item => [item.name, "people"] as [string, string]),
      ...research.institutions.map(item => [item.name, "institutions"] as [string, string]),
      ...research.organizations.entries.map(item => [item.name, "organizations"] as [string, string]),
    ];
    for (const [name, where] of named) {
      const key = normalizeName(name);
      if (seen.has(key)) c.add(where, `"${name}" also appears in ${seen.get(key)}; show each person or institution once`);
      seen.set(key, where);
    }
  }
  return c.errors;
}

/** Schema check for rendering. Accuracy and photo identity are checked at conversion. */
export function selectCommunityResearch(data: unknown, id: string): CommunityResearch | null {
  return communityResearchProblems(data, id).length === 0 ? data as CommunityResearch : null;
}

export function minnesotaAccessProblems(data: unknown): string[] {
  const c = new Collector();
  if (!record(data)) return ["minnesota access: not a record"];
  if (!isoDate(data.checked)) c.add("checked", "must be YYYY-MM-DD");
  c.context("whoDefines", data.whoDefines);
  c.context("whatTheLabelUnlocks", data.whatTheLabelUnlocks);
  if (!Array.isArray(data.routes) || data.routes.length === 0) c.add("routes", "must have routes");
  else data.routes.forEach((item, index) => c.route(`routes[${index}]`, item));
  return c.errors;
}

export function normalizeName(value: string): string {
  return value.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** All names under which this research already shows a person or institution. */
export function researchNames(research: CommunityResearch): string[] {
  const entries = [...research.people, ...research.institutions, ...research.organizations.entries];
  return entries.flatMap(item => [item.name, ...(item.aliases ?? [])]).map(normalizeName).filter(name => name.length > 3);
}

function firstSentence(value: string): string {
  return value.split(/(?<=[a-z)]\.)\s/)[0] ?? value;
}

export function namedInResearch(names: readonly string[], probe: string): boolean {
  const normalized = ` ${normalizeName(probe)} `;
  return names.some(name => normalized.includes(` ${name} `));
}

/**
 * Removes additions that the research set now covers, so nobody appears twice.
 * The existing additions stay in place for every community without research.
 */
export function additionsNotInResearch<S extends { heading: string }>(addition: {
  contributor: { text: string };
  institution: { text: string };
  resource: { label: string };
  supplements?: S[];
}, research: CommunityResearch | null) {
  if (!research) return { contributor: true, institution: true, resource: true, supplements: addition.supplements ?? [] };
  const names = researchNames(research);
  return {
    contributor: !namedInResearch(names, firstSentence(addition.contributor.text)),
    institution: !namedInResearch(names, firstSentence(addition.institution.text)),
    resource: !namedInResearch(names, addition.resource.label),
    supplements: (addition.supplements ?? []).filter(item => !namedInResearch(names, item.heading)),
  };
}
