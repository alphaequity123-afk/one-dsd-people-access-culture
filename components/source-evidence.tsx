import Link from "next/link";
import { registerReadingHref, sourcesForResource, type ResourceType } from "@/lib/content/source-register";

const REGISTER_PATH = "/learn/sources";

/** Sources behind a library item or reference entry, drawn from the register. */
export function ResourceEvidence({ resourceType, resourceId, heading = "Further reading" }: { resourceType: ResourceType | ResourceType[]; resourceId: string; heading?: string }) {
  const types = Array.isArray(resourceType) ? resourceType : [resourceType];
  const sources = types.flatMap(type => sourcesForResource(type, resourceId)).filter(source => source.kind === "external" && source.href);
  if (!sources.length) return null;
  return (
    <section className="source-evidence" aria-labelledby="source-evidence-title">
      <h2 id="source-evidence-title">{heading}</h2>
      <ul>
        {sources.map(source => (
          <li key={source.sourceId}>
            <Link href={registerReadingHref(source)}>{source.title}</Link>
          </li>
        ))}
      </ul>
      <p><Link href={REGISTER_PATH}>All research and sources across the program</Link></p>
    </section>
  );
}
