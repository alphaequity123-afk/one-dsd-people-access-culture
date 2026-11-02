import type { ChapterKeyPoints } from '@/lib/content/clas-curriculum-practice';
import type { Chapter } from '@/lib/learning/vtt';

/** Key points per video chapter, in chapter order, shown at the end of the video section. */
export function KeyPointsPanel({ keyPoints, chapters }: { keyPoints: ChapterKeyPoints[]; chapters: Chapter[] }) {
  if (!keyPoints.length) return null;
  const ordered = [...chapters.map(c => keyPoints.find(k => k.chapter === c.title)).filter((k): k is ChapterKeyPoints => Boolean(k)), ...keyPoints.filter(k => !chapters.some(c => c.title === k.chapter))];
  return (
    <div className="clas-keypoints" aria-labelledby="key-points" role="region">
      <h3 id="key-points">Key points from this lesson</h3>
      {ordered.map(k => <div key={k.chapter}><h4>{k.chapter}</h4><ul>{k.points.map(p => <li key={p}>{p}</li>)}</ul></div>)}
    </div>
  );
}
