/**
 * Options are shown in a stable shuffled order, so the strong option's place in the file never gives it away.
 * The order depends only on the decision id: the same for everyone, every time, and the same on server and page.
 */
function seedOf(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function stableShuffle<T>(items: readonly T[], key: string): T[] {
  const out = [...items];
  let s = seedOf(key) || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = Math.imul(s ^ (s >>> 15), 2246822507) >>> 0;
    s = Math.imul(s ^ (s >>> 13), 3266489909) >>> 0;
    s = (s ^ (s >>> 16)) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
