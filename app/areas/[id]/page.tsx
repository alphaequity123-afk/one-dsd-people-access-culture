import { taskPracticeHref } from "@/lib/product/task-practice";
import { WorkOriginLinks } from "@/components/work-origin-links";
import { normalizeWorkOrigin, withWorkOrigin, type WorkOriginInput } from "@/lib/product/work-origin";
import type { Metadata } from "next";
import styles from "@/components/workspace-presentation.module.css";
import Link from "@/components/app-link";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/ui";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { ResourceDownloads } from "@/components/resource-downloads";
import { DOMAINS, getDomain, ROLE_FAMILY_LABEL } from "@/lib/domains";
import { applyDomainValues, domainSurfaceId } from "@/lib/domains/surfaces";
import { DSD_PROGRAMS } from "@/lib/dsd";
import { learningStagesForDomain } from "@/lib/domains/learning";
import { libraryHref, matchesLibraryFilters } from "@/lib/content/work-index";
import { learningStageFieldKey, stringValue } from "@/lib/content/staff-surface-registry";
import { loadStaffContentSnapshot } from "@/lib/content/staff-publications";
import { loadPublishedEditableSurfaces } from "@/lib/content/editable-surfaces";
import { requestedContentScope } from "@/lib/product/request-context";
import { culturalIntelligenceHubAvailable } from "@/lib/content/cultural-intelligence-publication";

