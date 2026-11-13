import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ToolContext } from '../types';

const controls = vi.hoisted(() => ({
  policy: { provider_order: ['perplexity_agent', 'openai_web'], allowed_domains: ['mn.gov'], recency: 'any' },
  admit: vi.fn(), usage: vi.fn(),
}));
vi.mock('./governance', () => ({
  getResearchPolicy: async () => controls.policy,
  admitResearch: (...args: unknown[]) => controls.admit(...args),
  hashQuery: async () => 'a123456789012345',
  recordUsage: (...args: unknown[]) => controls.usage(...args),
}));
vi.mock('../tools/runtime', () => ({runTool: async (_ctx: unknown, _name: string, run: () => unknown) => run()}));

import { governedResearch } from './index';
import { getResearchProvider } from './providers';

const context = {trace_id: 'test-research', role: 'staff'} as ToolContext;
const output = { provider: 'openai_web' as const, model: 'gpt-4.1', depth: 'current_web' as const,
  answer: 'Verified guidance [1].', sources: [{title: 'Guidance', url: 'https://mn.gov/guidance', domain: 'mn.gov'}],
  searchedAt: new Date().toISOString(), usage: {}, estimated_usd: 0.01 };

beforeEach(() => {
  vi.stubEnv('PERPLEXITY_API_KEY', 'test');
  vi.stubEnv('OPENAI_API_KEY', 'test');
  controls.policy.provider_order = ['perplexity_agent', 'openai_web'];
  controls.admit.mockReset().mockImplementation(async () => ({ok: true, policy: controls.policy}));
  controls.usage.mockReset().mockResolvedValue(undefined);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

it('rechecks admission and tries the configured alternate after rejected citations', async () => {
  const primary = vi.spyOn(getResearchProvider('perplexity_agent'), 'run').mockRejectedValue(new Error('research_unresolved_citation'));
  const alternate = vi.spyOn(getResearchProvider('openai_web'), 'run').mockResolvedValue(output);
  const result = await governedResearch('Public guidance', 'current_web', true, context);
  expect(result.status).toBe('used');
  expect(primary).toHaveBeenCalledTimes(1);
  expect(alternate).toHaveBeenCalledTimes(1);
  expect(alternate.mock.calls[0][0].allowed_domains).toEqual(['mn.gov']);
  expect(controls.admit).toHaveBeenCalledTimes(2);
  expect(controls.usage.mock.calls.map(call => call[0].ok)).toEqual([false, true]);
});

it('honors a reached budget before the alternate call', async () => {
  vi.spyOn(getResearchProvider('perplexity_agent'), 'run').mockRejectedValue(new Error('research_unresolved_citation'));
  const alternate = vi.spyOn(getResearchProvider('openai_web'), 'run').mockResolvedValue(output);
  controls.admit.mockResolvedValueOnce({ok: true, policy: controls.policy}).mockResolvedValueOnce({ok: false, reason: 'monthly_cap_reached', message: 'Budget reached'});
  expect(await governedResearch('Public guidance', 'current_web', true, context)).toMatchObject({status: 'not_admitted', reason: 'monthly_cap_reached'});
  expect(alternate).not.toHaveBeenCalled();
});

it('does not retry excluded-source, owner-stop, or deep-research failures', async () => {
  const primary = vi.spyOn(getResearchProvider('perplexity_agent'), 'run').mockRejectedValue(new Error('research_excluded_source'));
  const alternate = vi.spyOn(getResearchProvider('openai_web'), 'run').mockResolvedValue(output);
  expect((await governedResearch('Public guidance', 'current_web', true, context)).status).toBe('failed');
  primary.mockRejectedValue(new Error('owner_stop'));
  expect((await governedResearch('Public guidance', 'current_web', true, context)).status).toBe('failed');
  primary.mockRejectedValue(new Error('research_timeout'));
  expect((await governedResearch('Public guidance', 'deep_research', true, context)).status).toBe('failed');
  expect(alternate).not.toHaveBeenCalled();
});

it('never invents an alternate outside the owner order and stops after two failures', async () => {
  const primary = vi.spyOn(getResearchProvider('perplexity_agent'), 'run').mockRejectedValue(new Error('research_unresolved_citation'));
  const alternate = vi.spyOn(getResearchProvider('openai_web'), 'run').mockRejectedValue(new Error('research_missing_citation'));
  expect((await governedResearch('Public guidance', 'current_web', true, context)).status).toBe('failed');
  expect(primary).toHaveBeenCalledTimes(1);
  expect(alternate).toHaveBeenCalledTimes(1);
  controls.policy.provider_order = ['perplexity_agent'];
  await governedResearch('Public guidance', 'current_web', true, context);
  expect(alternate).toHaveBeenCalledTimes(1);
});
