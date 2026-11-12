import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { requestOverviewVoice } from "./overview-voice";

vi.mock("server-only", () => ({}));

const endpoint = "https://example--overview.modal.run/speech";
const body = '{"text":"Read the public overview.","voice":"host1"}';
const credentials = { "Modal-Key": "test-key", "Modal-Secret": "test-secret" };

beforeEach(() => {
  vi.stubEnv("PAC_HOSTED_VOICE_URL", "https://example--geffen.modal.run/");
  vi.stubEnv("PAC_HOSTED_VOICE_KEY", credentials["Modal-Key"]);
  vi.stubEnv("PAC_HOSTED_VOICE_SECRET", credentials["Modal-Secret"]);
  vi.stubEnv("PAC_OVERVIEW_VOICE_URL", endpoint);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function redirect(location: string | null, status = 303) {
  return new Response(null, { status, headers: location === null ? {} : { location } });
}

it("retrieves three Modal continuations with GET under the original deadline", async () => {
  const response = new Response('data: {"done":true,"voice":"host1"}\n\n', {
    headers: { "content-type": "text/event-stream" },
  });
  const fetcher = vi.fn<typeof fetch>()
    .mockResolvedValueOnce(redirect("?modal_result=fc-first"))
    .mockResolvedValueOnce(redirect("/speech?modal_result=fc-second"))
    .mockResolvedValueOnce(redirect(`${endpoint}?modal_result=fc-third`))
    .mockResolvedValueOnce(response);
  vi.stubGlobal("fetch", fetcher);
  const controller = new AbortController();
  const stream = await requestOverviewVoice("Read the public overview.", "host1", controller.signal);
  expect(await new Response(stream).text()).toBe('{"done":true,"voice":"host1"}\n');
  expect(fetcher).toHaveBeenCalledTimes(4);
  const [[initial, initialOptions], ...continuations] = fetcher.mock.calls;
  expect(String(initial)).toBe(endpoint);
  expect(initialOptions).toMatchObject({
    method: "POST", body, redirect: "manual", headers: { ...credentials, "content-type": "application/json" },
  });
  expect(continuations.map(([target]) => String(target))).toEqual(
    ["first", "second", "third"].map(id => `${endpoint}?modal_result=fc-${id}`),
  );
  for (const [, options] of continuations) {
    expect(options).toMatchObject({ method: "GET", redirect: "manual", headers: credentials });
    expect(options?.body).toBeUndefined();
    expect(options?.signal).toBe(initialOptions?.signal);
  }
  controller.abort();
  expect(initialOptions?.signal?.aborted).toBe(true);
});

it.each([
  null,
  "https://elsewhere.modal.run/speech?modal_result=fc-test",
  "http://example--overview.modal.run/speech?modal_result=fc-test",
  "https://example--overview.modal.run:8443/speech?modal_result=fc-test",
  "https://user@example--overview.modal.run/speech?modal_result=fc-test",
  "/health?modal_result=fc-test",
  "/speech",
  "?modal_result=",
  "?modal_result=fc-test&other=value",
  "?modal_result=fc-test&modal_result=fc-again",
  "?modal_result=fc-test%26other",
  "?modal_result=fc-test#fragment",
  `?modal_result=${"x".repeat(1025)}`,
])("rejects an unsafe or incomplete Modal continuation (%s)", async location => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(redirect(location));
  vi.stubGlobal("fetch", fetcher);
  await expect(requestOverviewVoice("Read the public overview.", "host1", AbortSignal.timeout(1000)))
    .rejects.toThrow("overview_voice_unavailable");
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it("does not follow another redirect status or a fourth continuation", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(redirect("?modal_result=fc-test", 307));
  vi.stubGlobal("fetch", fetcher);
  await expect(requestOverviewVoice("Read the public overview.", "host1", AbortSignal.timeout(1000)))
    .rejects.toThrow("overview_voice_unavailable");
  expect(fetcher).toHaveBeenCalledTimes(1);

  fetcher.mockReset().mockImplementation(async () => redirect("?modal_result=fc-test"));
  await expect(requestOverviewVoice("Read the public overview.", "host1", AbortSignal.timeout(1000)))
    .rejects.toThrow("overview_voice_unavailable");
  expect(fetcher).toHaveBeenCalledTimes(4);
});

it("stops before the continuation when the caller cancels", async () => {
  const controller = new AbortController();
  const fetcher = vi.fn<typeof fetch>().mockImplementationOnce(async () => {
    controller.abort();
    return redirect("?modal_result=fc-test");
  });
  vi.stubGlobal("fetch", fetcher);
  await expect(requestOverviewVoice("Read the public overview.", "host1", controller.signal))
    .rejects.toMatchObject({ name: "AbortError" });
  expect(fetcher).toHaveBeenCalledTimes(1);
});