type Props = { params: Promise<{ id: string }>; searchParams?: Promise<WorkOriginInput> };
const CULTURAL_WORK_PROMPTS: Record<string, { prompt: string; practices: readonly { text: string; applied: string }[] }> = {
  workforce: {
    prompt: "Consider who can access hiring, development and recognition, and how your own assumptions might shape those opportunities.",
    practices: [
      { text: "Before saying people do not apply, look at the hiring system. When people leave, ask whether they were left out of information, decisions or informal time.", applied: "Human Resources confirms which rules apply, and accommodations stay in the conversation." },
      { text: "Audit everyday routines such as dress code wording, bereavement leave and who counts as family, holidays and meeting times.", applied: "Ask who each routine was written for, and who has to ask for an exception." },
      { text: "Invest early in midlevel managers, who lead most of the workforce and carry out policies they had little part in making.", applied: "Give supervisors time and support before new expectations reach their teams." },
    ],
  },
  "culture-trust": {
    prompt: "Consider how people experience feedback, belonging and speaking up. Ask what would make participation accessible rather than assuming what works for everyone.",
    practices: [
      { text: "Agree on team norms and write the behaviors people could see for each one. One standard can have several routes: everyone can contribute by speaking, writing before or after, or talking one to one.", applied: "AAC, an interpreter and a chosen supporter are on the list from the start. Each person decides whether to share how they like to work, no one is asked to disclose a disability, and check-ins on norms stay with the team." },
      { text: "Send the agenda early, say what input you need, and offer several ways to give it. Ask what you are missing, in place of asking whether anything is missing.", applied: "This also helps interpreters, people using screen readers, people who need more time and staff on shifts." },
      { text: "Check whether the same people are always the ones adapting.", applied: "Ask the same of agency procedures that face the people served." },
    ],
  },
  "leadership-systems": {
    prompt: "Consider how your perspective shapes program and resource decisions as well as workforce culture, and whose experience can help improve those choices.",
    practices: [
      { text: "Tie this work to the mission and a named problem: what is the goal, what stands in the way, and how does culture bear on that? Write the work into plans and measures.", applied: "Any measures are for the organization and its services, never a score on a person." },
      { text: "Sort decisions by size, and tell people what they may decide alone, when they need input and what they cannot decide.", applied: "A person's own decisions about their life and services are theirs, and the agency does not sort them this way." },
      { text: "Invest early in midlevel managers, and coach senior leaders, who get little honest feedback.", applied: "Senior leaders begin with their own culture." },
    ],
  },
  "policy-program-service": {
    prompt: "Consider what a policy, form, budget or service assumes about the people it reaches, and who can still change it.",
    practices: [
      { text: "Before asking for input, say whether it will shape the decision or only gauge opinion, and whose views will count more. Afterward, say what was decided.", applied: "Label community engagement by the power people really have over the result. Tribal Nations are governments, so this is no model for that relationship; that work goes through the Office of Indian Affairs and DHS Tribal offices." },
      { text: "Give advance notice and more than one way to respond.", applied: "Plan interpreters, accessible formats, plain language and timing that works for people on shifts." },
      { text: "Audit routines and policies, because gaps leave managers improvising.", applied: "Look at forms, appointment and no-show rules, interpreter scheduling, and who counts as a contact or natural support. This adds questions to the Equity Analysis Toolkit and does not replace it." },
      { text: "Separate the common standard from how it is practiced locally.", applied: "Statewide duties can leave room for county and lead agency practice, and rights do not vary." },
    ],
  },
};
export function generateStaticParams() { return DOMAINS.map(domain => ({ id: domain.id })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const domain = getDomain((await params).id);
  if (!domain) return { title: "Areas of work" };
  const surface = await prepareEditableSurface(domainSurfaceId(domain.id), { includeOwner: false });
  return { title: surface.available ? stringValue(surface.values, "title") : "Areas of work" };
}
export default async function DomainPage({ params, searchParams }: Props) {
  const source = getDomain((await params).id); if (!source) notFound();
  const origin = normalizeWorkOrigin(await searchParams ?? {}, source.id);
  const scope = await requestedContentScope();
  const [surface, resources, related] = await Promise.all([
    prepareEditableSurface(domainSurfaceId(source.id), { scope }),
    loadStaffContentSnapshot({ scope }),
    loadPublishedEditableSurfaces([
      "learn.page", "library.page", "practice.measurement", "practice.page",
      ...source.tasks.flatMap(task => task.pathId ? [`graduation-path.${task.pathId}`] : []),
      ...(scope === "dsd" ? [...source.dsd.scenarioIds.map(id => `dsd-scenario.${id}`), ...DSD_PROGRAMS.filter(program => program.domains.includes(source.id)).map(program => `dsd-program.${program.id}`)] : []),
    ], scope),
  ]);
  const domain = applyDomainValues(source, surface.values); const copy = surface.values;
  const content = new Map(resources.items.map(item => [item.id,item]));
  const publications = new Map(related.map(item => [item.surfaceId,item]));
  const programs = scope === "dsd" ? DSD_PROGRAMS.filter(program => program.domains.includes(source.id) && publications.has(`dsd-program.${program.id}`)) : [];
  const scenarios = scope === "dsd" ? domain.dsd.scenarioIds.filter(id => publications.has(`dsd-scenario.${id}`)) : [];
  const learning = publications.get("learn.page");
  const stages = learning ? learningStagesForDomain(source.id) : [];
  const libraryAvailable = publications.has("library.page");
  const areaResources = resources.items.filter(item => matchesLibraryFilters(item, { area: source.id }));
  const tools = domain.toolIds.flatMap(id => content.has(id) ? [content.get(id)!] : []);
  let culturalIntelligenceAvailable = false;
  const culturalPrompt = CULTURAL_WORK_PROMPTS[source.id];
  if (culturalPrompt && surface.available) {
    try {
      // Check the published area without an owner override as well as the target
      // in the same scope. A failed or withdrawn check hides only this new link.
      const [publishedArea, target] = await Promise.all([
        prepareEditableSurface(domainSurfaceId(source.id), { scope, includeOwner: false }),
        culturalIntelligenceHubAvailable(scope),
      ]);
      culturalIntelligenceAvailable = publishedArea.available && target;
    } catch { /* Keep the existing work area available without this optional link. */ }
  }
  return <EditableSurfaceRegion surface={surface}>
    <PageIntro kicker={domain.staffLabel} title={domain.title} lede={domain.summary} />
    <div className={`wrap space-y-8 py-8 ${styles.domainBody}`}>
      <Link href="/areas">{stringValue(copy,"backLabel")}</Link>
      <WorkOriginLinks origin={origin} domainAvailable={surface.available} />
      {culturalIntelligenceAvailable && <section className="rounded-xl border border-line p-6" aria-labelledby="cultural-work-connection"><h2 id="cultural-work-connection" className="text-xl font-semibold">Connect cultural understanding with this work</h2><p className="my-3 leading-7">{culturalPrompt.prompt}</p><h3 className="mt-5 text-lg font-semibold">Practices for leaders</h3><ul className="mt-2 list-disc space-y-3 pl-6 leading-7">{culturalPrompt.practices.map(practice => <li key={practice.text}>{practice.text} <strong>In DSD work:</strong> {practice.applied}</li>)}</ul><p className="mt-4 leading-7">Keep cultural learning and the Intercultural Development Inventory separate from hiring, promotion, ratings and performance reviews. Decisions follow the responsible work processes.</p><p className="mt-4"><Link className="font-semibold underline" href="/learn/cultural-intelligence">Explore Cultural Intelligence and community context</Link></p></section>}
      {source.id === "leadership-systems" && <section className="rounded-xl bg-[#f4f7f9] p-6"><h2 className="text-2xl font-semibold">Equity leadership and growth in DSD</h2><p className="my-4 leading-7">Find a starting point as an aspiring or current leader. Build a development map and connect equity learning with DSD practice, feedback, and succession.</p><Link href="/one-dsd/leadership">Explore the One DSD leadership experience</Link></section>}
      <div className={styles.goalTags}>{domain.goals.map(goal => <span key={goal}>{goal}</span>)}</div>
      <section aria-labelledby="work-tasks-title"><h2 id="work-tasks-title" className="text-3xl font-extrabold">{stringValue(copy,"tasksTitle")}</h2><div className="mt-6 space-y-8">{domain.tasks.map(task => {
        const path = task.pathId ? publications.get(`graduation-path.${task.pathId}`) : undefined;
        const practiceHref = taskPracticeHref(source.id, task, new Set(publications.keys()), new Set(content.keys()));
        const readings = task.contentIds.flatMap(id => content.has(id) ? [content.get(id)!] : []);
        return <article id={`task-${task.id}`} key={task.id} className="border-t border-line py-6 first:border-t-0">
          <span id={task.id} aria-hidden="true" className="scroll-mt-6" />
          <h3 className="text-2xl font-bold">{task.label}</h3><p>{task.outcome}</p>
          <p className="text-sm text-muted">{task.roles.map(role => ROLE_FAMILY_LABEL[role]).join(" · ")}{task.supportsRequired ? ` · ${stringValue(copy,"requiredLabel")}` : ""}</p>
          {readings.length ? <ul className="list-disc pl-6">{readings.map(item => <li key={item.id}><Link href={withWorkOrigin(`/library/${item.id}`, { ...origin, task: task.id })}>{item.title}</Link></li>)}</ul> : null}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-bold">
            {libraryAvailable && readings.length ? <Link href={libraryHref({ ...origin, area: source.id, task: task.id })}>{stringValue(copy,"taskLibraryLabel")}</Link> : null}
            {practiceHref ? <Link href={withWorkOrigin(practiceHref, { ...origin, task: task.id })}>{path ? stringValue(path.values,"title") : stringValue(publications.get("practice.measurement")!.values,"title")}</Link> : null}
            <Link href={withWorkOrigin(`/ask?q=${encodeURIComponent(task.askStarter)}${path ? `&path=${task.pathId}` : ""}`, { ...origin, task: task.id })}>{stringValue(copy,"askLabel")}</Link>
          </div>
        </article>;
      })}</div></section>
      <details className="border-t border-line py-5">
        <summary className="cursor-pointer font-semibold text-[#183247]">Background and questions for this area</summary>
        <div className="max-w-3xl space-y-6 pt-5">
          <section><h2 className="text-2xl font-extrabold">{stringValue(copy,"whyTitle")}</h2><p>{domain.whyItMatters}</p></section>
          <section><h2 className="text-2xl font-extrabold">{stringValue(copy,"questionsTitle")}</h2><ul className="list-disc space-y-2 pl-6">{domain.firstQuestions.map(question => <li key={question}>{question}</li>)}</ul></section>
        </div>
      </details>
      {surface.available ? <details className="border-t border-line py-5"><summary className="cursor-pointer font-semibold text-[#183247]">Download this area of work</summary><ResourceDownloads kind="area" id={source.id} noun="area of work" scope={scope} /></details> : null}
      {tools.length ? <section className="border-t border-line pt-5"><h2 className="text-2xl font-extrabold">{stringValue(copy,"toolsTitle")}</h2><ul className="space-y-4">{tools.map(item => <li key={item.id}><Link href={withWorkOrigin(`/library/${item.id}`, origin)} className="font-bold">{item.title}</Link><p>{item.summary}</p>{item.sourceName ? <p className="text-sm text-muted">{item.sourceName}</p> : null}</li>)}</ul></section> : null}
      {stages.length || (libraryAvailable && areaResources.length) ? <section className="border-t border-line pt-5" aria-labelledby="area-learning-title">
        <h2 id="area-learning-title" className="text-2xl font-extrabold">{stringValue(copy,"learningTitle")}</h2>
        {stages.length ? <ul className="list-disc space-y-2 pl-6">{stages.map(stage => <li key={stage.id}><Link href={"/learn#" + stage.id}>{stringValue(learning!.values,learningStageFieldKey(stage.id,"label"))}</Link></li>)}</ul> : null}
        {libraryAvailable && areaResources.length ? <p><Link href={libraryHref({ ...origin, area: source.id })}>{stringValue(copy,"areaLibraryLabel")}</Link></p> : null}
      </section> : null}
      {scope === "dsd" ? <section className="border-t border-line pt-5"><h2 className="text-2xl font-extrabold">{stringValue(copy,"dsdTitle")}</h2><p>{domain.dsd.note}</p><ul className="list-disc pl-6">{domain.dsd.programs.map(program => <li key={program}>{program}</li>)}</ul>
        {programs.length ? <><h3 className="mt-5 text-xl font-bold">{stringValue(copy,"programsTitle")}</h3><ul className="list-disc pl-6">{programs.map(program => <li key={program.id}><Link href={`/one-dsd/programs/${program.id}`}>{stringValue(publications.get(`dsd-program.${program.id}`)!.values,"title")}</Link></li>)}</ul></> : null}
        {scenarios.length ? <><h3 className="mt-5 text-xl font-bold">{stringValue(copy,"scenariosTitle")}</h3><ul className="list-disc pl-6">{scenarios.map(id => <li key={id}><Link href={`/one-dsd/scenarios/${id}`}>{stringValue(publications.get(`dsd-scenario.${id}`)!.values,"title")}</Link></li>)}</ul></> : null}
      </section> : null}
      <div className="border-t border-line pt-5"><Link href={withWorkOrigin("/support/right-person", origin)}>{stringValue(copy,"supportLabel")}</Link></div>
    </div>
  </EditableSurfaceRegion>;
}
