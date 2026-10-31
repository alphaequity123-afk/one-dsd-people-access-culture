// The small part of Markdown the research files use. Text is parsed into data and
// rendered as React elements, so nothing in a file can run as HTML.

export type ScenarioOption = { choice: string; feedback: string };

export type ResearchBlock =
  | { type: "heading"; level: 3 | 4; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "note"; text: string }
  | { type: "voice"; blocks: ResearchBlock[] }
  | { type: "fact"; blocks: ResearchBlock[] }
  | { type: "takeaway"; blocks: ResearchBlock[] }
  | { type: "reflect"; items: string[] }
  | { type: "scenario"; label: string; blocks: ResearchBlock[]; question: string; options: ScenarioOption[] };

function tableRow(line: string): string[] {
  return line.trim().replace(/^\||\|$/g, "").split("|").map(cell => cell.trim());
}

function fenced(kind: string, lines: string[]): ResearchBlock {
  if (kind === "voice" || kind === "fact" || kind === "takeaway") return { type: kind, blocks: parseResearchMarkdown(lines.join("\n")) };
  if (kind === "reflect") return { type: "reflect", items: lines.filter(line => line.trim().startsWith("- ")).map(line => line.trim().slice(2)) };
  if (kind === "scenario") {
    const options: ScenarioOption[] = [];
    const setup: string[] = [];
    let question = "";
    for (const raw of lines) {
      const line = raw.trim();
      if (line.startsWith("? ")) question = line.slice(2);
      else if (line.startsWith("- ") && line.includes("||")) {
        const [choice, ...feedback] = line.slice(2).split("||");
        options.push({ choice: choice.trim(), feedback: feedback.join("||").trim() });
      } else if (line) setup.push(line);
    }
    const label = /^example/i.test(setup[0] ?? "") ? setup.shift()! : "";
    return { type: "scenario", label, blocks: setup.map(text => ({ type: "paragraph", text })), question, options };
  }
  return { type: "note", text: lines.map(line => line.trim()).filter(Boolean).join(" ").replace(/^(?:\*\*)?Content note:?(?:\*\*)?:?\s*/i, "") };
}

export function parseResearchMarkdown(markdown: string): ResearchBlock[] {
  const blocks: ResearchBlock[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed) { index++; continue; }
    const fence = trimmed.match(/^:::(\w+)$/);
    if (fence) {
      const body: string[] = [];
      index++;
      while (index < lines.length && lines[index].trim() !== ":::") body.push(lines[index++]);
      index++;
      blocks.push(fenced(fence[1], body));
      continue;
    }
    const heading = trimmed.match(/^(#{2,4})\s+(.+)$/);
    if (heading) { blocks.push({ type: "heading", level: heading[1].length === 4 ? 4 : 3, text: heading[2] }); index++; continue; }
    if (trimmed.startsWith("|")) {
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        if (!/^\|[\s:|-]+\|?$/.test(lines[index].trim())) rows.push(tableRow(lines[index]));
        index++;
      }
      blocks.push({ type: "table", header: rows[0] ?? [], rows: rows.slice(1) });
      continue;
    }
    if (trimmed.startsWith(">")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) quote.push(lines[index++].trim().replace(/^>\s?/, ""));
      blocks.push({ type: "note", text: quote.join(" ").replace(/^\*\*Content note:\*\*\s*/i, "") });
      continue;
    }
    const marker = /^(?:[-*]|\d+[.)])\s+/;
    if (marker.test(trimmed)) {
      const ordered = /^\d/.test(trimmed);
      const items: string[] = [];
      while (index < lines.length) {
        const current = lines[index].trim();
        if (marker.test(current) && /^\d/.test(current) === ordered) { items.push(current.replace(marker, "")); index++; }
        else if (current && !marker.test(current) && !/^(?:#|\||>|:::)/.test(current) && /^\s/.test(lines[index])) { items[items.length - 1] += ` ${current}`; index++; }
        else break;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }
    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !/^(?:#{2,4}\s|\||>|:::|[-*]\s|\d+[.)]\s)/.test(lines[index].trim())) paragraph.push(lines[index++].trim());
    if (!paragraph.length) paragraph.push(lines[index++].trim());
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }
  return blocks;
}

/** Plain text for search: keeps link labels, drops addresses and markup. */
export function researchPlainText(markdown: string): string {
  return markdown
    .replace(/^:::\w*$/gm, "")
    .replace(/\[([^\]]+)\]\(https?:[^)\s]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\*\*|(?<![\w*])\*(?=\S)|(?<=\S)\*(?![\w*])|^#{1,6}\s+|^>\s?|^\|[\s:|-]+\|?$/gm, "")
    .replace(/\|\|/g, ":")
    .replace(/[ \t]+/g, " ")
    .trim();
}
