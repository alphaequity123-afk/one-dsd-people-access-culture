import type { ChapterKeyPoints } from '@/lib/content/clas-curriculum-practice';
import type { Chapter } from '@/lib/learning/vtt';

/**
 * Key points per video chapter, in chapter order. `headingLevel` 2 is for a panel that stands on its
 * own (not inside the video section), so the page outline stays h1, h2, h3.
 */
export function KeyPointsPanel({ keyPoints, chapters, title = 'Key points from this lesson', headingLevel = 3 }: { keyPoints: ChapterKeyPoints[]; chapters: Chapter[]; title?: string; headingLevel?: 2 | 3 }) {
  if (!keyPoints.length) return null;
  const ordered = [...chapters.map(c => keyPoints.find(k => k.chapter === c.title)).filter((k): k is ChapterKeyPoints => Boolean(k)), ...keyPoints.filter(k => !chapters.some(c => c.title === k.chapter))];
  return (
    <div className="clas-keypoints" aria-labelledby="key-points" role="region">
      {headingLevel === 2 ? <h2 id="key-points">{title}</h2> : <h3 id="key-points">{title}</h3>}
      {ordered.map(k => <div key={k.chapter}>{headingLevel === 2 ? <h3>{k.chapter}</h3> : <h4>{k.chapter}</h4>}<ul>{k.points.map(p => <li key={p}>{p}</li>)}</ul></div>)}
    </div>
  );
}
