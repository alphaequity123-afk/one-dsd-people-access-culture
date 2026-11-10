import upgraded from './image-4k-paths.json';

/**
 * 4K image upgrade (owner request 2026-11-10). Each listed public image has a sibling
 * "<name>.4k.webp" (re-exported slide or upscaled photo). The original stays in place, so
 * every existing link keeps working; requests for it are answered with the 4K sibling.
 */
const PATHS: ReadonlySet<string> = new Set(upgraded as string[]);

export const IMAGE_4K_SOURCE = /\.(?:png|jpe?g|webp)$/i;

export function upgradedImagePath(pathname: string): string | undefined {
  if (!IMAGE_4K_SOURCE.test(pathname) || pathname.endsWith('.4k.webp')) return undefined;
  let decoded: string;
  try { decoded = decodeURIComponent(pathname); } catch { return undefined; }
  if (!PATHS.has(decoded)) return undefined;
  return pathname.replace(IMAGE_4K_SOURCE, '.4k.webp');
}
