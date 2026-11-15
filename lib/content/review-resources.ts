import type { ContentItem } from "./types";
import { reviewResources, structuralReviewResource } from "@/lib/program/review-resources";

const structuralContent: ContentItem = {
  id: structuralReviewResource.id, title: structuralReviewResource.title, summary: structuralReviewResource.summary,
  type: "tool", authority: "guidance", layer: "L2",
  body: [
    "Examine a policy, service, or workplace process anywhere in DHS. Start with the pattern, map decision points, question requirements, identify decision rights, and consider how different experiences combine.",
    "Review the process history and evidence, including missing information. Plan a change with a responsible role, a review date, a measure, and a way to report back to affected people.",
    "Work independently or with colleagues. The Equity and Inclusion Operations Consultant leads the program and offers guidance and feedback. The role responsible for a process carries its decisions and follow-through.",
    "This interactive workspace provides optional saving on your device, downloadable reports, and a working copy you can reopen. Keep personal and confidential records out of the review. A completed record does not verify an equitable result.",
  ],
  nextActions: [{ label: "Open structural equity analysis", href: structuralReviewResource.href }, { label: "Explore related equity tools", href: "/equity-review" }],
  tags: ["structural equity", "equity analysis", "policy", "process", "barriers", "decision rights", "intersectionality", "evidence", "follow-through"],
  intents: ["practice_method", "policy_orientation", "next_actions", "access_barriers"],
  owner: "One DSD People, Access and Culture", reviewDate: "2026-10-05", status: "approved", scope: "agencywide", accessibility: "pending", version: "2026-10-05",
  provenance: "Adapted from the owner's supplied DSD Structural Analysis Tool HTML. The original is retained in the integration evidence.",
};

// Tool help stays inside the workspace; standalone instruction guides are not program destinations.
export const REVIEW_RESOURCES: ContentItem[] = reviewResources.filter(resource => ![
  "guide-one-dsd-policy-review", "guide-one-dsd-policy-facilitation", "guide-one-dsd-hcbs-review",
  "guide-one-dsd-hcbs-companion", "guide-one-dsd-hcbs-walkthrough",
].includes(resource.id)).map<ContentItem>(resource => ({
  id: resource.id, title: resource.title, summary: resource.summary,
  type: resource.kind, authority: "guidance", layer: resource.kind === "tool" ? "L2" : "L3",
  body: [resource.summary, "Staff throughout DHS can use these resources independently. The Equity and Inclusion Operations Consultant leads the program and offers guidance and feedback; staff and decision owners carry out their own work.", "These program resources support analysis and planning. They do not replace official policy, required consultation, or the authority of the person or area responsible."],
  nextActions: [{ label: resource.kind === "tool" ? "Open the workspace" : "Read the guide", href: resource.href }, { label: resource.kind === "tool" ? "Open the full-page tool" : "Download Word document", href: resource.file }],
  tags: ["equity analysis", "policy", "review", "planning", ...(resource.id.includes("hcbs") ? ["HCBS", "home and community-based services"] : []), ...(resource.id.includes("quarterly") || resource.id.includes("measures") ? ["reporting", "progress", "measures"] : [])],
  intents: ["practice_method", "policy_orientation", "next_actions"],
  owner: "One DSD People, Access and Culture", reviewDate: "2026-10-05", status: "approved", scope: "agencywide", accessibility: "pending", version: "2026-10-05",
  provenance: "Adapted from the owner-supplied complete source package. Original files retained separately.",
})).concat(structuralContent);
