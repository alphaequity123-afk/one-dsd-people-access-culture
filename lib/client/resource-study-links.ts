const localOrigin = "https://resource-study.invalid";

function hasUnsafeCharacter(value: string) {
  return [...value].some(character => {
    const code = character.charCodeAt(0);
    return character === "\\" || code < 32 || code === 127;
  });
}

/** The assistant links to published material on this site. Keep the resource's page and timestamp parameters. */
export function localStudyHref(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 1800 || !value.startsWith("/") || value.startsWith("//")
    || value.trim() !== value || hasUnsafeCharacter(value)) return false;
  try {
    const parsed = new URL(value, localOrigin);
    const decoded = decodeURIComponent(parsed.pathname);
    return parsed.origin === localOrigin && !decoded.startsWith("//") && !hasUnsafeCharacter(decodeURIComponent(value))
      && !decoded.split("/").some(segment => segment === "." || segment === "..");
  } catch {
    return false;
  }
}

/** Scope the lookup to resource areas. The server determines whether a particular page is eligible. */
export function mayStudyPage(path: string) {
  if (!localStudyHref(path)) return false;
  if (/^\/learn\/water-we-swim-in(?:\/module-[1-6])?\/?$/.test(path)) return false;
  if (path === "/equity-review/analyze") return false;
  return /^\/(about|administrations|areas|audio|audio-library|collections|community-outreach|courses|data|domains|employee-resource-groups|equity-framework|equity-policy|equity-review|explore|growth|leading|learn|library|minnesota-agencies|minnesota-communities|operationalizing-equity|paths|podcasts|practice|practice-guides|program|program-foundation|resources|team-kits|understanding-dhs|user-guide)(?:\/|$)/.test(path)
    || /^\/one-dsd\/(evidence|leadership|programs|scenarios)(?:\/|$)/.test(path);
}

export function resourceStudyHref(resourcePath?: string) {
  return resourcePath ? "/ask/study?" + new URLSearchParams({ resource: resourcePath }) : "/ask/study";
}
