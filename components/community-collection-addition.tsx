import "server-only";
import { createHash } from "node:crypto";
import additions from "@/lib/content/community-collection-additions.json";
import { selectCommunityAddition, type CommunityClaim, type CommunityPhoto } from "@/lib/content/community-collection-additions-policy";
import { additionsNotInResearch, type CommunityResearch } from "@/lib/content/community-research-policy";
import { communityPagePublished } from "@/lib/content/cultural-intelligence-publication";
import { NATIVE_DEFERENCE_COMMUNITY_IDS } from "@/lib/content/community-presentation";

// Exact JSON.stringify pin for the independently reviewed 39-entry selection.
// Future data changes require renewed factual, rights and publication review.
// Re-pinned Nov. 1, 2026 after the Somali and Nigerian contributor claims were
// reworded to name the office rather than a sitting office holder.
// This binding does not replace the request-scoped publication checks below.
const REVIEWED_ADDITIONS_SHA256 = "3f6f0bfce7cf96d3ef5dad7c5fce85aad172accdfb9341fcbe71be3d5e74383b";

function Photo({ photo }: { photo: CommunityPhoto }) {
  return <figure className="my-4 max-w-xl">
    <img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" className="h-auto max-w-full" />
    <figcaption className="mt-2 text-sm leading-6">
      <span>{photo.caption} </span><span>Credit: {photo.credit}. </span>
      <a href={photo.sourceHref}>Image source</a>{" · "}<a href={photo.licenseHref}>{photo.licenseLabel}</a>
      <span> {photo.cropNotice}</span>
    </figcaption>
  </figure>;
}

function ClaimContent({ item }: { item: CommunityClaim }) {
  return <>
    <p>{item.text}</p>
    {item.photo && <Photo photo={item.photo} />}
    <p>Sources: {item.citations.map((source, index) => <span key={`${source.href}-${index}`}>{index > 0 ? "; " : ""}<a href={source.href}>{source.label}</a></span>)}</p>
  </>;
}

/** Optional addition; the existing brief and its editable surfaces remain intact. */
export async function CommunityCollectionAddition({ id, research = null }: { id: string; research?: CommunityResearch | null }) {
  const dataSha256 = createHash("sha256").update(JSON.stringify(additions)).digest("hex");
  if (dataSha256 !== REVIEWED_ADDITIONS_SHA256) return null;
  // Standing deference remains in force. Do not enable substantive additions
  // for these entries until the appropriate Tribal process is established.
  if ((NATIVE_DEFERENCE_COMMUNITY_IDS as readonly string[]).includes(id)) return null;
  const addition = selectCommunityAddition(additions, id);
  if (!addition) return null;
  if (!await communityPagePublished(id)) return null;
  // Anyone the full research set already covers is shown there, not here too.
  const shown = additionsNotInResearch(addition, research);
  const claims = [
    ...(shown.contributor ? [{ title: "A person to learn about", ...addition.contributor }] : []),
    ...(shown.institution ? [{ title: "An organization or institution", ...addition.institution }] : []),
  ];
  const hasStories = claims.length > 0 || shown.supplements.length > 0;
  return <section aria-labelledby="community-collection-addition-title">
    <h2 id="community-collection-addition-title">{hasStories ? "More to explore" : "Try it in your work"}</h2>
    {hasStories ? <p>These examples offer context. They do not describe any individual or represent every experience in a community.</p> : null}
    {claims.map(claim => <div key={claim.title}><h3>{claim.title}</h3><ClaimContent item={claim} /></div>)}
    {!!shown.supplements.length && <section aria-labelledby="community-more-stories-title">
      <h3 id="community-more-stories-title">More stories and context</h3>
      {shown.supplements.map((item, index) => <details key={`${item.heading}-${index}`} className="my-3 rounded-lg border border-line p-4">
        <summary className="cursor-pointer font-semibold">{item.heading}</summary>
        <div className="mt-3 space-y-3"><ClaimContent item={item} /></div>
      </details>)}
    </section>}
    {shown.resource ? <><h3>Community resource</h3><p>{addition.resource.description} <a href={addition.resource.href}>{addition.resource.label}</a></p></> : null}
    {hasStories ? <h3>Try it in your work</h3> : null}<p>{addition.practice.question}</p><details><summary>Consider a response</summary><p>{addition.practice.guidance}</p></details>
  </section>;
}
