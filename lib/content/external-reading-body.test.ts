import {describe,it,expect,vi} from "vitest";
vi.mock("./external-readings", async () => ({
  ...await vi.importActual<typeof import("./external-readings")>("./external-readings"),
  externalReadingHref: (url: string) => url === "https://example.org/retained" ? "/source-reading/retained" : undefined,
  externalSourceHref: (url: string) => url === "https://example.org/missing" ? undefined : url === "https://example.org/moved" ? "https://example.org/current" : url,
}));
import {readingSectionHtml} from "./external-reading-body";

describe("reading title presentation",()=>{
  it("shows the shared title once and preserves its original anchor and body",()=>{
    const html='<h2 id="top">A source guide</h2><p>The complete source text.</p><h2 id="detail">More detail</h2>';
    const result=readingSectionHtml(html,"A source guide",true);
    expect(result).toContain('<span id="top"></span>');
    expect(result).toContain('<p>The complete source text.</p>');
    expect(result).toContain('<h2 id="detail">More detail</h2>');
    expect(readingSectionHtml(html,"A different title",true)).toBe(html);
    expect(readingSectionHtml(html,"A source guide",false)).toBe(html);
  });
});

describe("source navigation without changing source wording", () => {
  it("repairs verified moved references and keeps unavailable citation text on any section", () => {
    const html = '<p>Read <a id="reference" href="https://example.org/moved">the original study</a> and <a href="https://example.org/missing" target="_blank" rel="noreferrer">the historical report</a>.</p>';
    const result = readingSectionHtml(html,"A source guide",false);
    expect(result).toContain('<a id="reference" href="https://example.org/current">the original study</a>');
    expect(result).toContain('<span>the historical report</span>');
    expect(result).not.toContain('href="https://example.org/missing"');
  });
  it("keeps a complete approved in-app reading accessible when its original URL is retained only as provenance", () => {
    expect(readingSectionHtml('<p><a href="https://example.org/retained">A complete guide</a></p>',"Other title",false)).toContain('<a href="/source-reading/retained">A complete guide</a>');
  });
});
