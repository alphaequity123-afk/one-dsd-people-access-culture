import { describe, expect, it } from "vitest";
import { directorToolkitDocs } from "./director-toolkit-docs";

describe("retired Equity Director toolkit", () => {
  it("returns no Ask resources in either application scope", () => {
    expect(directorToolkitDocs("one-dhs")).toEqual([]);
    expect(directorToolkitDocs("dsd")).toEqual([]);
  });
});
