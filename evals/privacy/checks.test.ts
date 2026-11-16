import { describe, expect, it } from "vitest";
import { claimsCounting, getForms, writeSitesInText } from "./checks.ts";

describe("A9 static privacy checks", () => {
  it("finds data-changing SQL, stored functions and file writes, not prose", () => {
    const code = [
      "await sql`insert into pac_dsd.runtime_counters (scope, counter_value) values ($1, 1)`;",
      "db.prepare(\"UPDATE runs SET status=? WHERE id=?\").run(status, id);",
      "await sql`select pac_dsd.append_ask_response_record(${record})`;",
      "await sql`select pac_dsd.read_surface_editing_state($1)`;",
      "await fs.appendFile(path.join(root, \"audit.jsonl\"), line);",
      "const text = \"Insert into the plan only what you checked, and copy it for the team.\";",
      "// insert into comments are ignored",
    ].join("\n");
    const hits = writeSitesInText("lib/example.ts", code).map(h => `${h.line} ${h.what}`);
    expect(hits).toEqual([
      "1 insert into pac_dsd.runtime_counters",
      "2 update runs",
      "3 stored function append_ask_response_record()",
      "5 file appendFile(path.join(root)",
    ]);
  });

  it("flags GET forms that put typed text in the address, not POST, server-action or handled forms", () => {
    const hits = getForms("app/x/page.tsx", `
      export default function P() { return <>
        <form action="/search"><input name="q" /></form>
        <form method="post" action="/api/x"><textarea name="note" /></form>
        <form action={save}><input name="title" /></form>
        <form onSubmit={submit}><input /></form>
        <form action="/library"><input type="checkbox" name="topic" /></form>
      </>; }`);
    expect(hits.map(h => h.line)).toEqual([3]);
  });

  it("recognizes visible text that claims counting, not census counting", () => {
    expect(claimsCounting("When you finish a review on this site, one is added to an anonymous count.")).toBe(true);
    expect(claimsCounting("Completed reviews are not counted yet.")).toBe(true);
    expect(claimsCounting("Ethiopians are counted in the Ethiopian group in the census.")).toBe(false);
  });
});
