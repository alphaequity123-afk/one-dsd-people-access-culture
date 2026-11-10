import { describe, expect, it } from 'vitest';
import upgraded from './image-4k-paths.json';
import { upgradedImagePath } from './image-4k';

describe('4K image upgrade', () => {
  const sample = (upgraded as string[])[0];

  it('answers a listed image with its 4K sibling', () => {
    if (!sample) return;
    expect(upgradedImagePath(sample)).toBe(sample.replace(/\.(?:png|jpe?g|webp)$/i, '.4k.webp'));
  });

  it('leaves unlisted images, 4K files and pages alone', () => {
    expect(upgradedImagePath('/images/not-a-listed-image.jpg')).toBeUndefined();
    expect(upgradedImagePath('/images/covers/anything.4k.webp')).toBeUndefined();
    expect(upgradedImagePath('/learn/equity-toolkit')).toBeUndefined();
    expect(upgradedImagePath('/images/%E0%A4%A.jpg')).toBeUndefined();
  });

  it('lists only safe public image paths with no duplicates', () => {
    const list = upgraded as string[];
    expect(new Set(list).size).toBe(list.length);
    for (const p of list) {
      expect(p.startsWith('/')).toBe(true);
      expect(p).not.toMatch(/\.\.|\\|\.4k\.webp$/);
      expect(p).toMatch(/\.(?:png|jpe?g|webp)$/i);
    }
  });
});
