import { describe, expect, it } from "vitest";
import { agencyTitle, dsdFrontDoorHosts, frontDoorScript, toFrontDoor } from "./front-door";

const DSD = "https://dsd.example";
const DHS = "https://agency.example";

describe("One DSD front door", () => {
  it("lists the front door host and any extra hosts once, in lower case", () => {
    expect(dsdFrontDoorHosts(DSD, " Old.Example ,dsd.example,")).toEqual(["dsd.example", "old.example"]);
    expect(dsdFrontDoorHosts("", "")).toEqual([]);
  });

  it("adds no script when no front door is configured", () => {
    expect(frontDoorScript([], "")).toBe("");
    expect(frontDoorScript(["dsd.example"], "")).toContain('["dsd.example"]');
    expect(frontDoorScript([], "agency.example")).toContain('"agency.example"');
  });

  it("moves agency links to the same page on the One DSD front door", () => {
    expect(toFrontDoor(`${DHS}/learn?x=1#top`, DHS, DSD)).toBe(`${DSD}/learn?x=1#top`);
    expect(toFrontDoor(`${DHS}/`, `${DHS}/`, DSD)).toBe(`${DSD}/`);
  });

  it("leaves other links and unconfigured setups alone", () => {
    expect(toFrontDoor("https://mn.gov/dhs/", DHS, DSD)).toBe("https://mn.gov/dhs/");
    expect(toFrontDoor(`${DHS}/learn`, DHS, "")).toBe(`${DHS}/learn`);
    expect(toFrontDoor("/learn", DHS, DSD)).toBe("/learn");
  });
});

describe("tab title on the One DHS address", () => {
  it("names One DHS in place of One DSD and leaves the page name alone", () => {
    expect(agencyTitle("Equity workspace | One DSD People, Access and Culture")).toBe("Equity workspace | One DHS People, Access and Culture");
    expect(agencyTitle("One DSD People, Access and Culture")).toBe("One DHS People, Access and Culture");
    expect(agencyTitle("Disability Services Division")).toBe("Disability Services Division");
  });

  it("runs as written in a page on the agency address", () => {
    const head = { title: "Equity workspace | One DSD People, Access and Culture" };
    const observed: unknown[] = [];
    const run = new Function("location", "document", "MutationObserver", frontDoorScript(["dsd.example"], "agency.example"));
    run({ host: "agency.example" }, { get title() { return head.title; }, set title(v: string) { head.title = v; }, head: {}, documentElement: { setAttribute() {} } },
      class { constructor(cb: unknown) { observed.push(cb); } observe() {} });
    expect(head.title).toBe("Equity workspace | One DHS People, Access and Culture");
    expect(observed).toHaveLength(1);
  });
});
