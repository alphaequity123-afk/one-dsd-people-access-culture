import type { ContentItem } from "./types";
import { PROGRAM } from "@/lib/constants";
import { programDocuments, originalDocumentHref, documentDownloadHref } from "@/lib/program/program-documents";

const reading: Record<string, string[]> = {
  "dhs-landscape": [
    "The report examines how learning, relationships, and intentions connect with the policies and structures that shape outcomes. It is intended to complement DHS equity work.",
    "The report asks where unequal burdens occur, who has authority to change them, which partners and resources are needed, what evidence will show progress, and how the organization will respond when improvement does not occur.",
    "Recommendations address decision responsibility, service journeys, access, workforce practices, procurement, participation, and sustained review. The proposed council, ninety-day pilot, and thirty-six-month roadmap are recommendations rather than adopted requirements.",
    "The report describes a resource platform as useful when staff can find trusted information, apply it, and reach human consultation when needed. It calls for clear content responsibility and evidence of usefulness beyond page views.",
    "Use the overview to connect these recommendations with a policy or service question.",
  ],
  "minnesota-government": [
    "This May 2026 research report describes statewide equity offices, agency responsibilities, councils, workforce structures, and public policy context.",
    "The report offers a wider context for DSD staff who need to understand which state offices hold different responsibilities. It should not be used as a current staff directory or a statement of current legal requirements.",
    "Source notes distinguish the report from current official information. Direct Care and Treatment separated from DHS on July 1, 2025; the report gives an earlier January date. The Department of Children, Youth, and Families launched in July 2024, with later transfers.",
    "The report discusses a federal legal challenge to Minnesota’s employment practices. A filed complaint establishes that a challenge was brought; it does not establish a court ruling or a change in staff obligations.",
    "Open the overview for report themes and primary-source notes. The full original report remains available with its May 2026 context preserved.",
  ],
};

/** User-authorized reference inclusion; this does not label a report as official policy. */
export const PROGRAM_DOCUMENTS: ContentItem[] = programDocuments.map(document => ({
  id: document.libraryId, title: document.title,
  type: "external_reference", authority: "program_reference", layer: "L4",
  summary: document.summary, whyItMatters: document.purpose,
  body: [document.context, ...reading[document.slug]],
  nextActions: [
    { label: "Explore the overview", href: document.href },
    { label: document.slug === "three-year-plan" ? "Read the plan" : "Read the report", href: originalDocumentHref(document) },
    { label: "Download the original text", href: documentDownloadHref(document) },
  ],
  tags: document.tags, intents: ["policy_orientation", "practice_method", "uncertainty_authority"],
  owner: "One DSD People, Access and Culture", reviewDate: "2026-10-04", status: "approved",
  scope: "dsd", accessibility: "pending", sourceName: document.title,
  provenance: `Owner supplied and authorized for integration October 4, 2026. ${document.dateLabel}. This date records integration review, not original publication or agency adoption.`,
  version: document.slug === "three-year-plan" ? "1.1" : "2026-10-04",
}));
