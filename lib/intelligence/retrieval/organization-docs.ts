import "server-only";
import { createHash } from "node:crypto";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { ORGANIZATIONS, ORGANIZATIONS_CHECKED, organizationHref, relationshipLine } from "@/lib/content/hub/organizations";
import type { Doc } from "./search";

// Organizations connected with the Disability Services Division, as Ask
// documents. Each one cites its own page, which lists the public records.
export function organizationDocs(scope: StaffProgramScope): Doc[] {
  return ORGANIZATIONS.map(org => {
    const relationships = org.withTheDivision.map(rel =>
      `${relationshipLine(rel)}${rel.departmentWide ? " (the record names the Department of Human Services, not the Disability Services Division)" : ""}: ${rel.what}`);
    const text = [
      `${org.name}${org.alsoKnownAs ? ` (also known as ${org.alsoKnownAs})` : ""}. ${org.kind}.${org.closed ? " This organization has closed." : ""}`,
      org.summary,
      `Who it serves: ${org.whoItServes}`,
      `Where it works: ${org.whereItWorks}`,
      `Connection with the Disability Services Division: ${relationships.join(" ")}`,
      `When staff might connect: ${org.whyItMattersForStaff}`,
      org.contact.website ? `Website: ${org.contact.website}` : "",
    ].filter(Boolean).join("\n");
    return {
      kind: "content", id: `public-community-organization-${org.slug}`, title: `${org.name}: organization connected with the Disability Services Division`,
      href: organizationHref(org.slug), authority: "program_reference", type: "community_organization", status: "approved",
      reviewDate: ORGANIZATIONS_CHECKED, scope: "dsd", summary: org.summary, text,
      tags: ["community outreach", "community engagement", "organization", ...org.relationshipTypes.map(t => t.toLowerCase()), ...org.communities],
      intents: [], graphRelated: ["/community-outreach/organizations", ...org.communities.map(id => `/minnesota-communities/${id}`)],
      evidenceRevisions: [{ sourceId: `community-organization:${org.slug}`, revisionId: null, payloadHash: createHash("sha256").update(text).digest("hex"), scope }],
    } satisfies Doc;
  });
}
