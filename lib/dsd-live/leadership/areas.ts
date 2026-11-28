/**
 * Web addresses for the leadership areas of practice. The internal ids keep their original values so
 * tags and stored records stay valid; people only ever see these plain names.
 */
const SLUGS: Record<string, string> = {
  "leading-self": "self-awareness-and-judgment",
  "leading-others": "developing-people",
  "leading-the-organization": "direction-and-priorities",
  "leading-outside-the-organization": "partners-and-communities",
  "getting-work-done": "planning-and-delivery",
  "leading-with-deai": "fair-access-and-inclusion",
};
const IDS = new Map(Object.entries(SLUGS).map(([id, slug]) => [slug, id]));

export const areaSlug = (id: string) => SLUGS[id] ?? id;
export const areaIdFromSlug = (slug: string) => IDS.get(slug) ?? slug;
/** Earlier addresses that now lead to the new ones. */
export const retiredAreaSlugs = () => Object.entries(SLUGS);
