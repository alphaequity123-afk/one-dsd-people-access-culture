import { DevelopmentResourceGuide } from "./development-resource-guide";
import Link from "@/components/app-link";
import { prepareEditableSurface } from "./editable-surface";
import { getLearningJourney, journeyText, LEARNING_JOURNEY_HREF } from "@/lib/content/learning-journey";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import Image from "next/image";
import styles from "./learning-journey-link.module.css";

export async function LearningJourneyLink({scope, resourceId, compact=false}: {scope?:StaffProgramScope;resourceId?:string;compact?:boolean}) {
  if (resourceId) return <DevelopmentResourceGuide scope={scope} resourceId={resourceId} />;
  const surface=await prepareEditableSurface("learn.intercultural",{scope,includeOwner:false});
  if(!surface.available) return null;
  const matches=resourceId ? getLearningJourney(surface.values).filter(stop=>stop.resourceIds.includes(resourceId)) : [];
  if(resourceId&&!matches.length) return null;
  if(compact || resourceId) return <aside className={styles.journey} aria-label="Learning journey">
    <Image unoptimized src="/images/pilot-home/learn.jpg" alt="" width={900} height={600} sizes="(min-width: 800px) 460px, 90vw" />
    <div className={styles.copy}><p className={styles.title}>{resourceId ? "Connect this learning with your work" : journeyText(surface.values,"previewTitle")}</p>
    <div className={styles.links}>{matches.length ? matches.map(stop=><Link key={stop.id} href={LEARNING_JOURNEY_HREF+"#"+stop.id}>{stop.title}</Link>) : <Link href={LEARNING_JOURNEY_HREF}>{journeyText(surface.values,"previewLink")}</Link>}</div></div>
  </aside>;
  return <aside className={styles.journey} aria-label="A path through learning">
    <Image unoptimized src="/images/pilot-home/learn.jpg" alt="" width={900} height={600} sizes="(min-width: 800px) 460px, 90vw" />
    <div className={styles.copy}>
    <h2 className="text-2xl font-semibold"><Link href={LEARNING_JOURNEY_HREF}>{journeyText(surface.values,"previewTitle")}</Link></h2>
    <p className="mt-3 max-w-3xl leading-7">{journeyText(surface.values,"previewBody")}</p>
    <div className={styles.links}><Link href={LEARNING_JOURNEY_HREF}>{journeyText(surface.values,"previewLink")}</Link></div>
    </div>
  </aside>;
}
