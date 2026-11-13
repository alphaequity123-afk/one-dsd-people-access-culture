import { DsdInventoryMap } from "@/components/multimedia/dsd-inventory-map";
import styles from "@/components/dsd-experience.module.css";
import type { Metadata } from "next";
import { loadDsdInventory } from "@/lib/dsd/published";
import Link from "next/link";
import { OneDsdContextPanel } from "@/components/program-context";
import { PageIntro } from "@/components/ui";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { linkListValue, stringListValue, stringValue } from "@/lib/content/staff-surface-registry";

export const metadata: Metadata = { title: "One DSD" };

const PROGRAM_DOORS = [
  {
    title: "Understand and learn",
    description: "Build from a welcoming introduction through intercultural practice, structural analysis, and lasting change.",
    href: "/learn",
    label: "Explore learning",
  },
  {
    title: "Apply the work",
    description: "Use questions, checklists, reviews, and working tools to shape a program, policy, service, meeting, or workforce decision.",
    href: "/practice",
    label: "Open Practice",
  },
  {
    title: "Prepare with community context",
    description: "Use reviewed, question-led material to plan access and engagement without treating group information as a label for a person.",
    href: "/minnesota-communities",
    label: "Explore Minnesota Communities",
  },
  {
    title: "Find support",
    description: "Work independently when that is enough, or identify the person or office responsible for the decision.",
    href: "/support",
    label: "Review support choices",
  },
] as const;

