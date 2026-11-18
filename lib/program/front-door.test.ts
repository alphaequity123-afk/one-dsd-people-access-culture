import { describe, expect, it } from "vitest";
import { dsdFrontDoorHosts, frontDoorScript, toFrontDoor } from "./front-door";

const DSD = "https://dsd.example";
const DHS = "https://agency.example";

describe("One DSD front door", () => {
  it("lists the front door host and any extra hosts once, in lower case", () => {
    expect(dsdFrontDoorHosts(DSD, " Old.Example ,dsd.example,")).toEqual(["dsd.example", "old.example"]);
    expect(dsdFrontDoorHosts("", "")).toEqual([]);
  });

  it("adds no script when no front door is configured", () => {
    expect(frontDoorScript([])).toBe("");
    expect(frontDoorScript(["dsd.example"])).toContain('["dsd.example"]');
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
