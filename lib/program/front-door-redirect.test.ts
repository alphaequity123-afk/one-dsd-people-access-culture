import { describe, expect, it } from "vitest";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import nextConfig from "@/next.config";

const OLD_HOST = "one-people-access-culture.up.railway.app";

async function frontDoorRedirects() {
  const all = (await nextConfig.redirects?.()) ?? [];
  return all.filter(rule => rule.has?.some(condition => condition.type === "host" && condition.value === OLD_HOST));
}

async function redirectedAway(pathname: string) {
  const rules = await frontDoorRedirects();
  return rules.some(rule => getPathMatch(rule.source, { removeUnnamedParams: true })(pathname) !== false);
}

describe("old address redirect to the One DSD front door", () => {
  it("still sends pages on the old address to the front door", async () => {
    expect(await frontDoorRedirects()).toHaveLength(2);
    expect(await redirectedAway("/")).toBe(true);
    expect(await redirectedAway("/learn")).toBe(true);
    expect(await redirectedAway("/site-map")).toBe(true);
    expect(await redirectedAway("/favicon.ico.html")).toBe(true);
  });

  it("keeps the owner tools under /api on this site", async () => {
    expect(await redirectedAway("/api/health")).toBe(false);
    expect(await redirectedAway("/api")).toBe(false);
  });

  it("answers the tab icon here, so the front door does not loop", async () => {
    expect(await redirectedAway("/favicon.ico")).toBe(false);
    const rewrites = await nextConfig.rewrites?.();
    const list = Array.isArray(rewrites) ? rewrites : [...(rewrites?.beforeFiles ?? []), ...(rewrites?.afterFiles ?? []), ...(rewrites?.fallback ?? [])];
    expect(list).toContainEqual({ source: "/favicon.ico", destination: "/icon.svg" });
  });
});
