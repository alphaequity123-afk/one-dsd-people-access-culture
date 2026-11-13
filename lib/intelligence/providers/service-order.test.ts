import { afterEach, describe, expect, it, vi } from "vitest";
import { generativeStatus, resolveBinding } from "./index";
import { getAgent } from "../registry/agents";

const ask = getAgent("ask_concierge");
const answer = { fallback: true };
const clear = () => { for (const name of ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "OPENROUTER_API_KEY", "PAC_OPENROUTER_MODEL", "PAC_CLONE_AGENTS"]) vi.stubEnv(name, ""); };
afterEach(() => vi.unstubAllEnvs());

describe("choosing a reasoning service", () => {
  it("stays on the built-in composer when the reasoning switch is off, whatever is connected", () => {
    clear(); vi.stubEnv("PAC_GENERATIVE_PILOT", "off"); vi.stubEnv("OPENAI_API_KEY", "k");
    expect(resolveBinding(ask)).toMatchObject({ generative: false, reasonCode: "pilot_flag_off" });
  });

  it("reports a missing credential when nothing is connected", () => {
    clear(); vi.stubEnv("PAC_GENERATIVE_PILOT", "on");
    expect(resolveBinding(ask)).toMatchObject({ generative: false, reasonCode: "pilot_credential_missing" });
    expect(generativeStatus()).toMatchObject({ credential: false, active: false });
  });

  it("uses direct OpenAI first and Claude as the connected fallback", () => {
    clear(); vi.stubEnv("PAC_GENERATIVE_PILOT", "on");
    vi.stubEnv("OPENROUTER_API_KEY", "k");
    expect(resolveBinding(ask, answer)).toMatchObject({ generative: false });
    vi.stubEnv("ANTHROPIC_API_KEY", "k");
    expect(resolveBinding(ask, answer).model.provider_id).toBe("anthropic");
    vi.stubEnv("OPENAI_API_KEY", "k");
    expect(resolveBinding(ask, answer).model.provider_id).toBe("openai");
    expect(generativeStatus()).toMatchObject({ credential: true, active: true });
  });

  it("uses direct OpenAI even when a legacy OpenRouter key is set", () => {
    clear(); vi.stubEnv("PAC_GENERATIVE_PILOT", "on"); vi.stubEnv("PAC_CLONE_AGENTS", "on");
    vi.stubEnv("OPENAI_API_KEY", "k"); vi.stubEnv("OPENROUTER_API_KEY", "k");
    expect(resolveBinding(ask).model.provider_id).toBe("openai");
  });

  it("keeps other work, such as document analysis, on its preferred service only", () => {
    clear(); vi.stubEnv("PAC_GENERATIVE_PILOT", "on"); vi.stubEnv("ANTHROPIC_API_KEY", "k"); vi.stubEnv("OPENROUTER_API_KEY", "k");
    expect(resolveBinding(ask)).toMatchObject({ generative: false, reasonCode: "pilot_credential_missing" });
    expect(resolveBinding(ask, answer).model.provider_id).toBe("anthropic");
  });
});
