import Image from "next/image";
import { selfDirectedPresentation } from "@/lib/content/self-directed-covers";
import Link from "@/components/app-link";
import { AuthorityPill } from "@/components/ui";
import { resourceLearningLevel } from "@/lib/content/resource-organization";
import { progressionLabel, resourceProgressionLevel } from "@/lib/content/progression";
import type { ContentItem } from "@/lib/content/types";
import styles from "./learning-tile.module.css";
import { ResourceRemove } from "@/components/resource-tools";
import { selfDirectedHref } from "@/lib/content/self-directed";
import { resourceStudyHref } from "@/lib/client/resource-study-links";

type LearningTileProps = {
  item: ContentItem;
  href?: string;
  presentation?: { imageSrc: string; imageAlt: string; summary: string };
  /** Signed-in consultant: show the small remove control on the tile. */
  owner?: boolean;
  /** Learning discovery can show course level without changing other card uses. */
  showLevel?: boolean;
};

export function LearningTile({ item, presentation, href, owner = false, showLevel = false }: LearningTileProps) {
  presentation = selfDirectedPresentation(item.id, item.summary) ?? presentation;
  const level = showLevel ? resourceLearningLevel(item) : null;
  const progression = showLevel ? resourceProgressionLevel(item.id) ?? (level ? ({ foundation: "foundations", intermediate: "applying", advanced: "leading" } as const)[level] : null) : null;
  const titleId = `learning-title-${item.id}`;
  const hasImage = Boolean(presentation?.imageSrc);
  const studyPath = process.env.GEMINI_API_KEY?.trim() ? selfDirectedHref(item.id) : undefined;
  return <article data-learning-id={item.id} style={owner ? { position: "relative" } : undefined}>
    {owner ? <div style={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}><ResourceRemove contentItemId={item.id} title={item.title} compact /></div> : null}
    <Link href={href ?? `/library/${item.id}`} className={`${styles.tile} ${hasImage ? "" : styles.textOnly}`} aria-labelledby={titleId}>
      {hasImage ? <div className={styles.media}>
        <Image src={presentation!.imageSrc} alt={presentation!.imageAlt} fill sizes="(max-width: 460px) 90vw, (max-width: 760px) 35vw, (max-width: 1000px) 42vw, 240px" style={{ objectFit: "contain" }} unoptimized />
      </div> : null}
      <div className={styles.copy}>
        {progression ? <p className={styles.level} data-learning-level={level ?? progression}>{progressionLabel(progression)}</p> : null}
        <h3 id={titleId} className={styles.title}>{item.title}</h3>
        <p className={styles.summary}>{presentation?.summary || item.summary}</p>
        <div className={styles.meta}><AuthorityPill authority={item.authority} /></div>
      </div>
    </Link>
    {studyPath ? <Link href={resourceStudyHref(studyPath)} prefetch={false} className="mt-2 inline-block text-sm font-semibold underline underline-offset-4" aria-label={`Study ${item.title}`}>Study this course</Link> : null}
  </article>;
}
