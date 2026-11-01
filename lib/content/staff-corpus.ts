import { ENGAGEMENT_RESOURCES } from "./engagement-resources";
import { CORPUS } from "./corpus";
import { DOMAIN_CORPUS } from "./corpus-domains";
import { PROGRAM_DOCUMENTS } from "./program-documents";
import { POLICY_PRESENTATION_RESOURCE } from "./policy-presentation";
import { REVIEW_RESOURCES } from "./review-resources";
import { SUPERVISOR_JOB_AIDS } from "./supervisor-job-aids";
import type { ContentItem } from "./types";

/** Approved static collections; keep the frozen 25-resource seed source intact. */
export function staffCorpus(): ContentItem[] {
  return [...CORPUS, ...DOMAIN_CORPUS, ...PROGRAM_DOCUMENTS, POLICY_PRESENTATION_RESOURCE, ...REVIEW_RESOURCES, ...ENGAGEMENT_RESOURCES, ...SUPERVISOR_JOB_AIDS].filter(item => item.status === "approved");
}

/** Lookup across both approved collections; publication checks remain with the staff reader. */
export function getContent(id: string): ContentItem | undefined {
  return staffCorpus().find(item => item.id === id);
}
