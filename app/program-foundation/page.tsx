import { foundationArticles, foundationProvisions } from "@/lib/program/constitution";
import { ExplainerVideo } from "@/components/explainer-video";

export const metadata = { title: "Program charter" };

export default function ProgramConstitutionPage() {
  return <article className="dsd-shell dsd-stage">
    <header className="dsd-page-heading"><h1>Program charter</h1><p className="dsd-lede">The principles and responsibilities guiding One DSD People, Access and Culture.</p><p>This is a proposed program charter. Applicable law, approved DHS policies and existing decision authority continue to govern official work.</p></header>
    <ExplainerVideo id="program-charter" />
    {foundationArticles.map(article => <details className="dsd-model-note" key={article.id}><summary><strong>Article {article.id}. {article.title}</strong></summary>{foundationProvisions.filter(provision => provision.article === article.id).map(provision => <section key={provision.id} style={{ marginBlock: "1.5rem" }}><h2>{provision.id} {provision.title}</h2><p>{provision.summary}</p></section>)}</details>)}
  </article>;
}
