/** The reader's job family: chosen once, kept in a cookie, used to order resources and provide tentative context for Ask. */
import { JOB_FAMILY_IDS, type JobFamilyId } from "./matrix";

export const FAMILY_COOKIE = "job-family";

export function parseFamily(value: string | null | undefined): JobFamilyId | null {
  return value && (JOB_FAMILY_IDS as string[]).includes(value) ? (value as JobFamilyId) : null;
}

/** The family from a raw Cookie header, for route handlers that read the request directly. */
export function familyFromCookieHeader(header: string | null): JobFamilyId | null {
  const match = header?.match(new RegExp(`(?:^|;\\s*)${FAMILY_COOKIE}=([^;]+)`));
  try { return parseFamily(match ? decodeURIComponent(match[1]) : null); }
  catch { return null; }
}
