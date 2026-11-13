import {describe,it,expect} from "vitest";
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
