import React from 'react';
import { PassThrough } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';

const calendar = vi.hoisted(() => ({load: vi.fn()}));
vi.mock('@/lib/content/cultural-calendar', () => ({publishedCalendar: calendar.load}));
vi.mock('@/lib/content/culture-calendar-grid', () => ({
  CALENDAR_PATH:'/calendar', chicagoToday:()=> '2026-11-26', compactCalendar:(value:unknown)=>value,
  upcomingObservances:(value:unknown)=>value, shortDateRange:()=> 'November 27',
}));
vi.mock('@/components/app-link', () => ({default: ({children,href}: {children:React.ReactNode;href:string}) => React.createElement('a',{href},children)}));
vi.mock('next/image', () => ({default: () => null}));
vi.mock('@/components/water-collection-feature', () => ({WaterCollectionFeature:()=>null}));
vi.mock('@/components/home-task-finder', () => ({HomeTaskFinder:()=>null}));
vi.mock('./hero-motion', () => ({HeroMotion:({children}: {children:React.ReactNode})=>children}));
import HomePage from './page';

afterEach(() => vi.unstubAllGlobals());

it('streams the main content before the calendar resolves, then includes the calendar', async () => {
  vi.stubGlobal('React', React);
  let release!: (entries: unknown[])=>void;
  calendar.load.mockReturnValue(new Promise(resolve => {release=resolve;}));
  let html = '';
  const errors: unknown[] = [];
  const sink = new PassThrough();
  sink.on('data', chunk => { html += chunk.toString(); });
  const ended = new Promise<void>(resolve => sink.on('end', resolve));
  const stream = renderToPipeableStream(React.createElement(HomePage), {
    onShellReady: () => stream.pipe(sink), onError: error => {errors.push(error);},
  });
  try {
    await vi.waitFor(() => expect(html).toContain('People, Access and Culture'));
    expect(html).toContain('Loading upcoming observances');
    expect(html).not.toContain('Test observance');
    release([{id:'test',href:'/calendar#test',name:'Test observance',start:'2026-11-27',end:'2026-11-27'}]);
    await ended;
    expect(html).toContain('Test observance');
    expect(errors).toEqual([]);
  } finally { stream.abort(); sink.destroy(); }
});
