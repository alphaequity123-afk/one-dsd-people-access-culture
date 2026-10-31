export type CommunityPhoto = {
  src: string;
  alt: string;
  caption: string;
  credit: string;
  sourceHref: string;
  licenseLabel: string;
  licenseHref: string;
  cropNotice: string;
  width: number;
  height: number;
};

export type CommunityClaim = {
  text: string;
  citations: { label: string; href: string }[];
  photo?: CommunityPhoto;
};

export type CommunitySupplement = CommunityClaim & { heading: string };

export type CommunityAddition = {
  contributor: CommunityClaim;
  institution: CommunityClaim;
  resource: { label: string; href: string; description: string };
  practice: { question: string; guidance: string };
  supplements?: CommunitySupplement[];
};

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function https(value: unknown): value is string {
  if (!text(value) || /[\u0000-\u0020\\]/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !!url.hostname && !url.username && !url.password;
  } catch { return false; }
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function photo(value: unknown): value is CommunityPhoto {
  if (!record(value)) return false;
  // Content-addressed local paths limit media to release-reviewed files. Before
  // publishing, the release check must verify the file bytes, exact rights,
  // alt text and that the image actually depicts the associated claim.
  return typeof value.src === "string" && /^\/images\/community-collection\/[a-f0-9]{64}\.(?:jpg|jpeg|png|webp)$/.test(value.src) &&
    text(value.alt) && text(value.caption) && text(value.credit) && https(value.sourceHref) &&
    text(value.licenseLabel) && https(value.licenseHref) && text(value.cropNotice) &&
    Number.isInteger(value.width) && Number.isInteger(value.height) &&
    (value.width as number) > 0 && (value.width as number) <= 8192 &&
    (value.height as number) > 0 && (value.height as number) <= 8192;
}
function claim(value: unknown): value is CommunityClaim {
  return record(value) && text(value.text) && Array.isArray(value.citations) && value.citations.length > 0 &&
    value.citations.every(source => record(source) && text(source.label) && https(source.href)) &&
    (value.photo === undefined || photo(value.photo));
}
function supplement(value: unknown): value is CommunitySupplement {
  return record(value) && text(value.heading) && claim(value);
}

/** A schema check only. Editorial, rights and Tribal review require separate evidence. */
export function selectCommunityAddition(data: unknown, id: string): CommunityAddition | null {
  if (!record(data) || !record(data[id])) return null;
  const item = data[id];
  if (item.status !== "approved" || !text(item.reviewEvidence) || !claim(item.contributor) || !claim(item.institution)) return null;
  if (!record(item.resource) || !text(item.resource.label) || !https(item.resource.href) || !text(item.resource.description)) return null;
  if (!record(item.practice) || !text(item.practice.question) || !text(item.practice.guidance)) return null;
  if (item.supplements !== undefined && (!Array.isArray(item.supplements) || item.supplements.length > 24 || !item.supplements.every(supplement))) return null;
  return {
    contributor: item.contributor,
    institution: item.institution,
    resource: { label: item.resource.label, href: item.resource.href, description: item.resource.description },
    practice: { question: item.practice.question, guidance: item.practice.guidance },
    ...(item.supplements !== undefined ? { supplements: item.supplements as CommunitySupplement[] } : {}),
  };
}
