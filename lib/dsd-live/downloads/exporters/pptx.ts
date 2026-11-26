import PptxGenJS from "pptxgenjs";
import { runsToText, type DocumentBlock, type InlineRun, type ResourceDocument } from "../model";
import { DOWNLOAD_THEME as T } from "../theme";

// pptxgenjs is a serverExternalPackage. CJS is `module.exports = Class`;
// some Next interop paths wrap that as `{ default: Class }`.
const PptxCtor = (typeof PptxGenJS === "function"
  ? PptxGenJS
  : (PptxGenJS as unknown as { default: typeof PptxGenJS }).default);

const FONT = "Calibri";
const SLIDE_WIDTH = 10;
const BODY_TOP = 1.15;
const BODY_HEIGHT = 3.85;
const CHARS_PER_LINE = 88;
const LINES_PER_SLIDE = 12;
const TABLE_LINES_PER_SLIDE = 16;

type TextItem = PptxGenJS.TextProps;
type Chunk = { lines: number; items: TextItem[] } | { table: { headers: string[]; rows: string[][] } };

function estimateLines(text: string): number {
  return Math.max(1, Math.ceil(text.length / CHARS_PER_LINE));
}

function runItems(runs: InlineRun[], options: PptxGenJS.TextPropsOptions): TextItem[] {
  return runs.map((run, index) => ({
    text: run.text,
    options: {
      ...options,
      bold: run.bold ?? options.bold,
      italic: run.italic ?? options.italic,
      // Only the last run of a paragraph ends the line; earlier runs continue it.
      breakLine: index === runs.length - 1,
      bullet: index === 0 ? options.bullet : undefined,
    },
  }));
}

function blockChunks(block: DocumentBlock): Chunk[] {
  switch (block.kind) {
    case "heading":
      return [{ lines: 1, items: [{ text: block.text, options: { bold: true, color: T.navy, breakLine: true, paraSpaceBefore: 6 } }] }];
    case "paragraph":
      return [{ lines: estimateLines(runsToText(block.runs)), items: runItems(block.runs, { bullet: { code: "25AA" }, paraSpaceAfter: 4 }) }];
    case "list":
      return block.items.map((item, index) => ({
        lines: estimateLines(runsToText(item)),
        items: runItems(item, {
          bullet: block.ordered ? { type: "number", numberStartAt: index + 1 } : true,
          paraSpaceAfter: 3,
        }),
      }));
    case "table":
      return [{ table: { headers: block.headers, rows: block.rows } }];
    case "quote":
      return [
        {
          lines: estimateLines(block.text) + (block.cite ? 1 : 0),
          items: [
            { text: `“${block.text}”`, options: { italic: true, color: T.navy, breakLine: true } },
            ...(block.cite ? [{ text: `— ${block.cite}`, options: { fontSize: 11, color: T.muted, breakLine: true } }] : []),
          ],
        },
      ];
    case "callout":
      return [
        {
          lines: estimateLines(block.text) + 1,
          items: [
            ...(block.label ? [{ text: `${block.label}: `, options: { bold: true, color: T.green } }] : []),
            { text: block.text, options: { breakLine: true, paraSpaceAfter: 4 } },
          ],
        },
      ];
    case "fields":
      return block.rows.map((row) => ({
        lines: estimateLines(`${row.label}: ${row.value}`),
        items: [
          { text: `${row.label}: `, options: { bold: true, color: T.navy, bullet: { code: "25AA" } } },
          { text: row.value, options: { breakLine: true, paraSpaceAfter: 3 } },
        ],
      }));
  }
}

/** Keep long source text readable without truncating it or shrinking the body font. */
function paginateChunk(chunk: Chunk): Chunk[] {
  if ("table" in chunk || chunk.lines <= LINES_PER_SLIDE) return [chunk];
  const pages: Chunk[] = [];
  let items: TextItem[] = [];
  let lines = 0;
  for (const item of chunk.items) {
    let rest = item.text ?? "";
    let first = true;
    while (rest.length) {
      const limit = CHARS_PER_LINE * 8;
      let end = Math.min(rest.length, limit);
      if (end < rest.length) {
        const space = rest.lastIndexOf(" ", end);
        if (space > end / 2) end = space + 1;
      }
      const part = rest.slice(0, end);
      const size = estimateLines(part);
      if (items.length && lines + size > LINES_PER_SLIDE) {
        items[items.length - 1].options = { ...items[items.length - 1].options, breakLine: true };
        pages.push({ items, lines }); items = []; lines = 0;
      }
      items.push({ text: part, options: { ...item.options, bullet: first ? item.options?.bullet : undefined } });
      lines += size; rest = rest.slice(end); first = false;
    }
  }
  if (items.length) pages.push({ items, lines });
  return pages;
}

