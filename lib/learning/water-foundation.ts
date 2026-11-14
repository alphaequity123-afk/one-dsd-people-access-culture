export const WATER_FOUNDATION = {
  href: "/learn/water-we-swim-in/course",
  video: "/videos/water-foundation/course.mp4",
  captions: "/videos/water-foundation/captions.vtt",
  poster: "/images/water-foundation/team.png",
};

export function courseTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}
