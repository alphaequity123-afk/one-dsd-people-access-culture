import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('next/navigation', () => ({usePathname: () => '/example'}));
import { UniversalEditor } from './universal-editor';

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.innerHTML = ''; });

it('does not index page text for a reader when no saved edits exist', async () => {
  document.body.innerHTML = '<main><p>Original wording.</p></main>';
  const scan = vi.spyOn(document, 'querySelectorAll');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok:true, json:async()=>({ok:true, entries:[], images:[]})}));
  render(<UniversalEditor owner={false} />);
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  await new Promise(resolve => setTimeout(resolve, 20));
  expect(scan.mock.calls.filter(([selector]) => selector === 'main, footer')).toHaveLength(0);
  expect(document.querySelector('main')?.textContent).toBe('Original wording.');
});

it('still applies saved reader wording and observes newly streamed content', async () => {
  document.body.innerHTML = '<main><p>Original wording.</p></main>';
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok:true, json:async()=>({ok:true, entries:[{key:'p:0:saved',original:'Original wording.',text:'Reviewed wording.'}], images:[]})}));
  render(<UniversalEditor owner={false} />);
  await waitFor(() => expect(document.querySelector('main p')?.textContent).toBe('Reviewed wording.'));
  document.querySelector('main')!.innerHTML = '<p>Original wording.</p>';
  await waitFor(() => expect(document.querySelector('main p')?.textContent).toBe('Reviewed wording.'));
});

it('still prepares an unedited page for the owner to edit', async () => {
  document.body.innerHTML = '<main><p>Original wording.</p></main>';
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok:true, json:async()=>({ok:true, entries:[], images:[]})}));
  render(<UniversalEditor owner={true} />);
  const button = await screen.findByRole('button', {name:'Edit wording and images'});
  await waitFor(() => expect(button.hasAttribute('disabled')).toBe(false));
  fireEvent.click(button);
  await waitFor(() => expect(document.querySelector('main p')?.getAttribute('contenteditable')).toBe('true'));
});