export default async function OneDsdPage({ searchParams }: { searchParams?: Promise<{ view?: string }> }) {
  const surface = await prepareEditableSurface("one-dsd.page");
  if (!surface.canEdit && (await searchParams)?.view !== "overview") return (
    <EditableSurfaceRegion surface={surface} className="pilot-topic">
      <header>
        <h1>{stringValue(surface.values, "introTitle")}</h1>
        <p>{stringValue(surface.values, "introLede")}</p>
      </header>
      <section aria-label="Explore One DSD">
        <ul className="pilot-topic-rows">
          <li id="programs"><Link href="/one-dsd/programs"><strong>Programs and services</strong><span>Explore the division’s service areas and responsibilities.</span></Link></li>
          <li id="people"><Link href="/one-dsd?view=overview#people"><strong>People and connection</strong><span>Find the people and teams behind the work.</span></Link></li>
          <li id="scenarios"><Link href="/one-dsd/scenarios"><strong>Work situations</strong><span>Explore a situation from everyday DSD work.</span></Link></li>
          <li><Link href="/one-dsd/planning"><strong>Planning and progress</strong></Link></li>
          <li><Link href="/one-dsd/leadership"><strong>Equity leadership and growth</strong></Link></li>
          <li><Link href="/one-dsd?view=overview"><strong>About One DSD</strong><span>See how learning, practice, and support connect to the division’s work.</span></Link></li>
        </ul>
      </section>
    </EditableSurfaceRegion>
  );
  const [areasSurface, amplifySurface, teamSurface, inventorySurface, inventory] = await Promise.all([
    prepareEditableSurface("areas.page", { includeOwner: false }),
    prepareEditableSurface("amplify.home", { includeOwner: false }),
    prepareEditableSurface("dsd-team.home", { includeOwner: false }),
    prepareEditableSurface("one-dsd.inventory"),
    loadDsdInventory(),
  ]);
  const copy = surface.values;
  const programs = inventory.filter(item => item.surfaceId.startsWith("dsd-program."));
  const scenarios = inventory.filter(item => item.surfaceId.startsWith("dsd-scenario."));
  // Published wording overrides the defaults field by field; a door is only rendered when it
  // has a heading and link wording, so an incomplete surface never produces a blank tile or an
  // unnamed link, and every door keeps the destination defined for it here.
  const doors = PROGRAM_DOORS.map((door, index) => ({
    ...door,
    title: stringValue(copy, `door${index}Title`) || door.title,
    description: index === 3 ? door.description : stringValue(copy, `door${index}Description`) || door.description,
    label: stringValue(copy, `door${index}Label`) || door.label,
  })).filter((door) => door.title.trim() && door.label.trim());
  const routeLinks = linkListValue(copy, "routeLinks");
  return (
    <EditableSurfaceRegion surface={surface} className={`${styles.page} ${styles.programPage}`}>
      <PageIntro
        tone="business"
        kicker={stringValue(copy, "introKicker")}
        title={stringValue(copy, "introTitle")}
        lede={stringValue(copy, "introLede")}
      />
      <div className="wrap max-w-6xl space-y-12 py-10">
        <OneDsdContextPanel />
        <section className="border-t border-line pt-5" aria-labelledby="division-programs-title">
          <p className="kicker">The division&apos;s work</p>
          <h2 id="division-programs-title" className="text-2xl font-extrabold">DSD programs, services, and priorities</h2>
          <p>Explore the eight service areas, division responsibilities, people and partners, contacts, and implementation priorities. Connect each area to practical equity tools and guidance.</p>
          <Link href="/one-dsd/programs">Explore DSD programs and services</Link>
        </section>
        <section aria-labelledby="use-title">
          <p className="kicker">{stringValue(copy, "useKicker")}</p>
          <h2 id="use-title" className="text-2xl font-extrabold">{stringValue(copy, "useTitle")}</h2>
          <ul className={`${styles.doorList} mt-4 grid list-none gap-x-12 gap-y-7 p-0 md:grid-cols-2`}>
            {doors.map((door) => (
              <li key={door.href} className="border-t border-line pt-4">
                <h3 className="text-xl font-extrabold">{door.title}</h3>
                <p>{door.description}</p>
                <Link href={door.href}>{door.label}</Link>
              </li>
            ))}
          </ul>
        </section>

        {(teamSurface.available || amplifySurface.available) ? <section id="people" aria-labelledby="people-title">
          <h2 id="people-title" className="text-2xl font-semibold">People and connection</h2>
          <div className="mt-4 grid gap-x-12 gap-y-7 md:grid-cols-2">
            {teamSurface.available ? <article className="border-t border-line pt-4">
              <h3 className="text-xl font-semibold"><Link href="/one-dsd/team">{stringValue(teamSurface.values, "title")}</Link></h3>
              <p>{stringValue(teamSurface.values, "intro")}</p>
            </article> : null}
            {amplifySurface.available ? <article className="border-t border-line pt-4">
              <h3 className="text-xl font-semibold"><Link href="/one-dsd/amplify">{stringValue(amplifySurface.values, "title")}</Link></h3>
              <p>{stringValue(amplifySurface.values, "intro")}</p>
            </article> : null}
          </div>
        </section> : null}

        <details className="border-t border-line pt-5">
          <summary className="cursor-pointer text-xl font-semibold text-[#183247]">How learning and DSD work connect</summary>
          <div className="mt-6 grid gap-x-12 gap-y-8 lg:grid-cols-2">
            <div>
              <p className="kicker">{stringValue(copy, "sharedKicker")}</p>
              <h2 className="text-2xl font-semibold">{stringValue(copy, "sharedTitle")}</h2>
              <ul className="mt-3 list-disc pl-6">
                {stringListValue(copy, "sharedItems").map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <p className="kicker">{stringValue(copy, "dsdKicker")}</p>
              <h2 className="text-2xl font-semibold">{stringValue(copy, "dsdTitle")}</h2>
              <ul className="mt-3 list-disc pl-6">
                {stringListValue(copy, "dsdItems").map((item) => <li key={item}>{item.toLowerCase().includes("direct consultation") ? "Ways to find the responsible person or office for DSD work" : item}</li>)}
              </ul>
            </div>
          </div>
        </details>

        <EditableSurfaceRegion surface={inventorySurface} className="space-y-12">
          {programs.length ? <section id="programs" aria-labelledby="programs-title">
            <h2 id="programs-title" className="text-2xl font-extrabold">{stringValue(inventorySurface.values, "programsTitle")}</h2>
            <p className="mt-3">Start with a question from your work, or browse the full program list.</p>
            <DsdInventoryMap programs={programs.map(program => ({ id: program.surfaceId.slice("dsd-program.".length), title: stringValue(program.values, "title") }))} />
            <details className="border-t border-line pt-4">
              <summary className="cursor-pointer text-lg font-semibold text-[#183247]">Browse all {programs.length} programs</summary>
              <ul className="mt-4 grid list-none gap-x-12 gap-y-5 p-0 md:grid-cols-2">
                {programs.map(program => <li key={program.surfaceId} className="border-t border-line pt-4">
                  <h3 className="text-xl font-semibold"><Link href={"/one-dsd/programs/" + program.surfaceId.slice("dsd-program.".length)}>{stringValue(program.values, "title")}</Link></h3>
                  <p>{stringValue(program.values, "intro")}</p>
                </li>)}
              </ul>
            </details>
          </section> : null}
          {scenarios.length ? <section id="scenarios" aria-labelledby="scenarios-title">
            <h2 id="scenarios-title" className="text-2xl font-extrabold">{stringValue(inventorySurface.values, "scenariosTitle")}</h2>
            <details open className="mt-4 border-t border-line pt-4">
              <summary className="cursor-pointer text-lg font-semibold text-[#183247]">Explore {scenarios.length} work situations</summary>
              <ul className={`${styles.scenarioList} mt-4 grid list-none gap-x-12 gap-y-8 p-0 md:grid-cols-2`}>
                {scenarios.map(scenario => <li key={scenario.surfaceId} className="border-t border-line pt-4">
                  <h3 className="text-xl font-semibold"><Link href={"/one-dsd/scenarios/" + scenario.surfaceId.slice("dsd-scenario.".length)}>{stringValue(scenario.values, "title")}</Link></h3>
                  <p>{stringValue(scenario.values, "situation")}</p>
                </li>)}
              </ul>
            </details>
          </section> : null}
        </EditableSurfaceRegion>

        <section className="border-t border-line pt-5" aria-labelledby="areas-title">
          <p className="kicker">{stringValue(copy, "areasKicker")}</p>
          <h2 id="areas-title" className="text-2xl font-extrabold">{stringValue(copy, "areasTitle")}</h2>
          <p>
            {stringValue(copy, "areasBody")}
          </p>
          {areasSurface.available ? <Link href="/areas" className="mt-4 inline-block font-semibold">Explore areas of work</Link> : null}
        </section>

        <section className="grid gap-x-12 gap-y-7 border-t border-line pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]" aria-labelledby="consult-title">
          <div>
            <p className="kicker">{stringValue(copy, "consultKicker")}</p>
            <h2 id="consult-title" className="text-2xl font-extrabold">Finding support for DSD work</h2>
            <p>
              Use the learning, tools and library to prepare your DSD work. When it needs another perspective or a decision, involve the responsible supervisor, Equity Director or Specialist, policy owner, or other office.
            </p>
            <p className="m-0">
              {stringValue(copy, "consultBoundary")}
            </p>
          </div>
          <div>
            <h3 className="text-xl font-extrabold">{stringValue(copy, "routeTitle")}</h3>
            <div className="mt-4 grid gap-3">
              {routeLinks.filter((link) => !link.href.startsWith("/support/request")).map((link, index) => <Link href={link.href} className={index === 0 ? "btn btn--primary" : "btn btn--light"} key={link.href}>{link.label}</Link>)}
              <Link href="/support/directory" className="btn btn--light">DHS offices and guidance</Link>
            </div>
          </div>
        </section>
        <nav aria-label="About the program" className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-5">
          <Link href="/program/model">How the program works</Link>
          <Link href="/program/impact">Long-term impact</Link>
          <Link href="/equity-policy">DHS equity policy</Link>
          <Link href="/program-foundation">Program charter</Link>
        </nav>
      </div>
    </EditableSurfaceRegion>
  );
}
