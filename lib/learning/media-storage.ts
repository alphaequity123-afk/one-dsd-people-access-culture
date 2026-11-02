/** Remembered playback position and speed for the CLAS lesson media, kept in this browser only. */
export const POSITION_KEY_PREFIX = 'one-dsd-clas-curriculum-position-v1:';
export const SPEED_KEY = 'one-dsd-clas-curriculum-speed-v1';
export const SPEEDS = [0.75, 1, 1.25, 1.5] as const;
export type Speed = (typeof SPEEDS)[number];

export const positionKey = (mediaId: string) => `${POSITION_KEY_PREFIX}${mediaId}`;

export function readPosition(mediaId: string): number | null {
  try { const n = Number(localStorage.getItem(positionKey(mediaId))); return Number.isFinite(n) && n > 0 ? n : null; } catch { return null; }
}
export function writePosition(mediaId: string, seconds: number): void {
  try { localStorage.setItem(positionKey(mediaId), String(Math.floor(seconds))); } catch { /* storage unavailable: the position is not remembered */ }
}
export function clearPosition(mediaId: string): void {
  try { localStorage.removeItem(positionKey(mediaId)); } catch { /* nothing to clear */ }
}
export function readSpeed(): Speed {
  try { const n = Number(localStorage.getItem(SPEED_KEY)); return (SPEEDS as readonly number[]).includes(n) ? (n as Speed) : 1; } catch { return 1; }
}
export function writeSpeed(speed: Speed): void {
  try { localStorage.setItem(SPEED_KEY, String(speed)); } catch { /* storage unavailable */ }
}
/** A remembered position worth resuming: past the opening and not at the very end. */
export function resumable(position: number | null, duration: number): number | null {
  if (position === null || position < 5) return null;
  if (Number.isFinite(duration) && duration > 0 && position > duration - 5) return null;
  return position;
}
