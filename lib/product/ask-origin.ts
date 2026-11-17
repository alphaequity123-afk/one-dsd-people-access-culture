import type { WorkOriginInput } from "./work-origin";
/** Carry only bounded identifiers, not staff questions or free text, to Ask. */
export function withLearningTrailForAsk(href: string, input: WorkOriginInput): string {
  if (!/^\/ask(?:\?|$)/.test(href)) return href;
  const url = new URL(href, "https://program.invalid");
  for (const key of ["learningPath", "learningFamily"] as const) {
    const raw = input[key]; const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
    if (value && /^[a-z0-9][a-z0-9-]{0,79}$/i.test(value)) url.searchParams.set(key, value);
  }
  return url.pathname + url.search + url.hash;
}
