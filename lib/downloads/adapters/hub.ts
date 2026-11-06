import "server-only";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import type { DownloadKind } from "../catalog";
import type { ResourceDocument } from "../model";

/** Downloadable copies of Community Outreach and Engagement pages and related public pages. */
export async function hubDocument(kind: DownloadKind, id: string, scope: StaffProgramScope): Promise<ResourceDocument | null> {
  switch (kind) {
    case "organization":
      return (await import("./hub-outreach")).organizationDocument(id, scope);
    case "policy":
      return (await import("./hub-outreach")).policyDocument(id, scope);
    case "community-outreach":
      return (await import("./hub-outreach")).communityOutreachDocument(id, scope);
    case "community":
      return (await import("./hub-community")).communityPageDocument(id, scope);
    case "equity-review":
      return (await import("./hub-review")).equityReviewDocument(id, scope);
    default:
      return null;
  }
}
