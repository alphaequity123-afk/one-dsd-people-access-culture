import { afterEach, expect, it, vi } from "vitest";
import { isSameOriginMutation } from "./mutation";
afterEach(() => vi.unstubAllEnvs());
it("accepts only the configured agency and existing division origins in zone mode", () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('PAC_PUBLIC_ORIGIN', 'https://division.example');
  vi.stubEnv('NEXT_PUBLIC_DHS_AGENCY_ZONE', '1');
  vi.stubEnv('NEXT_PUBLIC_DHS_AGENCY_ORIGIN', 'https://agency.example');
  const accepts = (origin: string) => isSameOriginMutation(new Request('http://internal/api/ask', { headers: { origin, 'x-forwarded-host': 'attacker.example', 'x-forwarded-proto': 'https' } }));
  expect(accepts('https://division.example')).toBe(true);
  expect(accepts('https://agency.example')).toBe(true);
  for (const origin of ['https://attacker.example', 'https://agency.example.attacker.example', 'http://agency.example', 'https://agency.example/path']) expect(accepts(origin)).toBe(false);
  vi.stubEnv('NEXT_PUBLIC_DHS_AGENCY_ZONE', '0');
  expect(accepts('https://agency.example')).toBe(false);
});
