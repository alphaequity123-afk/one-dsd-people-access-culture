"use client";
import { FeaturedMediaPanel } from "@/components/featured-media-panel";

import { useState } from "react";
import content from "@/lib/content/cultural-intelligence-explainer-draft.json";

export type ExplainerMedia = { video: string; captions: string };

/** Shape checking is not media verification. The future parent must supply only independently verified assets. */
function availableMedia(id: string, media?: ExplainerMedia): media is ExplainerMedia {
  if (!/^0[1-3]$/.test(id) || !media) return false;
  const base = `/learning/cultural-intelligence/${id}/`;
  return media.video === `${base}lesson.mp4` && media.captions === `${base}captions.vtt`;
}

/** Isolated draft. Not connected to a route; finished, verified media must be integrated separately. */
export function CulturalIntelligenceExplainerDraft({ media = {} }: { media?: Record<string, ExplainerMedia> }) {
  const [selected, setSelected] = useState<Record<string, number>>({});

  return <div className="space-y-10">
    <p>Explore these topics in any order. Your practice choices stay on this page and are not saved when you leave or reload it.</p>
    {content.lessons.map(lesson => <section key={lesson.id} aria-labelledby={`explainer-${lesson.id}`} className="space-y-5 border-t border-line pt-6">
      <h4 id={`explainer-${lesson.id}`} className="text-2xl font-semibold">{lesson.title}</h4>
      {availableMedia(lesson.id, media[lesson.id]) ? <FeaturedMediaPanel kind="video"><div className="space-y-3">
        <video controls playsInline preload="metadata" aria-label={lesson.title}>
          <source src={media[lesson.id].video} type="video/mp4" />
          <track kind="captions" src={media[lesson.id].captions} srcLang="en" label="English" default />
          Your browser cannot play this video. You can read the lesson below.
        </video>
        <p><a href={media[lesson.id].captions}>Download the captions</a></p>
      </div></FeaturedMediaPanel> : <p>You can read the lesson below.</p>}
      <p>If you’re reading, take a moment to choose your response before continuing.</p>
      <details className="rounded-xl border border-line p-5">
        <summary className="cursor-pointer font-semibold">Read {lesson.title}</summary>
        <div className="mt-5 space-y-6">{lesson.chapters.map(chapter => <section key={chapter.title}>
          <h5 className="text-xl font-semibold">{chapter.title}</h5>
          {chapter.paragraphs.map((paragraph, index) => <p key={index} className="mt-3 leading-7">{paragraph}</p>)}
        </section>)}</div>
      </details>
      <fieldset className="space-y-3 rounded-xl border border-line p-5">
        <legend className="font-semibold">{lesson.question}</legend>
        {lesson.choices.map((choice, index) => <label key={index} className="flex cursor-pointer items-start gap-3">
          <input type="radio" name={`practice-${lesson.id}`} value={index} checked={selected[lesson.id] === index}
            onChange={() => setSelected(current => ({ ...current, [lesson.id]: index }))} />
          <span>{choice.text}</span>
        </label>)}
        <div role="status" aria-live="polite" className="leading-7">
          {selected[lesson.id] !== undefined ? lesson.choices[selected[lesson.id]].feedback : ""}
        </div>
      </fieldset>
    </section>)}
  </div>;
}
