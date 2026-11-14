export const WATER_FOUNDATION = {
  href: "/learn/water-we-swim-in/course",
  video: "/videos/water-foundation/course.mp4",
  captions: "/videos/water-foundation/captions.vtt",
  poster: "/images/water-foundation/team.png",
};

export function courseTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

// Media seeks can round down by a fraction of a frame at a chapter boundary.
export function chapterAtTime(chapters: readonly { start: number }[], seconds: number) {
  return Math.max(0, chapters.findLastIndex(chapter => chapter.start <= seconds + 0.05));
}
