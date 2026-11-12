import "server-only";

import clas from "@/lib/content/clas-curriculum.json";
import equity from "@/lib/content/equity-everyday-decisions.json";
import intercultural from "@/lib/content/intercultural-curriculum.json";
import interculturalMedia from "@/lib/content/intercultural-verified-media.json";
import { walkthroughOf } from "@/lib/learning/clas-walkthrough";

type CurriculumMediaSource = {
  key: string;
  title: string;
  media: string;
  captions: string;
  transcript: string;
  parent: string;
};

/** Match the media selected by the current published lesson page metadata. */
export function curriculumMediaSources(): CurriculumMediaSource[] {
  const items: CurriculumMediaSource[] = [];
  for (const lesson of clas.modules) {
    const parent = `/learn/clas/curriculum/${lesson.id}`;
    items.push({
      key: `clas-video:${lesson.id}`, title: `${lesson.title}: CLAS lesson video`,
      media: lesson.video, captions: lesson.captions,
      transcript: `/learning/clas-curriculum/${lesson.id}/transcript.txt`, parent,
    });
    const walkthrough = walkthroughOf(lesson);
    if (walkthrough?.captions && walkthrough.transcript) {
      items.push({
        key: `clas-walkthrough:${lesson.id}`, title: `${lesson.title}: CLAS audio walkthrough`,
        media: walkthrough.audio, captions: walkthrough.captions, transcript: walkthrough.transcript, parent,
      });
    }
  }
  for (const lesson of equity.modules) {
    if (!lesson.mediaReady || !lesson.video || !lesson.captions) continue;
    items.push({
      key: `equity-video:${lesson.id}`, title: `${lesson.title}: Equity in everyday decisions video`,
      media: lesson.video, captions: lesson.captions,
      transcript: `/learning/equity-everyday-decisions/${lesson.id}/transcript.txt`,
      parent: `/learn/equity-toolkit/curriculum/${lesson.id}`,
    });
  }
  if (interculturalMedia.status === "seven-current-media-proofs-passed") {
    for (const lesson of intercultural.modules) {
      const media = interculturalMedia.lessons.find(item => item.id === lesson.id);
      if (!media) continue;
      items.push({
        key: `intercultural-video:${lesson.id}`, title: `${lesson.title}: Intercultural learning video`,
        media: media.video, captions: media.captions,
        transcript: `/learning/intercultural-curriculum/${lesson.id}/transcript.txt`,
        parent: `/learn/intercultural/curriculum/${lesson.id}`,
      });
    }
  }
  return items;
}
