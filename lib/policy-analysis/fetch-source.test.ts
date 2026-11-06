import { describe, expect, it } from "vitest";
import { hostFamily, htmlToReadableText, sameHostFamily, stripClutterElements, truncateSourceText } from "./fetch-source";

// Mirrors the structure of a Minnesota Statutes page on revisor.mn.gov: the statute sits inside
// <main> next to a breadcrumb, previous/next links, an "Authenticate / PDF" list, a resource box
// that is hidden when printing, and a permalink anchor on every subdivision.
const REVISOR_LIKE = `<!doctype html><html><head><title>Sec. 256B.4905 MN Statutes</title></head><body>
<nav id="top-nav"><ul><li><a href="/">Home</a></li><li><a href="/statutes/">Statutes</a></li></ul></nav>
<main id="legContainerMain" class="container leg-content">
  <div id="breadcrumb" class="mb-3"><ul><li><a href="/statutes/">2026 Minnesota Statutes</a></li><li><a href="/statutes/cite/256B">Chapter 256B</a></li><li>Section 256B.4905</li></ul></div>
  <div id="doc_nav"><a class="previous" href="/statutes/cite/256B.49">256B.49</a> <a class="next" href="/statutes/cite/256B.4906">256B.4906</a></div>
  <div id="header" class="row mb-2 mt-3">
    <div class="col-12 col-md-8"><h1> 2026 Minnesota Statutes </h1></div>
    <div class="col-12 col-md-4"><ul class="pl-0"><li><a class="pdf_doc_type_link" href="/authenticate/">Authenticate</a></li><li><a class="pdf_doc_type_link" href="/statutes/cite/256B.4905/pdf"><i class="far fa-file-pdf"></i> PDF</a></li></ul></div>
  </div>
  <div class="row">
    <div id="resource_box" class="col-lg-3 order-2 mt-lg-4 d-print-none"><div class="card"><div class="card-header"><h3>Resources</h3></div><div class="card-body"><ul><li><a href="/statutes/cite/256B.4905/versions">Version List</a></li><li><a href="/statutes/history/256B.4905">Recent History</a></li></ul><div><div>Deeply nested <span>furniture</span></div></div></div></div></div>
    <div class="col-lg-9 order-1">
      <div id="xtend" class="statute">
        <div class="section" id="stat.256B.4905">
          <h1 class="shn">256B.4905 HOME AND COMMUNITY-BASED SERVICES POLICY STATEMENT.</h1>
          <div class="subd" id="stat.256B.4905.1a"><a title="Link to Subd. 1a." class="permalink" href="#stat.256B.4905.1a">§</a><h2 class="subd_no">Subd. 1a.<span class="headnote">Informed choice.</span></h2><p>For purposes of this section, "informed choice" means a voluntary decision made by the person.</p></div>
          <div class="subd" id="stat.256B.4905.2"><a class="permalink" href="#stat.256B.4905.2">§</a><h2 class="subd_no">Subd. 2.<span class="headnote">Rights.</span></h2><p>The legislature finds that people with disabilities have the right to choose.</p></div>
        </div>
      </div>
    </div>
  </div>
</main>
<footer><p>Copyright notice</p></footer>
</body></html>`;

describe("htmlToReadableText", () => {
  it("keeps the statute and its edition but drops the page furniture inside main", () => {
    const text = htmlToReadableText(REVISOR_LIKE);
    expect(text.startsWith("2026 Minnesota Statutes")).toBe(true);
    expect(text).toContain("256B.4905 HOME AND COMMUNITY-BASED SERVICES POLICY STATEMENT.");
    expect(text).toContain("Subd. 1a. Informed choice.");
    expect(text).toContain('"informed choice" means a voluntary decision made by the person.');
    expect(text).toContain("Subd. 2. Rights.");
    for (const clutter of ["Authenticate", "PDF", "Version List", "Recent History", "Chapter 256B", "256B.49\n", "256B.4906", "Resources", "Deeply nested", "furniture", "Copyright", "Home\n"]) {
      expect(text, clutter).not.toContain(clutter);
    }
    expect(text).not.toContain("§"); // the permalink symbol stays out of the text
  });

  it("removes elements marked as navigation or hidden, with everything nested inside them", () => {
    const html = `<div><div role="navigation"><div><a href="/a">A</a><div>B</div></div></div><p>Kept one.</p><section aria-hidden="true"><p>Hidden</p></section><p>Kept two.</p><div class="x  sidebar y"><div><div>Side</div></div></div><p>Kept three.</p></div>`;
    expect(htmlToReadableText(html)).toBe("Kept one.\n\nKept two.\n\nKept three.");
  });

  it("does not remove ordinary content whose names merely contain similar letters", () => {
    const html = `<div class="menuitems-note"><p>Not a menu.</p></div><div id="submenu-x"><p>Also kept: the name is one word.</p></div><div class="statute"><p>Statute text.</p></div>`;
    expect(stripClutterElements(html)).toContain("Not a menu.");
    expect(stripClutterElements(html)).toContain("Also kept");
    expect(htmlToReadableText(html)).toContain("Statute text.");
  });

  it("treats an unclosed clutter element as running to the end of the page", () => {
    expect(htmlToReadableText(`<p>Before.</p><div class="navbar"><p>Menu</p><p>More menu`)).toBe("Before.");
  });

  it("reads a page without a main element", () => {
    expect(htmlToReadableText(`<html><body><h1>Title</h1><p>Body &amp; more.</p></body></html>`)).toBe("Title\n\nBody & more.");
  });
});

describe("host families and truncation", () => {
  it("groups state sites by their third-level domain and others by their second", () => {
    expect(hostFamily("www.dhs.state.mn.us")).toBe("state.mn.us");
    expect(hostFamily("www.revisor.mn.gov")).toBe("mn.gov");
    expect(sameHostFamily(new URL("https://www.revisor.mn.gov/a"), new URL("https://mn.gov/b"))).toBe(true);
    expect(sameHostFamily(new URL("https://www.revisor.mn.gov/a"), new URL("https://example.com/b"))).toBe(false);
  });

  it("shortens long text with a visible note", () => {
    const text = truncateSourceText("x".repeat(500), 200);
    expect(text.length).toBeLessThanOrEqual(200);
    expect(text).toContain("[The text was shortened here");
  });
});
