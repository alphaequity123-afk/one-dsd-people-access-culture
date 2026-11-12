import type { Metadata } from "next";
import { ResourceCreationPanel } from "@/components/resource-creation-panel";
import { PageIntro } from "@/components/ui";
import { ownerPageGuard } from "@/lib/auth/owner-page";
import { localStudyHref } from "@/lib/client/resource-study-links";
import { resourceStudyAvailability } from "@/lib/intelligence/learning/resource-learning-assistant";

export const metadata: Metadata = { title: "Create from a resource" };
export const dynamic = "force-dynamic";

export default async function ResourceCreationPage({ searchParams }: {
  searchParams: Promise<{ resource?: string | string[] }>;
}) {
  if (!(await ownerPageGuard())) return null;
  const { resource } = await searchParams;
  const resourcePath = localStudyHref(resource) ? resource : "";
  const availability = resourcePath ? await resourceStudyAvailability(resourcePath) : undefined;
  return <>
    <PageIntro title="Create from a resource" lede="Choose a published resource and a format. Review your draft here before sharing it." />
    <ResourceCreationPanel resourcePath={resourcePath} resourceTitle={availability?.title} />
  </>;
}
