import { afterEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ policy: { enabled: true, allowed_domains: ["mn.gov"], monthly_usd_cap: 25, daily_request_cap: 40 } }));
vi.mock("../memory/store", () => ({ getStore: () => ({ get: async () => state.policy }) }));
import { getResearchPolicy } from "./governance";
afterEach(() => vi.unstubAllEnvs());
it("opens public research beyond the previous saved list while retaining owner budgets", async () => {
  vi.stubEnv("PAC_RESEARCH_SCOPE", "open");
  const policy = await getResearchPolicy();
  expect(policy.allowed_domains).toEqual([]);
  expect(policy.monthly_usd_cap).toBe(25);
  expect(policy.daily_request_cap).toBe(40);
  expect(policy.enabled).toBe(true);
});
it("does not change a deliberately restricted deployment without the explicit setting", async () => {
  vi.stubEnv("PAC_RESEARCH_SCOPE", "government");
  expect((await getResearchPolicy()).allowed_domains).toEqual(["mn.gov"]);
});
