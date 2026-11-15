
import { SourceLink } from "@/components/app-link";
import Link from "@/components/app-link";
import { developmentModel, journeyHref } from "@/lib/program/development";
import { readingPathways } from "@/lib/content/reading-pathways";
import { PROGRESSION_LEVELS, type ProgressionLevelId } from "@/lib/program/progression-levels";
import { ExplainerVideo } from "@/components/explainer-video";

export const metadata = { title: "Learning paths" };

/** Level for each guided pathway (formerly /journeys) and reading path (from /learn/readings/pathways). */
const JOURNEY_LEVELS: Record<string, ProgressionLevelId> = {
  "access-and-communication": "foundations",
  "perspectives-and-culture": "foundations",
  "workplace-culture": "applying",
  "decisions-and-systems": "applying",
  "learning-and-leadership": "leading",
};
const READING_LEVELS: Record<number, ProgressionLevelId> = {
  2: "foundations", 4: "foundations", 5: "foundations",
  1: "applying", 6: "applying", 7: "applying", 8: "applying",
  3: "leading", 9: "leading",
};

type PathEntry = { key: string; kind: string; title: string; question: string; href: string; level: ProgressionLevelId };

export default function LearningPathsPage() {
  const entries: PathEntry[] = [
    ...developmentModel.journeys.map(journey => ({ key: journey.id, kind: "Guided pathway", title: journey.title, question: journey.question, href: journeyHref(journey.id), level: JOURNEY_LEVELS[journey.id] ?? "applying" })),
    ...readingPathways.map(path => ({ key: `reading-${path.section}`, kind: "Reading path", title: path.title, question: path.question, href: `/learn/readings/pathways#collection-${path.section}`, level: READING_LEVELS[path.section] ?? "applying" })),
  ];
  return <div className="development-page">
    <header>
      <p className="development-eyebrow">Understanding. Relationships. Action.</p>
      <h1>Learning paths</h1>
      <p>{developmentModel.direction}</p>
      <p>Begin with a question from your work. The five guided pathways connect that question with other perspectives and a change to consider in practice. The nine reading paths help you apply a book or article to a familiar situation. The groups suggest different starting points for development; they are not prerequisites. Choose the path that addresses your question and the level of analysis you need.</p>
    </header>
    <ExplainerVideo id="learning-journey" />
    {PROGRESSION_LEVELS.map(level => {
      const paths = entries.filter(entry => entry.level === level.id);
      return paths.length ? <section key={level.id} id={`level-${level.id}`} aria-labelledby={`level-${level.id}-title`}>
        <h2 id={`level-${level.id}-title`}>{level.title}</h2>
        <p>{level.fits}.</p>
        <ul className="development-grid">{paths.map(path => <li key={path.key}><p className="development-eyebrow">{path.kind}</p><h3><Link href={path.href}>{path.title}</Link></h3><p className="development-question">{path.question}</p></li>)}</ul>
      </section> : null;
    })}
    <p>New to DSD? The best first step is <Link href="/start#new-to-dsd">getting to know the program</Link>, and the <Link href="/learn#start-here">Core 15</Link> courses make a strong foundation for every path here.</p>
    <section><h2>Learning with other people</h2><p>A willing colleague can help you examine an assumption, rehearse a conversation, or reflect on an experience. Leaders can make time for practice, respond constructively to questions, and change routines that prevent people from using what they learn.</p><ul className="development-step-links"><li><Link href="/employee-resource-groups">Employee resource groups</Link></li><li><Link href="/one-dsd/team">One DSD Team</Link></li><li><Link href="/support">Find support</Link></li></ul><p>Within the <Link href="/administrations/adsa">Aging and Disability Services Administration</Link>, DSD offers <Link href="/one-dsd/amplify">Amplify Equity</Link> and the <Link href="/one-dsd/team">One DSD Team</Link> for shared learning and contribution in the division.</p></section>
    <details className="development-related"><summary>How learning becomes practice</summary><ol className="development-grid">{developmentModel.stages.map(stage => <li key={stage.id}><h3>{stage.title}</h3><p>{stage.purpose}</p><p><strong>Consider:</strong> {stage.prompt}</p></li>)}</ol></details>
    <details className="development-related"><summary>How the program contributes to change</summary><div className="development-logic"><ol>{developmentModel.logicModel.map(item => <li key={item.title}><strong>{item.title}:</strong> {item.text}</li>)}</ol><p>A resource delivered, an approach used, and an improvement observed are different kinds of evidence. Time, access, support, decision-making authority, and people’s willingness to participate all affect what becomes possible.</p></div></details>
    <details className="development-related"><summary>Research informing this approach</summary><ul>{developmentModel.sources.map(source => <li key={source.href}><SourceLink href={source.href}>{source.title}</SourceLink><p>{source.application}</p></li>)}</ul><p>{developmentModel.evidenceNote}</p></details>
    <p><Link href="/learn">Learn</Link> · <Link href="/library?browse=all">Explore all learning and resources</Link></p>
  </div>;
}
