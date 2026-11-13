
import { SourceLink } from "@/components/app-link";
import Link from "@/components/app-link";
import type { ReactNode } from "react";
import type {
  CommunityResearch,
  MinnesotaAccess,
  ResearchContext,
  ResearchDirectoryEntry,
  ResearchInstitution,
  ResearchPerson,
  ResearchPhoto,
  ResearchRoute,
  ResearchSource,
} from "@/lib/content/community-research-policy";
import "./community-research-sections.css";

function slug(value: string) {
  return value.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function Photo({ photo, caption }: { photo: ResearchPhoto; caption?: string }) {
  return <figure className="community-research-figure">
    <img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" />
    <figcaption>{caption ? <span>{caption} </span> : null}<span>{photo.credit}. </span><span>{photo.rights}. </span><SourceLink href={photo.sourceHref}>Image source</SourceLink></figcaption>
  </figure>;
}

function Sources({ sources }: { sources: ResearchSource[] }) {
  return <p className="community-research-sources">Sources: {sources.map((source, index) => <span key={`${source.href}-${index}`}>{index > 0 ? "; " : ""}<SourceLink href={source.href}>{source.label}</SourceLink></span>)}</p>;
}

function Story({ item }: { item: Pick<ResearchPerson, "body" | "keyFacts" | "connectToWork" | "sources" | "photo"> }) {
  return <div className={item.photo ? "community-research-story" : undefined}>
    {item.photo ? <Photo photo={item.photo} /> : null}
    <div>
      {item.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      {item.keyFacts?.length ? <><p className="community-research-label">Key dates and facts</p><ul>{item.keyFacts.map((fact, index) => <li key={index}>{fact}</li>)}</ul></> : null}
      <div className="community-research-connect"><p className="community-research-label">Connect this to your work</p><p>{item.connectToWork}</p></div>
      <Sources sources={item.sources} />
    </div>
  </div>;
}

export function Disclosure({ title, detail, level, open = false, id, children }: { title: string; detail?: string; level: 3 | 4; open?: boolean; id?: string; children: ReactNode }) {
  const Heading = level === 3 ? "h3" : "h4";
  return <details id={id} open={open} className="community-research-disclosure">
    <summary><Heading>{title}</Heading>{detail ? <span>{detail}</span> : null}</summary>
    <div>{children}</div>
  </details>;
}

function People({ people }: { people: ResearchPerson[] }) {
  const groups = [
    { title: "Minnesota connections", items: people.filter(person => person.connection !== "beyond") },
    { title: "Beyond Minnesota", items: people.filter(person => person.connection === "beyond") },
  ].filter(group => group.items.length > 0);
  return <section id="research-people" aria-labelledby="research-people-title">
    <h2 id="research-people-title">People and contributions</h2>
    <p>These stories offer context. They do not describe any individual or represent every experience in a community.</p>
    {groups.map((group, groupIndex) => <div key={group.title}>
      <h3>{group.title}</h3>
      {group.items.map((person, index) => <Disclosure key={person.name} level={4} title={person.name} detail={`${person.dates} · ${person.field}`} open={groupIndex === 0 && index === 0}><Story item={person} /></Disclosure>)}
    </div>)}
  </section>;
}

function Institutions({ institutions }: { institutions: ResearchInstitution[] }) {
  return <section id="research-institutions" aria-labelledby="research-institutions-title">
    <h2 id="research-institutions-title">Institutions and history</h2>
    {institutions.map(item => <Disclosure key={item.name} id={`research-institution-${slug(item.name)}`} level={3} title={item.name} detail={[item.dates, item.type, item.location].filter(Boolean).join(" · ")}><Story item={item} /></Disclosure>)}
  </section>;
}

function Routes({ routes }: { routes: ResearchRoute[] }) {
  return <ul className="community-research-list">{routes.map(route => <li key={route.name}><SourceLink href={route.href}>{route.name}</SourceLink><p>{route.purpose}</p></li>)}</ul>;
}

function ContextBlock({ context }: { context: ResearchContext }) {
  return <Disclosure level={3} title={context.heading}>
    {context.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    <Sources sources={context.sources} />
  </Disclosure>;
}

function Disability({ research, access }: { research: CommunityResearch; access: MinnesotaAccess | null }) {
  const { disability } = research;
  return <section id="research-disability" aria-labelledby="research-disability-title">
    <h2 id="research-disability-title">Disability and access</h2>
    <p>{disability.intro}</p>
    <h3>Questions to ask the person</h3>
    <ul>{disability.questions.map((question, index) => <li key={index}>{question}</li>)}</ul>
    {access ? <><ContextBlock context={access.whoDefines} /><ContextBlock context={access.whatTheLabelUnlocks} /></> : null}
    {disability.context.map(context => <ContextBlock key={context.heading} context={context} />)}
    {access || disability.communityRoutes?.length ? <Disclosure level={3} title="Access routes in Minnesota">
      {disability.communityRoutes?.length ? <Routes routes={disability.communityRoutes} /> : null}
      {access ? <Routes routes={access.routes} /> : null}
      <p>Check current services and eligibility with the office or organization before making a connection.</p>
    </Disclosure> : null}
  </section>;
}

function DirectoryGroup({ title, entries, pointers, open }: { title: string; entries: ResearchDirectoryEntry[]; pointers: ResearchInstitution[]; open: boolean }) {
  return <Disclosure level={3} title={title} open={open}>
    <ul className="community-research-list">{entries.map(entry => <li key={entry.name}>
      <SourceLink href={entry.href}>{entry.linkLabel ?? entry.name}</SourceLink>
      {entry.linkLabel ? <p className="community-research-entry-name">{entry.name}</p> : null}
      <p className="community-research-meta">{entry.type} · {entry.location}</p>
      <p>{entry.purpose}</p>
    </li>)}</ul>
    {pointers.length ? <p>Also see {pointers.map((item, index) => <span key={item.name}>{index > 0 ? ", " : ""}<SourceLink href={`#research-institution-${slug(item.name)}`}>{item.name}</SourceLink></span>)} under Institutions and history.</p> : null}
  </Disclosure>;
}

function Directory({ research }: { research: CommunityResearch }) {
  const { entries, intro, sources } = research.organizations;
  const groups = [
    { title: "Minnesota organizations", kind: "organization", scope: "minnesota" },
    { title: "Minnesota media", kind: "media", scope: "minnesota" },
    { title: "National organizations", kind: "organization", scope: "national" },
    { title: "National media", kind: "media", scope: "national" },
  ] as const;
  return <section id="research-organizations" aria-labelledby="research-organizations-title">
    <h2 id="research-organizations-title">Organizations and media</h2>
    <p>{intro}</p>
    <p>These are starting points for learning. Check current services and eligibility with the organization before making a connection.</p>
    <Sources sources={sources} />
    {groups.map((group, index) => {
      const items = entries.filter(entry => entry.kind === group.kind && entry.scope === group.scope);
      const pointers = group.scope === "minnesota" ? research.institutions.filter(item => item.alsoListedAs === group.kind) : [];
      return items.length || pointers.length ? <DirectoryGroup key={group.title} title={group.title} entries={items} pointers={pointers} open={index === 0} /> : null;
    })}
  </section>;
}

function About({ research }: { research: CommunityResearch }) {
  return <section id="research-about" aria-labelledby="research-about-title">
    <h2 id="research-about-title">About this page</h2>
    <p>Prepared for One DHS and One DSD People, Access and Culture from the sources listed in each section.</p>
    <p>This page gives context for preparing questions and changing systems. It is not evidence about any individual in planning, eligibility or investigation.</p>
    <p>To send a correction, use <Link href="/support/right-person">Find the right person</Link> and name this page and what needs to change.</p>
    <Disclosure level={3} title="Main sources for this page"><ul>{research.about.sources.map(source => <li key={source.href}><SourceLink href={source.href}>{source.label}</SourceLink></li>)}</ul></Disclosure>
  </section>;
}

/** Full research set for one community, rendered beneath the existing page content. */
export function CommunityResearchSections({ research, access }: { research: CommunityResearch; access: MinnesotaAccess | null }) {
  return <div className="community-research">
    {research.communityImage ? <Photo photo={research.communityImage} caption={research.communityImage.caption} /> : null}
    <nav className="community-reading-contents" aria-label="More on this community">
      {research.people.length ? <SourceLink href="#research-people">People and contributions</SourceLink> : null}
      {research.institutions.length ? <SourceLink href="#research-institutions">Institutions and history</SourceLink> : null}
      <SourceLink href="#research-disability">Disability and access</SourceLink>
      <SourceLink href="#research-organizations">Organizations and media</SourceLink>
      <SourceLink href="#research-about">About this page</SourceLink>
    </nav>
    {research.people.length ? <People people={research.people} /> : null}
    {research.institutions.length ? <Institutions institutions={research.institutions} /> : null}
    <Disability research={research} access={access} />
    <Directory research={research} />
    <About research={research} />
  </div>;
}
