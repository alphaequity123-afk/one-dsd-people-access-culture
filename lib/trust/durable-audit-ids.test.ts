import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { durableAuditContentIds } from "./work-object-contract";

describe("audit IDs stored in the database", () => {
  it("keeps only IDs the database accepts", () => {
    expect(durableAuditContentIds(["pn-a", "ja-b", "hmong", "tool-c", "program-reading-d", "ref-dhs-equity-landscape", "research-hmong-person-0", "curriculum-A23", "profile-hmong-people-0", "calendar-hmong--new-year", "water-module-1-0"]))
      .toEqual(["pn-a", "ja-b", "hmong"]);
  });
  it("uses the same rule as the database's bootstrap", () => {
    const sql = readFileSync("db/standalone/bootstrap.sql", "utf8");
    const contract = readFileSync("lib/trust/work-object-contract.ts", "utf8");
    expect(contract).toContain(JSON.stringify(sql.match(/content_id !~ '([^']+)'/)![1]));
    expect(contract).toContain(JSON.stringify(sql.match(/or content_id ~\* '([^']+)'/)![1]));
  });
});
