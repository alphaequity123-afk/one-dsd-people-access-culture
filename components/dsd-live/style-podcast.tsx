import Listen from "@/app/learn/leadership/courses/listen";
import type { StylePodcast as Podcast } from "@/lib/dsd-live/leadership/style-podcasts";

/** The style's two-voice conversation, near the top of the page (owner rule: media near the top). */
export function StylePodcast({ podcast, styleName }: { podcast: Podcast; styleName: string }) {
  return <section className="style-podcast" aria-labelledby="style-podcast-title">
    <p className="style-podcast-label">Podcast</p>
    <h2 id="style-podcast-title">{styleName}: a conversation</h2>
    <p className="style-podcast-meta">Two hosts talk through this style, about {podcast.minutes} minutes.</p>
    <Listen title={`Listen to the conversation on ${styleName.toLowerCase()}`} src={podcast.src} captions={podcast.captions}>
      {podcast.turns.map((turn, i) => <p key={i}><strong>{turn.speaker}:</strong> {turn.text}</p>)}
    </Listen>
  </section>;
}
