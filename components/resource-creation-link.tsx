import Link from "next/link";

export function ResourceCreationLink({ resourcePath, className }: { resourcePath?: string; className?: string }) {
  const query = resourcePath ? "?" + new URLSearchParams({ resource: resourcePath }) : "";
  return <Link href={`/consultant/resource-creation${query}`} className={className} prefetch={false}>
    {resourcePath ? "Create from this resource" : "Create from a resource"}
  </Link>;
}
