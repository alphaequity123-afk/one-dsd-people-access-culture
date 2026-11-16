import { expect, it, vi } from 'vitest';
import { assertWorkObjectPersistence } from '@/lib/trust/work-object-contract';

const ledger = vi.hoisted(() => new Map<string, unknown>());
vi.mock('../memory/store', () => ({ getStore: () => ({
  put: async (kind: 'decision', id: string, value: unknown) => {
    assertWorkObjectPersistence(kind, id, value);
    ledger.set(id, value);
  },
}) }));
vi.mock('@/lib/privacy/opaque-identifiers', async original => ({
  ...await original<typeof import('@/lib/privacy/opaque-identifiers')>(),
  operationalResearchModel: async () => 'msh_' + 'a'.repeat(64),
}));
import { recordUsage, type ResearchUsageEvent } from './governance';

it('keeps both billed attempts under the existing storage contract', async () => {
  const event: Omit<ResearchUsageEvent, 'id'> = {at: '2026-11-13T13:00:00.000Z', provider: 'perplexity_agent',
    model:'test',depth:'current_web',domains:[],estimated_usd:0.01,
    ok:false,error_code:'research_unresolved_citation',latency_ms:10,trace_id:'12345678-1234-4abc-8abc-123456789abc'};
  await recordUsage(event);
  await recordUsage({...event,provider:'openai_web',ok:true,estimated_usd:0.02});
  expect(ledger.size).toBe(2);
  expect([...ledger.values()].reduce<number>((total, value) => total+(value as ResearchUsageEvent).estimated_usd,0)).toBeCloseTo(0.03);
});
