import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { AnswerView } from './ask-client';
import type { StaffAskAnswer } from '@/lib/intelligence/agents/ask';

it('lists a shared transcript once while retaining each cited passage', () => {
  const source = (id: string) => ({ title: 'Public transcript', href: '/learn/example', authorityLabel: '', authorityDescription: '', reviewLabel: '', evidence: { evidenceId: id } });
  const answer = {
    shortAnswer: 'An answer', whyItMatters: '', limits: [], nextActions: [],
    sources: [source('first'), source('second')],
    evidenceClaims: [
      { kind: 'inference', text: 'First claim', references: [{ evidenceId: 'first', quote: 'First passage' }] },
      { kind: 'inference', text: 'Second claim', references: [{ evidenceId: 'second', quote: 'Second passage' }] },
    ],
  } as unknown as StaffAskAnswer;
  const html = renderToStaticMarkup(<AnswerView answer={answer} onPrepareConsult={() => {}} intakeEnabled={false} dsdContext={true} copy={{}} context="one_dsd" />);
  expect(html).toContain('First passage');
  expect(html).toContain('Second passage');
  expect(html).toContain('Related program reading (1)');
  expect((html.match(/<li[^>]*><a href="\/learn\/example"/g) || [])).toHaveLength(1);
});