function frame(pptx: PptxGenJS, title: string, footer: string) {
  const slide = pptx.addSlide({ masterName: "Accessible body" });
  slide.addText(title, { placeholder: "title", objectName: "Slide title", x: 0.4, y: 0.12, w: 9.2, h: 0.66, fontFace: FONT, fontSize: 22, bold: true, color: "FFFFFF", valign: "middle", fit: "shrink" });
  slide.addText(footer, { x: 0.4, y: 5.18, w: 8.2, h: 0.3, fontFace: FONT, fontSize: 9, color: T.muted, valign: "middle" });
  slide.slideNumber = { x: 8.9, y: 5.18, w: 0.7, h: 0.3, fontFace: FONT, fontSize: 9, color: T.muted, align: "right" };
  return slide;
}

function addBodySlides(pptx: PptxGenJS, title: string, footer: string, chunks: Chunk[]) {
  let items: TextItem[] = [];
  let lines = 0;
  let page = 0;
  const flush = () => {
    if (items.length === 0) return;
    const slide = frame(pptx, page === 0 ? title : `${title} (continued ${page + 1})`, footer);
    slide.addText(items, {
      placeholder: "body", objectName: "Lesson content",
      x: 0.5,
      y: BODY_TOP,
      w: 9,
      h: BODY_HEIGHT,
      fontFace: FONT,
      fontSize: 14,
      color: T.ink,
      valign: "top",
      paraSpaceAfter: 4,
    });
    items = [];
    lines = 0;
    page += 1;
  };
  for (const chunk of chunks.flatMap(paginateChunk)) {
    if ("table" in chunk) {
      flush();
      const { headers, rows } = chunk.table;
      const columns = Math.max(headers.length, ...rows.map((row) => row.length), 1);
      const colW = Array.from({ length: columns }, () => 9 / columns);
      const headerRow: PptxGenJS.TableRow = Array.from({ length: columns }, (_, index) => ({
        text: headers[index]?.trim() || `Column ${index + 1}`,
        options: { bold: true, color: "FFFFFF", fill: { color: T.navy }, fontFace: FONT, fontSize: 11 },
      }));
      // Wide tables and long cells read more clearly as labeled records.
      if (columns > 4 || rows.some(row => row.some(cell => cell.length > 150))) {
        const records: Chunk[] = rows.flatMap((row, index) => [
          { lines: 1, items: [{ text: `Record ${index + 1}`, options: { bold: true, breakLine: true } }] },
          ...Array.from({ length: columns }, (_, col) => {
            const text = `${headers[col] || `Column ${col + 1}`}: ${row[col]?.trim() || "Not provided"}`;
            return { lines: estimateLines(text), items: [{ text, options: { breakLine: true } }] };
          }),
        ]);
        addBodySlides(pptx, `${title} — table ${page + 1} records`, footer, records);
        page += 1;
        continue;
      }
      let start = 0;
      while (start < rows.length) {
        let end = start;
        let usedLines = 2;
        while (end < rows.length) {
          const rowLines = 1 + Math.max(...rows[end].map(cell => Math.ceil(cell.length / (CHARS_PER_LINE / columns))), 1);
          if (end > start && usedLines + rowLines > TABLE_LINES_PER_SLIDE) break;
          usedLines += rowLines; end += 1;
        }
        const slide = frame(pptx, page === 0 ? title : `${title} (continued ${page + 1})`, footer);
        const bodyRows: PptxGenJS.TableRow[] = rows.slice(start, end).map((row) =>
          Array.from({ length: columns }, (_, index) => ({
            text: row[index]?.trim() || "Not provided",
            options: { fontFace: FONT, fontSize: 11, color: T.ink, valign: "top" as const, bold: index === 0 },
          })),
        );
        slide.addTable([headerRow, ...bodyRows], {
          x: 0.5,
          y: BODY_TOP,
          w: 9,
          colW,
          border: { type: "solid", pt: 0.5, color: T.line },
          autoPage: false,
        });
        page += 1;
        start = end;
      }
      continue;
    }
    if (lines > 0 && lines + chunk.lines > LINES_PER_SLIDE) flush();
    items.push(...chunk.items);
    lines += chunk.lines;
  }
  flush();
}

