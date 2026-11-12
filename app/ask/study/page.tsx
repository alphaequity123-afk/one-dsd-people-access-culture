import type { Metadata } from "next";
import Link from "next/link";
import { ResourceLearningAssistant } from "@/components/resource-learning-assistant";
import { ResourceCreationLink } from "@/components/resource-creation-link";
import { PageIntro } from "@/components/ui";
import { ownerFromCookies } from "@/lib/auth/request";
import { localStudyHref, resourceStudyHref } from "@/lib/client/resource-study-links";
import { resourceStudyAvailability } from "@/lib/intelligence/learning/resource-learning-assistant";

export const metadata: Metadata = { title: "Study the readings" };

export default async function ResourceStudyPage({ searchParams }: {
  searchParams: Promise<{ resource?: string | string[] }>;
}) {
  const { resource } = await searchParams;
  const availability: { available: boolean; title?: string } = resource === undefined
    ? { available: Boolean(process.env.GEMINI_API_KEY?.trim()) }
    : localStudyHref(resource) && !resource.includes("#")
      ? await resourceStudyAvailability(resource)
      : { available: false };
  const resourcePath = availability.available && typeof resource === "string" ? resource : undefined;
  const canCreate = resourcePath && await ownerFromCookies();

  return <>
    <PageIntro title="Study the readings" lede={resourcePath ? availability.title ?? "Selected resource" : "Explore published resources with answers that cite their sources."}>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Link href="/ask">Back to Ask</Link>
        {resourcePath ? <Link href={resourcePath}>Back to resource</Link> : null}
        {canCreate ? <ResourceCreationLink resourcePath={resourcePath} /> : null}
        {resource !== undefined ? <Link href={resourceStudyHref()}>Study across the library</Link> : null}
      </div>
    </PageIntro>
    <div className="wrap pb-10">
      {availability.available
        ? <ResourceLearningAssistant key={resourcePath ?? "library"} resourcePath={resourcePath} embedded />
        : <p className="my-6" role="status">{resource === undefined
          ? "The learning assistant is unavailable right now."
          : "This resource is unavailable for study. You can search across the published library instead."}</p>}
    </div>
  </>;
}
