import { expect, it } from "vitest";
import { POST } from "./route";

it("answers 410 for the retired learning assistant without reaching any provider", async () => {
  const response = await POST();
  expect(response.status).toBe(410);
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect((await response.json()).error).toContain("removed");
});