export async function renderPptx(document: ResourceDocument): Promise<Buffer> {
  const pptx = new PptxCtor();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = document.attribution;
  pptx.company = document.attribution;
  pptx.title = document.title;
  pptx.subject = document.subtitle ?? document.title;

  pptx.defineSlideMaster({ title: "Accessible body", background: { color: "FFFFFF" }, objects: [
    { rect: { x: 0, y: 0, w: SLIDE_WIDTH, h: .9, fill: { color: T.navy }, line: { color: T.navy } } },
    { placeholder: { options: { name: "title", type: "title", x: .4, y: .12, w: 9.2, h: .66, color: "FFFFFF", fontFace: FONT, fontSize: 22 } } },
    { placeholder: { options: { name: "body", type: "body", x: .5, y: BODY_TOP, w: 9, h: BODY_HEIGHT, fontFace: FONT, fontSize: 14 } } },
  ] });
  pptx.defineSlideMaster({ title: "Accessible cover", background: { color: T.navy }, objects: [
    { placeholder: { options: { name: "title", type: "title", x: .6, y: 1.2, w: 8.8, h: 1.6, color: "FFFFFF", fontFace: FONT, fontSize: 34 } } },
  ] });
  const footer = document.attribution;

  const cover = pptx.addSlide({ masterName: "Accessible cover" });
  cover.background = { color: T.navy };
  cover.addShape(pptx.ShapeType.rect, { x: 0, y: 4.35, w: SLIDE_WIDTH, h: 0.06, fill: { color: "78BE21" }, line: { color: "78BE21" } });
  if (document.kicker) {
    cover.addText(document.kicker.toUpperCase(), { x: 0.6, y: 0.7, w: 8.8, h: 0.4, fontFace: FONT, fontSize: 12, color: "D9EAF0", charSpacing: 2 });
  }
  cover.addText(document.title, { placeholder: "title", objectName: "Slide title", x: 0.6, y: 1.2, w: 8.8, h: 1.6, fontFace: FONT, fontSize: 34, bold: true, color: "FFFFFF", valign: "top", fit: "shrink" });
  if (document.subtitle) {
    cover.addText(document.subtitle, { x: 0.6, y: 2.85, w: 8.8, h: 1.3, fontFace: FONT, fontSize: 16, color: "E1F3FA", valign: "top", fit: "shrink" });
  }
  const metaLine = document.meta.map((entry) => `${entry.label}: ${entry.value}`).join("   ·   ");
  cover.addText(metaLine || document.attribution, { x: 0.6, y: 4.55, w: 8.8, h: 0.8, fontFace: FONT, fontSize: 11, color: "D9EAF0", valign: "top", fit: "shrink" });

  document.sections.forEach((entry, index) => {
    const chunks = entry.blocks.flatMap(blockChunks);
    if (chunks.length === 0) return;
    addBodySlides(pptx, entry.heading ?? (index === 0 ? document.title : `Part ${index + 1}`), footer, chunks);
  });

  if (document.sources && document.sources.length > 0) {
    const chunks: Chunk[] = document.sources.map((source) => ({
      lines: estimateLines(`${source.title} ${source.note ?? ""}`) + (source.href ? 1 : 0),
      items: [
        { text: source.title, options: { bold: true, bullet: true, breakLine: !source.note && !source.href } },
        ...(source.note ? [{ text: ` — ${source.note}`, options: { color: T.muted, breakLine: !source.href } }] : []),
        ...(source.href
          ? [{ text: source.href, options: { fontSize: 11, color: T.navy, hyperlink: { url: source.href }, breakLine: true } }]
          : []),
      ],
    }));
    addBodySlides(pptx, "Sources", footer, chunks);
  }

  const output = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.isBuffer(output) ? output : Buffer.from(output as Uint8Array);
}
