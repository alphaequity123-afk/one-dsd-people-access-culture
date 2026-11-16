import { describe, expect, it } from "vitest";
import { claimsCounting, getForms, usageTablesInSql, writeSitesInText } from "./checks.ts";

describe("A9 usage-like tables in migrations", () => {
  it("is not a finding when a later migration drops the table, in apply order", () => {
    const live = usageTablesInSql([
      { file: "db/standalone/0073_pac_dsd_drop_usage_records.sql", text: "drop table if exists pac_dsd.runtime_counters;\n" },
      { file: "db/migrations/0073_pac_drop_usage_records.sql", text: "-- drop table if exists pac.runtime_audit_events;\ndrop table if exists pac.ask_response_records, pac.runtime_counters;\n" },
      { file: "db/migrations/0002_pac_runtime_store.sql", text: "create table if not exists pac.runtime_audit_events (\ncreate table if not exists pac.runtime_counters (\n" },
      { file: "db/migrations/0030_pac_ask_response_records.sql", text: "create table pac.ask_response_records (\n" },
      { file: "db/standalone/bootstrap.sql", text: "create table if not exists pac_dsd.runtime_counters (\r\ncreate table pac_dsd.ask_response_records (\r\n" },
    ]);
    // The forward file applies after bootstrap.sql; a commented-out drop does not count.
    expect(live.map(h => `${h.file}:${h.line} ${h.table}`)).toEqual([
      "db/migrations/0002_pac_runtime_store.sql:1 runtime_audit_events",
      "db/standalone/bootstrap.sql:2 ask_response_records",
    ]);
  });

  it("is a finding when the table is created again after its drop", () => {
    const live = usageTablesInSql([{ file: "db/migrations/0001_x.sql", text: "drop table if exists pac.page_views;\ncreate table pac.page_views (\n" }]);
    expect(live.map(h => h.table)).toEqual(["page_views"]);
  });
});

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

  it("flags GET forms whose action is a constant path or a string in braces, not a server-action function", () => {
    const hits = getForms("app/y/page.tsx", `
      const BASE = "/learn/readings";
      const base = "/minnesota-agencies";
      const LIST = BASE + "?view=all";
      async function save(data: FormData) { "use server"; }
      const remove = async (data: FormData) => { "use server"; };
      export default function P() { return <>
        <form method="get" action={BASE}><input name="q" type="search" /></form>
        <form action={base} role="search"><input name="q" /></form>
        <form action={"/library"}><input name="q" /></form>
        <form action={\`/x\`}><input name="q" /></form>
        <form action={LIST}><input name="q" /></form>
        <form action={save}><input name="title" /></form>
        <form action={remove}><input name="title" /></form>
        <form method="get" action={BASE}><select name="theme" /></form>
      </>; }`);
    expect(hits.map(h => h.line)).toEqual([8, 9, 10, 11, 12]);
  });

  it("recognizes visible text that claims counting, not census counting", () => {
    expect(claimsCounting("When you finish a review on this site, one is added to an anonymous count.")).toBe(true);
    expect(claimsCounting("Completed reviews are not counted yet.")).toBe(true);
    expect(claimsCounting("Ethiopians are counted in the Ethiopian group in the census.")).toBe(false);
  });
});
