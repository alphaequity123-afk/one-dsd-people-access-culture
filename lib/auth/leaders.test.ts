import { afterEach, describe, expect, it } from "vitest";
import { isLeadersSession, issueLeadersCookieValue, leadersConfigured, leadersKey, verifyLeadersKey } from "./leaders";

const KEY = "leaders-test-key-with-at-least-thirty-two-bytes";
afterEach(() => { delete process.env.PAC_LEADERS_KEY; delete process.env.PAC_OWNER_KEY; });

describe("leaders access", () => {
  it("accepts only the configured key", () => {
    process.env.PAC_LEADERS_KEY = KEY;
    expect(leadersConfigured()).toBe(true);
    expect(verifyLeadersKey(KEY)).toBe(true);
    expect(verifyLeadersKey(KEY + "x")).toBe(false);
    expect(verifyLeadersKey("")).toBe(false);
  });
  it("issues a cookie that verifies, expires, and rejects tampering or another key", () => {
    process.env.PAC_LEADERS_KEY = KEY;
    const value = issueLeadersCookieValue(1_700_000_000_000)!;
    expect(isLeadersSession(value, 1_700_000_000_000 + 60_000)).toBe(true);
    expect(isLeadersSession(value, 1_700_000_000_000 + 13 * 3_600_000)).toBe(false);
    expect(isLeadersSession(value.slice(0, -2) + "zz", 1_700_000_000_000 + 60_000)).toBe(false);
    process.env.PAC_LEADERS_KEY = KEY + "-other";
    expect(isLeadersSession(value, 1_700_000_000_000 + 60_000)).toBe(false);
  });
  it("derives a stable shared key from the consultant key when none is set", () => {
    process.env.PAC_OWNER_KEY = "owner-test-key-with-at-least-thirty-two-bytes!";
    const derived = leadersKey()!;
    expect(derived).toHaveLength(40);
    expect(verifyLeadersKey(derived)).toBe(true);
    expect(verifyLeadersKey("owner-test-key-with-at-least-thirty-two-bytes!")).toBe(false);
    process.env.PAC_LEADERS_KEY = KEY;
    expect(leadersKey()).toBe(KEY);
  });
  it("is locked when no key is configured outside development", () => {
    if (process.env.NODE_ENV === "development") return;
    expect(leadersConfigured()).toBe(false);
    expect(issueLeadersCookieValue()).toBeNull();
    expect(isLeadersSession("v1.a.b")).toBe(false);
  });
});
