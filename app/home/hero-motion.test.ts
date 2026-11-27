import { expect, it } from 'vitest';
import { chooseHeroSource } from './hero-motion';

const sources = [
  { src: '/4k.mp4', width: 3840 }, { src: '/720.mp4', width: 1280 },
  { src: '/1440.mp4', width: 2560 }, { src: '/1080.mp4', width: 1920 },
];

it('chooses the smallest encoding that covers the frame at the screen density', () => {
  expect(chooseHeroSource(sources, 390, 3)).toBe('/720.mp4');
  expect(chooseHeroSource(sources, 1280, 1)).toBe('/720.mp4');
  expect(chooseHeroSource(sources, 1440, 1)).toBe('/1080.mp4');
  expect(chooseHeroSource(sources, 1440, 1.5)).toBe('/1440.mp4');
  expect(chooseHeroSource(sources, 1512, 2)).toBe('/4k.mp4');
});

it('falls back to the widest encoding for larger screens and treats a missing density as 1', () => {
  expect(chooseHeroSource(sources, 5120, 1)).toBe('/4k.mp4');
  expect(chooseHeroSource(sources, 1200, Number.NaN)).toBe('/720.mp4');
  expect(chooseHeroSource(sources, 0, 0)).toBe('/720.mp4');
});
