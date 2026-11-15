
import { SourceLink } from "@/components/app-link";
import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PageIntro } from "@/components/ui";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { linkListValue, stringListValue, stringValue } from "@/lib/content/staff-surface-registry";
import { serviceAreas, responsibilities, priorities } from "@/lib/dsd/program-overview";
import styles from "./programs.module.css";

export const metadata:Metadata={title:"DSD programs and services"};
export default async function ProgramsPage(){
  const surface=await prepareEditableSurface("one-dsd.program-overview");
  const copy=surface.values;
  const key=(id:string,suffix:string)=>id.replaceAll("-","_")+suffix;
  return <EditableSurfaceRegion surface={surface} className={styles.page}>
    <PageIntro tone="business" kicker="One DSD People, Access and Culture" title={stringValue(copy,"title")} lede={stringValue(copy,"intro")}>
      <nav aria-label="On this page" className={styles.navigation}>
        <SourceLink href="#services">Programs and services</SourceLink>
        <SourceLink href="#engagement">When to engage</SourceLink>
        <SourceLink href="#contacts">Contacts</SourceLink>
        <SourceLink href="#responsibilities">What DSD does</SourceLink>
        <SourceLink href="#people">People and partners</SourceLink>
        <SourceLink href="#priorities">Implementation priorities</SourceLink>
      </nav>
    </PageIntro>
    <div className={`wrap max-w-6xl ${styles.body}`}>
      <Link href="/one-dsd">Explore One DSD</Link>
      <section id="services" aria-labelledby="services-heading">
        <p className={styles.kicker}>Start with the service</p>
        <h2 id="services-heading">{stringValue(copy,"servicesHeading")}</h2>
        <p className={styles.intro}>{stringValue(copy,"servicesIntro")}</p>
        <div className={styles.grid}>{serviceAreas.map((s,i)=><article key={s.id} id={s.id} className={styles.card}>
          <span className={styles.number}>{String(i+1).padStart(2,"0")}</span>
          <h3 id={`${s.id}-heading`}>{stringValue(copy,key(s.id,"Title"))}</h3>
          <p>{stringValue(copy,key(s.id,"Intro"))}</p>
          <details className={styles.cardDetails}>
            <summary aria-labelledby={`${s.id}-details ${s.id}-heading`}><span id={`${s.id}-details`}>Equity question and resources</span></summary>
            <div className={styles.question}><h4>Bring an equity lens</h4><p>{stringValue(copy,key(s.id,"Question"))}</p></div>
            <ul className={styles.links}>{linkListValue(copy,key(s.id,"Links")).map(l=><li key={l.href}>{l.href.startsWith("/")?<Link href={l.href}>{l.label}</Link>:<SourceLink href={l.href}>{l.label}</SourceLink>}</li>)}</ul>
          </details>
        </article>)}</div>
      </section>
      <section id="responsibilities" aria-labelledby="responsibilities-heading"><p className={styles.kicker}>The division&apos;s role</p><h2 id="responsibilities-heading">{stringValue(copy,"responsibilitiesHeading")}</h2><div className={styles.responsibilities}>{responsibilities.map(r=><article key={r.id}><h3>{stringValue(copy,r.id+"Title")}</h3><ul>{stringListValue(copy,r.id+"Items").map(t=><li key={t}>{t}</li>)}</ul></article>)}</div></section>
      <section id="people" aria-labelledby="people-heading" className={styles.people}><div><p className={styles.kicker}>People, access, and culture</p><h2 id="people-heading">{stringValue(copy,"peopleHeading")}</h2><ul>{stringListValue(copy,"people").map(t=><li key={t}>{t}</li>)}</ul></div><div><h3>{stringValue(copy,"practiceHeading")}</h3><p>{stringValue(copy,"practiceIntro")}</p><ul className={styles.links}><li><Link href="/learn/equity-in-practice">Watch the map and DSD practice videos</Link></li><li><Link href="/learn/equity-toolkit/goals">Explore the six Aging and Disability Services Administration goals</Link></li><li><Link href="/learn/equity-toolkit">Use the Equity Analysis Toolkit</Link></li><li><Link href="/practice/clas">Apply culturally and linguistically appropriate practice</Link></li></ul></div></section>
      <section id="engagement" aria-labelledby="engagement-heading"><p className={styles.kicker}>Coordinate the right work</p><h2 id="engagement-heading">{stringValue(copy,"engageHeading")}</h2><ul className={styles.engagement}>{stringListValue(copy,"engage").map(t=><li key={t}>{t}</li>)}</ul><p><Link href="/support/right-person">Find the person or area responsible</Link></p></section>
      <section id="contacts" aria-labelledby="contacts-heading"><p className={styles.kicker}>People to connect with</p><h2 id="contacts-heading">{stringValue(copy,"contactsHeading")}</h2><ul className={styles.contacts}>{stringListValue(copy,"contacts").map(t=><li key={t}>{t}</li>)}</ul><p>For service navigation and public program questions, use the official <SourceLink href="https://mn.gov/dhs/about-us/contact-us/contact-numbers/">DHS contact directory</SourceLink> or <SourceLink href="https://disabilityhubmn.org/">Disability Hub MN</SourceLink>.</p></section>
      <section id="priorities" aria-labelledby="priorities-heading"><p className={styles.kicker}>Implementation priorities</p><h2 id="priorities-heading">{stringValue(copy,"prioritiesHeading")}</h2><p className={styles.intro}>{stringValue(copy,"prioritiesIntro")}</p><div className={styles.priorities}>{priorities.map(p=><article key={p.id}><h3>{stringValue(copy,key(p.id,"PriorityTitle"))}</h3><p>{stringValue(copy,key(p.id,"PriorityDetail"))}</p><p className={styles.priorityQuestion}>{stringValue(copy,key(p.id,"PriorityQuestion"))}</p><ul className={styles.links}>{linkListValue(copy,key(p.id,"PriorityLinks")).map(l=><li key={l.href}>{l.href.startsWith("/")?<Link href={l.href}>{l.label}</Link>:<SourceLink href={l.href}>{l.label}</SourceLink>}</li>)}</ul></article>)}</div></section>
      <footer className={styles.source}><p>{stringValue(copy,"sourceNote")}</p><Link href="/one-dsd/planning">Connect priorities to planning and reviewing progress</Link></footer>
    </div>
  </EditableSurfaceRegion>;
}
