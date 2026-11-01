// Converts the supervisor and manager course sources (sm-*.md) into CoursePack JSON
// under lib/content/courses/authored/supervisor-manager/, and regenerates that
// folder's index.ts and import-manifest.json.
//
// Usage: node scripts/content/import-supervisor-courses.mjs [source folder]
//        (or set SM_COURSE_SOURCE). Add --check to compare without writing.
//
// The drafts were written by different hands, so several spellings of the same
// structure are accepted. Anything else stops the import: a line this script does
// not understand must never be dropped quietly. After parsing, every content line
// of the source is checked against the produced pack as an independent second pass.
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CoursePackSchema } from "../../lib/content/courses/contract.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const args = process.argv.slice(2);
const check = args.includes("--check");
const sourceDir = args.find(arg => !arg.startsWith("--")) ?? process.env.SM_COURSE_SOURCE ?? fileURLToPath(new URL("../../handoff/supervisor-curriculum/", import.meta.url));
const outDir = path.join(root, "lib/content/courses/authored/supervisor-manager");

const OWNER = "One DHS / One DSD — People, Access and Culture";
const SERIES = "For supervisors and managers";
const FIRST_INDEX = 2401;
/** Build order from the collections plan, with an existing cover image and its existing description. */
const COURSES = [
  ["sm-first-week", "gc-new-supervisor-inclusive-leadership.webp", "Photograph of colleagues in a scene of inclusive leadership coaching."],
  ["sm-fair-assignments", "stock-people-04.jpg", "Colleagues listen to one another around a conference table with laptops and notes."],
  ["sm-rating-and-what-follows", "stock-people-06.jpg", "People at a training table listen as one participant makes a point."],
  ["sm-corrective-action", "di-inclusive-supervision.webp", "A supervisor listens to a colleague during a one-to-one conversation."],
  ["sm-hiring-decisions", "stock-people-02.jpg", "Four colleagues talk in a bright office hallway while holding laptops and folders."],
  ["sm-named-in-complaint", "stock-people-07.jpg", "Five colleagues discuss information around a meeting table in an office."],
  ["sm-leave-and-return", "stock-people-10.jpg", "Five colleagues seated around a conference table with notebooks and laptops."],
  ["sm-budget-cuts-separation", "stock-people-13.jpg", "Two colleagues point to a line in a printed document they are reviewing together."],
  ["sm-your-own-load", "gc-sustaining-the-work.webp", "Photograph of colleagues in a scene of learning lab reflection."],
  ["sm-who-carries-equity-work", "stock-people-05.jpg", "A large team works on laptops along a long conference table beside tall windows."],
  ["sm-deaf-deafblind-hoh", "gc-deaf-minnesota.webp", "Photograph of colleagues in a scene of communication access."],
  ["sm-rules-fall-2026", "stock-people-09.jpg", "Three colleagues, one using a wheelchair, meet at a white table with laptops and notebooks."],
  ["sm-why-this-is-supervisor-work", "stock-people-01.jpg", "Four colleagues stand together in an open office and review a printed document."],
  ["sm-backing-your-supervisors", "di-leadership-inclusion.webp", "Two public-service leaders, one using a wheelchair, discuss an inclusion decision."],
  ["sm-calibration", "di-governance-resourcing.webp", "Colleagues review unlabeled planning and budget materials at a table."],
  ["sm-reading-patterns", "stock-people-03.jpg", "A presenter points to a whiteboard chart while two colleagues discuss it at a table."],
  ["sm-fair-oversight", "pi-equitable-oversight-design.webp", "Photograph of colleagues in a scene of decision transparency."],
  ["sm-senior-leader-sessions", "di-governance-resourcing.webp", "Colleagues review unlabeled planning and budget materials at a table."],
  ["sm-facilitator-guide", "stock-people-08.jpg", "A facilitator writes on a whiteboard while a group follows along at a long table."],
];
/**
 * The owner approved all 19 courses on October 31, 2026. Governance follows the
 * other published authored packs (status, reviewers, next review); the source
 * header must carry the same status and date so the Markdown and the packs match.
 */
const APPROVED = {
  status: "reviewed",
  lastReviewed: "October 31, 2026",
  reviewers: ["Equity and Inclusion Operations Consultant"],
  nextReview: "At the agreed review point and whenever an update trigger occurs",
};

class Line { constructor(text, number) { this.text = text; this.number = number; } }

function fail(file, line, message) {
  throw new Error(`${file}${line ? `:${line.number}` : ""}: ${message}${line ? `\n  > ${line.text.slice(0, 160)}` : ""}`);
}

// ---- Inline text ----------------------------------------------------------
const escapeHtml = value => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
function checkInline(file, line, text) {
  if (/\*/.test(text)) fail(file, line, "unbalanced emphasis marker left in text");
  return text;
}
/** For fields the page renders as markup. */
function inlineHtml(file, line, value) {
  let text = escapeHtml(value.trim());
  text = text.replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*([^*]+(?:\*[^*]+\*[^*]*)*)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*([^*\s][^*]*)\*/g, "<em>$1</em>");
  return checkInline(file, line, text);
}
/** For fields the page renders as plain text. */
function inlinePlain(file, line, value) {
  let text = value.trim();
  text = text.replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, "$1 ($2)");
  text = text.replace(/`([^`]+)`/g, "$1");
  text = text.replace(/\*\*([^*]+(?:\*[^*]+\*[^*]*)*)\*\*/g, "$1");
  text = text.replace(/\*([^*\s][^*]*)\*/g, "$1");
  return checkInline(file, line, text);
}

const BULLET = /^[-*] +(.*)$/;
const NUMBER = /^\d+[.)] +(.*)$/;
const QUOTE = /^> ?(.*)$/;

/** Turns consecutive source lines into ordered segments: paragraphs, lists and quotes. */
function segments(file, lines) {
  const out = [];
  for (const line of lines) {
    if (!line.text.trim()) continue;
    const raw = line.text;
    if (/^\s/.test(raw) && !/^ {2,}[-*] /.test(raw)) fail(file, line, "indented line is not supported");
    const text = raw.trim();
    const bullet = text.match(BULLET);
    const number = text.match(NUMBER);
    const quote = text.match(QUOTE);
    const last = out.at(-1);
    if (bullet || number) {
      const kind = bullet ? "ul" : "ol";
      if (last?.kind === kind) last.items.push({ line, text: (bullet ?? number)[1] });
      else out.push({ kind, items: [{ line, text: (bullet ?? number)[1] }] });
    } else if (quote) {
      if (last?.kind === "quote") last.items.push({ line, text: quote[1] });
      else out.push({ kind: "quote", items: [{ line, text: quote[1] }] });
    } else if (/^#{1,6} /.test(text)) {
      fail(file, line, "heading is not allowed inside this section");
    } else {
      out.push({ kind: "p", items: [{ line, text }] });
    }
  }
  return out;
}
function html(file, lines) {
  return segments(file, lines).map(segment => {
    const items = segment.items.map(item => inlineHtml(file, item.line, item.text));
    if (segment.kind === "p") return `<p>${items[0]}</p>`;
    if (segment.kind === "quote") return `<blockquote>${items.map(item => `<p>${item}</p>`).join("")}</blockquote>`;
    return `<${segment.kind}>${items.map(item => `<li>${item}</li>`).join("")}</${segment.kind}>`;
  }).join("");
}

// ---- Fields ----------------------------------------------------------------
/** Matches `**Key:** value`, `**Key**: value` and `Key: value`. */
function field(line, keys) {
  for (const key of keys) {
    const match = line.text.trim().match(new RegExp(`^(?:\\*\\*)?${key}(?::\\*\\*|\\*\\*:|:)\\s*(.*)$`, "i"));
    if (match) return match[1].trim();
  }
  return undefined;
}
const notBlank = lines => lines.filter(line => line.text.trim());
function listItems(file, lines, what) {
  const found = [];
  for (const segment of segments(file, lines)) {
    if (segment.kind !== "ul" && segment.kind !== "ol") fail(file, segment.items[0].line, `expected a list in ${what}`);
    found.push(...segment.items);
  }
  return found;
}

// ---- Sections --------------------------------------------------------------
function splitBy(lines, test) {
  const groups = [];
  let current = { head: null, lines: [] };
  for (const line of lines) {
    const head = test(line);
    if (head !== undefined && head !== null && head !== false) {
      groups.push(current);
      current = { head: { line, value: head }, lines: [] };
    } else current.lines.push(line);
  }
  groups.push(current);
  return groups;
}

function parseListSection(file, title, lines) {
  const blocks = [];
  let heading = title || undefined;
  const parts = segments(file, lines);
  if (!heading && parts.length > 1 && parts[0].kind === "p" && /:$/.test(parts[0].items[0].text)) {
    heading = inlinePlain(file, parts[0].items[0].line, parts[0].items[0].text);
    parts.shift();
  }
  let pending = [];
  const flush = () => {
    if (pending.length) blocks.push({ type: "text", body: pending.join("") });
    pending = [];
  };
  let listed = false;
  for (const part of parts) {
    if (part.kind === "ul" || part.kind === "ol") {
      if (pending.length && heading && !listed) { blocks.push({ type: "text", heading, body: pending.join("") }); pending = []; heading = undefined; }
      flush();
      blocks.push({ type: "list", ...(heading ? { heading } : {}), ...(part.kind === "ol" ? { ordered: true } : {}), items: part.items.map(item => inlineHtml(file, item.line, item.text)) });
      heading = undefined;
      listed = true;
    } else if (part.kind === "p") pending.push(`<p>${inlineHtml(file, part.items[0].line, part.items[0].text)}</p>`);
    else pending.push(`<blockquote>${part.items.map(item => `<p>${inlineHtml(file, item.line, item.text)}</p>`).join("")}</blockquote>`);
  }
  flush();
  if (!listed) fail(file, lines[0], "list section has no list");
  return blocks;
}

function parseGroupSection(file, kind, title, lines) {
  const marker = kind === "tabs" ? "Tab" : "Item";
  const groups = splitBy(lines, line => {
    const text = line.text.trim();
    return text.match(new RegExp(`^#### ${marker}:\\s*(.+)$`))?.[1]
      ?? text.match(new RegExp(`^\\*\\*${marker}:\\s*(.+)\\*\\*$`))?.[1]
      ?? text.match(new RegExp(`^${marker}:\\s*(.+)$`))?.[1];
  });
  const blocks = [];
  const lead = notBlank(groups[0].lines);
  const entries = groups.slice(1).map(group => {
    const bodyLines = group.lines.map(line => {
      const body = line.text.match(/^(?:\*\*)?Body(?::\*\*|:)\s*(.*)$/);
      return body ? new Line(body[1], line.number) : line;
    });
    const body = html(file, bodyLines);
    if (!body) fail(file, group.head.line, `${marker} has no body`);
    return { label: inlinePlain(file, group.head.line, group.head.value), body };
  });
  if (!entries.length) fail(file, lines[0], `${kind} section has no ${marker} entries`);
  if (lead.length) blocks.push({ type: "text", body: html(file, lead) });
  const heading = title || undefined;
  if (kind === "tabs") blocks.push({ type: "tabs", ...(heading ? { heading } : {}), tabs: entries.map(({ label, body }) => ({ label, body })) });
  else blocks.push({ type: "accordion", ...(heading ? { heading } : {}), items: entries.map(({ label, body }) => ({ title: label, body })) });
  return blocks;
}

function parseKeyed(file, lines, keys, what) {
  const values = {};
  let current;
  for (const line of notBlank(lines)) {
    let matched = false;
    for (const [name, spellings] of Object.entries(keys)) {
      const value = field(line, spellings);
      if (value !== undefined) { current = name; values[name] = value ? [new Line(value, line.number)] : []; matched = true; break; }
    }
    if (matched) continue;
    if (!current) fail(file, line, `unexpected line before the first field of ${what}`);
    values[current].push(line);
  }
  return values;
}

function parseLeaderMove(file, title, lines) {
  const values = parseKeyed(file, lines, { control: ["Control"], failure: ["Failure"], next: ["Next"] }, "a leader move");
  for (const key of ["control", "failure", "next"]) if (!values[key]?.length) fail(file, lines[0], `leader move is missing ${key}`);
  return { type: "leaderMove", ...(title ? { heading: title } : {}), control: html(file, values.control), failure: html(file, values.failure), next: html(file, values.next) };
}

const OPTION = /^(?:\*\*)?Option(?: ([A-Z0-9]+))?( \(recommended\))?(?::\*\*|\*\*:|:)\s*(.*)$/;
const RESPONSE = /^(?:\*\*)?Response(?: ([A-Z0-9]+))?(?::\*\*|\*\*:|:)\s*(.*)$/;
function parseScenario(file, lines) {
  const content = notBlank(lines);
  const firstOption = content.findIndex(line => OPTION.test(line.text.trim()));
  if (firstOption < 0) fail(file, lines[0], "scenario has no options");
  const head = parseKeyed(file, content.slice(0, firstOption), { context: ["Context"], prompt: ["Prompt"] }, "a scenario");
  if (!head.context?.length) fail(file, lines[0], "scenario has no context");
  if (!head.prompt?.length) fail(file, lines[0], "scenario has no prompt");
  const options = [];
  let current;
  let mode;
  let recommendedLetter;
  for (const line of content.slice(firstOption)) {
    const text = line.text.trim();
    const option = text.match(OPTION);
    const response = text.match(RESPONSE);
    const recommended = field(line, ["Recommended"]);
    if (option) {
      current = { letter: option[1], recommended: Boolean(option[2]), label: [new Line(option[3], line.number)], response: [] };
      options.push(current);
      mode = "label";
    } else if (response) {
      if (!current) fail(file, line, "response before an option");
      if (response[1] && response[1] !== current.letter) {
        current = options.find(item => item.letter === response[1]);
        if (!current) fail(file, line, "response names an option that does not exist");
      }
      current.response.push(new Line(response[2], line.number));
      mode = "response";
    } else if (recommended !== undefined) {
      if (/^yes$/i.test(recommended)) current.recommended = true;
      else if (/^[A-Z0-9]+$/.test(recommended)) recommendedLetter = recommended;
      else fail(file, line, "cannot read Recommended");
    } else if (mode) current[mode].push(line);
    else fail(file, line, "unexpected line in scenario");
  }
  if (recommendedLetter) {
    const match = options.find(item => item.letter === recommendedLetter);
    if (!match) fail(file, lines[0], `recommended option ${recommendedLetter} does not exist`);
    match.recommended = true;
  }
  if (options.some(item => !item.response.length)) fail(file, lines[0], "scenario option has no response");
  if (options.filter(item => item.recommended).length !== 1) fail(file, lines[0], "scenario needs exactly one recommended option");
  return {
    context: html(file, head.context),
    prompt: head.prompt.map(line => inlinePlain(file, line, line.text)).join(" "),
    options: options.map(item => ({ label: html(file, item.label), response: html(file, item.response), recommended: item.recommended })),
  };
}

const unwrapParagraph = value => {
  const match = value.match(/^<p>((?:(?!<\/p>).)*)<\/p>$/s);
  return match ? match[1] : value;
};

function parseKnowledgeCheck(file, id, lines) {
  const content = notBlank(lines);
  const keys = { question: ["Question"], options: ["Options"], correct: ["Correct answer"], good: ["Feedback if correct", "Feedback correct"], bad: ["Feedback if incorrect", "Feedback incorrect"] };
  const letters = [];
  const rest = [];
  for (const line of content) {
    const option = line.text.trim().match(OPTION);
    if (option) letters.push({ letter: option[1], line, text: option[3] });
    else rest.push(line);
  }
  const values = parseKeyed(file, rest, keys, "a knowledge check");
  // A bulleted option list may follow the question directly, with or without an Options label.
  const trailing = [];
  const question = [];
  for (const line of values.question ?? []) (BULLET.test(line.text.trim()) ? trailing : question).push(line);
  if (!question.length) fail(file, lines[0], "knowledge check has no question");
  let options;
  if (letters.length) {
    options = letters.map(item => ({ line: item.line, text: item.text, letter: item.letter, correct: false }));
  } else {
    options = listItems(file, [...trailing, ...(values.options ?? [])], "knowledge check options").map(item => {
      const correct = /\(correct\)\s*$/i.test(item.text);
      return { line: item.line, text: item.text.replace(/\s*\(correct\)\s*$/i, ""), correct };
    });
  }
  const stated = (values.correct ?? []).map(line => line.text).join(" ").trim();
  if (letters.length) {
    const match = options.find(item => item.letter === stated);
    if (!match) fail(file, lines[0], `knowledge check answer "${stated}" names no option`);
    match.correct = true;
  }
  // Some drafts mark no option and only give the answer's full wording on its own line.
  if (!options.some(item => item.correct) && stated) {
    const named = options.filter(item => inlinePlain(file, item.line, item.text) === inlinePlain(file, item.line, stated));
    if (named.length === 1) named[0].correct = true;
  }
  if (options.filter(item => item.correct).length !== 1) fail(file, lines[0], "knowledge check needs exactly one correct option");
  if (!letters.length && stated && inlinePlain(file, lines[0], stated) !== inlinePlain(file, lines[0], options.find(item => item.correct).text)) fail(file, lines[0], `correct answer line does not match the option marked correct: ${stated}`);
  if (!values.good?.length || !values.bad?.length) fail(file, lines[0], "knowledge check is missing feedback");
  return {
    type: "knowledgeCheck", id,
    question: question.map(line => inlinePlain(file, line, line.text)).join(" "),
    options: options.map(item => ({ text: inlineHtml(file, item.line, item.text), correct: item.correct })),
    feedbackCorrect: html(file, values.good),
    feedbackIncorrect: html(file, values.bad),
  };
}

function parseTransfer(file, lines) {
  const content = notBlank(lines);
  if (!content.length) fail(file, lines[0], "transfer prompt is empty");
  if (!content.some(line => field(line, ["Prompt", "Plan starters", "Options"]) !== undefined)) {
    return { prompt: html(file, content), options: [] };
  }
  const values = parseKeyed(file, content, { prompt: ["Prompt"], options: ["Plan starters", "Options"] }, "a transfer prompt");
  if (!values.prompt?.length) fail(file, lines[0], "transfer prompt has no prompt");
  const promptLines = values.prompt.filter(line => !BULLET.test(line.text.trim()));
  const promptBullets = values.prompt.filter(line => BULLET.test(line.text.trim()));
  return { prompt: html(file, promptLines), options: listItems(file, [...promptBullets, ...(values.options ?? [])], "transfer options").map(item => inlineHtml(file, item.line, item.text)) };
}

function parseLesson(file, courseId, head, lines, number) {
  const titleMatch = head.value;
  const id = `${courseId}-${number}`;
  const groups = splitBy(lines, line => line.text.match(/^### (.+)$/)?.[1]);
  const meta = parseKeyed(file, groups[0].lines, { summary: ["Summary"], minutes: ["Minutes"], objectives: ["Objectives"], takeaways: ["Takeaways"] }, "a lesson header");
  for (const key of ["summary", "minutes", "objectives", "takeaways"]) if (!meta[key]?.length) fail(file, head.line, `lesson is missing ${key}`);
  const minutes = Number(meta.minutes[0].text);
  if (!Number.isFinite(minutes) || minutes <= 0) fail(file, meta.minutes[0], "lesson minutes are not a number");
  const objectives = listItems(file, meta.objectives, "objectives").map(item => inlinePlain(file, item.line, item.text));
  const takeaways = listItems(file, meta.takeaways, "takeaways").map(item => inlineHtml(file, item.line, item.text));
  const blocks = [];
  let scenario;
  let transfer;
  for (const group of groups.slice(1)) {
    const name = group.head.value.trim();
    const titled = name.match(/^(Text|List|Accordion|Tabs|Leader move)(?::\s*(.+))?$/);
    if (titled) {
      const title = titled[2] ? inlinePlain(file, group.head.line, titled[2]) : "";
      if (titled[1] === "Text") {
        const body = html(file, group.lines);
        if (!body) fail(file, group.head.line, "text section is empty");
        blocks.push({ type: "text", ...(title ? { heading: title } : {}), body });
      } else if (titled[1] === "List") blocks.push(...parseListSection(file, title, group.lines));
      else if (titled[1] === "Tabs") blocks.push(...parseGroupSection(file, "tabs", title, group.lines));
      else if (titled[1] === "Accordion") blocks.push(...parseGroupSection(file, "accordion", title, group.lines));
      else blocks.push(parseLeaderMove(file, title, group.lines));
    } else if (name === "Statement") {
      const body = html(file, group.lines);
      if (!body) fail(file, group.head.line, "statement is empty");
      blocks.push({ type: "statement", body });
    } else if (name === "Scenario") {
      if (scenario) fail(file, group.head.line, "lesson has more than one scenario");
      scenario = parseScenario(file, group.lines);
    } else if (name === "Knowledge check") {
      blocks.push(parseKnowledgeCheck(file, `${id}-check-${blocks.filter(block => block.type === "knowledgeCheck").length + 1}`, group.lines));
    } else if (name === "Transfer prompt") {
      if (transfer) fail(file, group.head.line, "lesson has more than one transfer prompt");
      transfer = parseTransfer(file, group.lines);
    } else fail(file, group.head.line, "unknown lesson section");
  }
  if (!scenario) fail(file, head.line, "lesson has no scenario");
  if (!transfer) fail(file, head.line, "lesson has no transfer prompt");
  if (!blocks.some(block => block.type === "knowledgeCheck")) fail(file, head.line, "lesson has no knowledge check");
  const summary = html(file, meta.summary);
  return {
    id, number, title: inlinePlain(file, head.line, titleMatch), summary: unwrapParagraph(summary), minutes, blocks,
    learning: { objective: objectives[0], objectives, takeaways, evidence: "", appliedNextStep: "" },
    scenario, transfer,
  };
}

function parseJobAid(file, title, head, lines) {
  const sectionHead = line => {
    const text = line.text.trim();
    return text.match(/^### (?:Section:\s*)?(.+)$/)?.[1] ?? text.match(/^\*\*Section:\s*(.+)\*\*$/)?.[1];
  };
  // "Sections:" introduces plain headings, each a line followed by its list.
  const groups = splitBy(lines, sectionHead);
  const preamble = [];
  const sections = [];
  const addSection = (heading, line, body) => {
    const items = [];
    for (const segment of segments(file, body)) for (const item of segment.items) items.push(inlinePlain(file, item.line, item.text));
    if (!items.length) fail(file, line, "job aid section has no items");
    sections.push({ heading: inlinePlain(file, line, heading), items });
  };
  let trailing = [];
  for (const [index, group] of groups.entries()) {
    if (!group.head) { preamble.push(...group.lines); continue; }
    if (index === groups.length - 1) {
      const doNext = group.lines.findIndex(line => field(line, ["Do next"]) !== undefined);
      if (doNext >= 0) { trailing = group.lines.slice(doNext); addSection(group.head.value, group.head.line, group.lines.slice(0, doNext)); continue; }
    }
    addSection(group.head.value, group.head.line, group.lines);
  }
  // Find the plain-heading form inside the preamble.
  const sectionsLabel = preamble.findIndex(line => /^(?:\*\*)?Sections:(?:\*\*)?\s*$/.test(line.text.trim()));
  let keyed = preamble;
  if (sectionsLabel >= 0) {
    keyed = preamble.slice(0, sectionsLabel);
    let body = preamble.slice(sectionsLabel + 1);
    const doNext = body.findIndex(line => field(line, ["Do next"]) !== undefined);
    if (doNext >= 0) { trailing = [...body.slice(doNext), ...trailing]; body = body.slice(0, doNext); }
    let heading;
    let bucket = [];
    const flush = () => { if (heading) addSection(heading.text.trim(), heading, bucket); bucket = []; };
    for (const line of notBlank(body)) {
      if (BULLET.test(line.text.trim()) || NUMBER.test(line.text.trim())) {
        if (!heading) fail(file, line, "job aid list has no heading");
        bucket.push(line);
      } else { flush(); heading = line; }
    }
    flush();
  }
  const values = parseKeyed(file, [...keyed, ...trailing], { title: ["Title"], subtitle: ["Subtitle"], purpose: ["Purpose"], remember: ["Remember"], doNext: ["Do next"] }, "a job aid");
  if (!sections.length) fail(file, head, "job aid has no sections");
  for (const key of ["purpose", "remember"]) if (!values[key]?.length) fail(file, head, `job aid is missing ${key}`);
  const plainJoin = lines => lines.map(line => inlinePlain(file, line, line.text)).join(" ");
  return {
    title: values.title?.length ? plainJoin(values.title) : `${title}: job aid`,
    subtitle: values.subtitle?.length ? plainJoin(values.subtitle) : "A one-page reminder",
    use: {
      purpose: plainJoin(values.purpose),
      remember: listItems(file, values.remember, "job aid reminders").map(item => inlinePlain(file, item.line, item.text)),
      doNext: values.doNext?.length ? plainJoin(values.doNext) : "",
    },
    sections,
  };
}

function parseSources(file, lines) {
  const sources = [];
  for (const line of notBlank(lines)) {
    const text = line.text.trim();
    // "title, address. note", with the title in bold or plain. The address may be a page in this app.
    const match = text.match(/^- \*\*(.+?)\*\*[,.]?\s*(https:\/\/\S+|\/\S+)\s*(.*)$/) ?? text.match(/^- (.+?),\s*(https:\/\/\S+|\/\S+)\s*(.*)$/);
    if (!match) {
      // One draft ends its list with a plain note and no address. Keep it as an unlinked entry.
      const noAddress = text.match(/^- ([^*]+)$/);
      if (noAddress && !/https?:/.test(text)) { sources.push({ title: inlinePlain(file, line, noAddress[1]), href: "", note: "" }); continue; }
      fail(file, line, "cannot read this source line");
    }
    sources.push({ title: inlinePlain(file, line, match[1]), href: match[2].replace(/[.,;]+$/, ""), note: inlinePlain(file, line, match[3]) });
  }
  if (!sources.length) fail(file, undefined, "course has no sources");
  return sources;
}

function parseCourse(file, id, index, cover, coverAlt) {
  const raw = readFileSync(path.join(sourceDir, file), "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);
  const lines = raw.map((text, i) => new Line(text, i + 1));
  const titleLine = lines.find(line => line.text.trim());
  const titleMatch = titleLine.text.match(/^# ([a-z0-9-]+): (.+)$/);
  if (!titleMatch || titleMatch[1] !== id) fail(file, titleLine, `first line must name the course ${id}`);
  const title = titleMatch[2].trim();
  const parts = splitBy(lines.slice(titleLine.number), line => line.text.match(/^## (.+)$/)?.[1]);
  const head = parseKeyed(file, stripFreeHeader(parts[0].lines).keyed, {
    subtitle: ["Subtitle"], duration: ["Duration"], contentType: ["Content type"], status: ["Status"], lastReviewed: ["Last reviewed"], evidenceDate: ["Evidence date"],
    scope: ["Scope note", "Scope"], reviewNeeded: ["Review needed"], objectives: ["Course objectives"], nextStep: ["Applied next step"],
  }, "the course header");
  const free = stripFreeHeader(parts[0].lines).free;
  for (const key of ["subtitle", "duration", "contentType", "status", "lastReviewed", "evidenceDate", "objectives", "nextStep"]) if (!head[key]?.length) fail(file, undefined, `course header is missing ${key}`);
  const status = head.status[0].text;
  const lastReviewed = head.lastReviewed[0].text;
  if (status !== APPROVED.status) fail(file, head.status[0], `expected Status: ${APPROVED.status}`);
  if (lastReviewed !== APPROVED.lastReviewed) fail(file, head.lastReviewed[0], `expected Last reviewed: ${APPROVED.lastReviewed}`);
  if (head.reviewNeeded) fail(file, head.reviewNeeded[0] ?? undefined, "a Review needed line is no longer accepted: the owner approved every course on October 31, 2026");
  const contentType = head.contentType[0].text;
  const lessons = [];
  let jobAidPart;
  let sourcesPart;
  for (const part of parts.slice(1)) {
    const name = part.head.value;
    if (/^Lesson \d+:/.test(name)) {
      const number = Number(name.match(/^Lesson (\d+):/)[1]);
      if (number !== lessons.length + 1) fail(file, part.head.line, "lesson numbers are out of order");
      lessons.push(parseLesson(file, id, { line: part.head.line, value: name.replace(/^Lesson \d+:\s*/, "") }, part.lines, number));
    } else if (name.trim() === "Job aid") jobAidPart = part;
    else if (name.trim() === "Sources") sourcesPart = part;
    else fail(file, part.head.line, "unknown top-level section");
  }
  if (!jobAidPart) fail(file, undefined, "course has no job aid");
  if (!sourcesPart) fail(file, undefined, "course has no sources");
  const plain = linesIn => linesIn.map(line => inlinePlain(file, line, line.text)).join(" ");
  const scope = [...(head.scope ?? []), ...free].map(line => inlinePlain(file, line, line.text)).join(" ");
  const pack = {
    course: {
      id, indexNumber: index, seriesLabel: SERIES, title, subtitle: plain(head.subtitle), scope,
      treatment: `${lessons.length} lessons, each with explanation, a practice situation, a knowledge check and a plan to try, plus a one-page job aid.`,
      duration: plain(head.duration), author: OWNER, coverImage: `/images/covers/${cover}`, coverAlt, kind: "course", contentType,
      learning: {
        objectives: listItems(file, head.objectives, "course objectives").map(item => inlinePlain(file, item.line, item.text)),
        evidence: ["Compare the responses to the practice situation in each lesson.", "Answer the knowledge check in each lesson.", "Use the job aid with a decision you choose."],
        appliedNextStep: plain(head.nextStep),
      },
      governance: {
        contentOwner: OWNER, reviewers: APPROVED.reviewers, evidenceDate: plain(head.evidenceDate), lastReviewed,
        nextReview: APPROVED.nextReview,
        updateTriggers: ["Updated research, law, or official guidance", "Reader or reviewer feedback about accuracy, accessibility, or an example"],
        relatedDoor: "Use the responsible agency office for formal employment, accommodation, civil-rights, labor or eligibility decisions. This course supports learning rather than making those determinations.",
        toolkitQuestion: "Who is affected by this decision, and what would I need to learn from them before it is final?",
        status,
      },
      lessons,
    },
    jobAid: parseJobAid(file, title, jobAidPart.head.line, jobAidPart.lines),
    sources: parseSources(file, sourcesPart.lines),
  };
  return { pack, raw };
}
/** Header paragraphs with no field name (the scope sentence in some drafts). */
function stripFreeHeader(lines) {
  const known = /^(?:\*\*)?(Subtitle|Duration|Content type|Status|Last reviewed|Evidence date|Scope note|Scope|Review needed|Course objectives|Applied next step)(?::\*\*|\*\*:|:)/i;
  const keyed = [];
  const free = [];
  let inList = false;
  for (const line of notBlank(lines)) {
    const text = line.text.trim();
    if (known.test(text)) { keyed.push(line); inList = /^(?:\*\*)?Course objectives/i.test(text); }
    else if (inList && BULLET.test(text)) keyed.push(line);
    else { free.push(line); inList = false; }
  }
  return { keyed, free };
}

// ---- Independent second pass -----------------------------------------------
const strip = value => value.replace(/<\/?(?:em|strong|code|a)\b[^>]*>/g, "").replace(/<[^>]*>/g, " ").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
const normalize = value => value.toLowerCase().replace(/[*`]/g, "").replace(/\s+/g, " ").trim();
function allStrings(value, out = []) {
  if (typeof value === "string") out.push(strip(value));
  else if (Array.isArray(value)) value.forEach(item => allStrings(item, out));
  else if (value && typeof value === "object") Object.values(value).forEach(item => allStrings(item, out));
  return out;
}
/** Removes structural labels and returns the reader-facing content of one source line. */
function sourceContent(line) {
  let text = line.trim();
  if (!text) return "";
  if (/^(\*\*)?(Correct answer|Recommended|Status|Content type|Minutes|Objectives|Takeaways|Sections|Remember|Options|Plan starters|Course objectives|Last reviewed)(:\*\*|\*\*:|:)/i.test(text)) return "";
  if (/^## Lesson \d+:/.test(text)) return normalize(text.replace(/^## Lesson \d+:\s*/, ""));
  if (/^## (Job aid|Sources)\s*$/.test(text)) return "";
  if (/^# /.test(text)) return normalize(text.replace(/^# [a-z0-9-]+:\s*/, ""));
  text = text.replace(/^### (Text|List|Accordion|Tabs|Leader move|Section)(:\s*)?/, "");
  if (/^### (Scenario|Statement|Knowledge check|Transfer prompt)\s*$/.test(text)) return "";
  text = text.replace(/^### /, "").replace(/^#### (Tab|Item):\s*/, "");
  text = text.replace(/^\*\*(Tab|Item|Section):\s*(.+)\*\*$/, "$2").replace(/^(Tab|Item):\s*/, "");
  text = text.replace(/^(?:\*\*)?(Subtitle|Duration|Evidence date|Scope note|Scope|Review needed|Applied next step|Summary|Control|Failure|Next|Context|Prompt|Question|Response(?: [A-Z0-9]+)?|Feedback if correct|Feedback if incorrect|Feedback correct|Feedback incorrect|Title|Purpose|Do next|Body|Option(?: [A-Z0-9]+)?(?: \(recommended\))?)(?::\*\*|\*\*:|:)\s*/i, "");
  text = text.replace(/^[-*] +/, "").replace(/^\d+[.)] +/, "").replace(/^> ?/, "").replace(/\s*\(correct\)\s*$/i, "");
  return normalize(text).replace(/\s*,\s*$/, "");
}
function verifySurvival(file, raw, pack) {
  const body = normalize(allStrings(pack).join(" \n "));
  let checked = 0;
  for (const [i, line] of raw.entries()) {
    // A source line is "title, url. note": the title and the note are checked separately.
    const source = line.trim().match(/^- \*\*(.+?)\*\*[,.]?\s*(?:https:\/\/\S+|\/\S+)\s*(.*)$/) ?? line.trim().match(/^- (.+?),\s*(?:https:\/\/\S+|\/\S+)\s*(.*)$/);
    const parts = source ? [source[1], source[2]].map(part => normalize(part)).filter(Boolean) : [sourceContent(line)].filter(Boolean);
    if (!parts.length) continue;
    checked += 1;
    if (!parts.every(part => body.includes(part))) throw new Error(`${file}:${i + 1}: this source line did not survive the import:\n  > ${line.slice(0, 200)}`);
  }
  return checked;
}
function words(value) { return (value.match(/[\p{L}\p{N}'’-]+/gu) ?? []).length; }

// ---- Run --------------------------------------------------------------------
const files = readdirSync(sourceDir).filter(name => /^sm-.*\.md$/.test(name)).sort();
const expected = new Set(COURSES.map(([id]) => `${id}.md`));
const stray = files.filter(name => !expected.has(name));
const absent = [...expected].filter(name => !files.includes(name));
if (stray.length || absent.length) throw new Error(`Course list does not match the source folder. Not listed here: ${stray.join(", ") || "none"}. Missing from the folder: ${absent.join(", ") || "none"}.`);

const manifest = [];
const packs = [];
for (const [position, [id, cover, coverAlt]] of COURSES.entries()) {
  const file = `${id}.md`;
  if (!existsSync(path.join(root, "public/images/covers", cover))) throw new Error(`${file}: cover image ${cover} does not exist`);
  const { pack, raw } = parseCourse(file, id, FIRST_INDEX + position, cover, coverAlt);
  const parsed = CoursePackSchema.safeParse(pack);
  if (!parsed.success) throw new Error(`${file}: failed CoursePackSchema\n${JSON.stringify(parsed.error.issues.slice(0, 8), null, 1)}`);
  const linesChecked = verifySurvival(file, raw, pack);
  const blocks = pack.course.lessons.flatMap(lesson => lesson.blocks);
  const count = type => blocks.filter(block => block.type === type).length;
  const source = raw.join("\n");
  const sourceCount = pattern => (source.match(pattern) ?? []).length;
  const row = {
    id, lessons: pack.course.lessons.length, minutes: pack.course.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0),
    scenarios: pack.course.lessons.filter(lesson => lesson.scenario).length,
    transfers: pack.course.lessons.filter(lesson => lesson.transfer).length,
    knowledgeChecks: count("knowledgeCheck"), text: count("text"), statements: count("statement"), lists: count("list"),
    tabs: count("tabs"), accordions: count("accordion"), leaderMoves: count("leaderMove"),
    jobAidSections: pack.jobAid.sections.length, sources: pack.sources.length,
    sourceWords: words(raw.join(" ")), packWords: words(allStrings(pack).join(" ")), linesChecked,
  };
  const compare = [["lessons", /^## Lesson \d+:/gm], ["scenarios", /^### Scenario\s*$/gm], ["transfers", /^### Transfer prompt\s*$/gm], ["knowledgeChecks", /^### Knowledge check\s*$/gm], ["statements", /^### Statement\s*$/gm], ["tabs", /^### Tabs\b/gm], ["accordions", /^### Accordion\b/gm], ["leaderMoves", /^### Leader move\b/gm]];
  for (const [key, pattern] of compare) if (sourceCount(pattern) !== row[key]) throw new Error(`${file}: ${key} count ${row[key]} does not match the source count ${sourceCount(pattern)}`);
  manifest.push(row);
  packs.push({ id, pack });
}
const totals = manifest.reduce((sum, row) => { for (const [key, value] of Object.entries(row)) if (typeof value === "number") sum[key] = (sum[key] ?? 0) + value; return sum; }, {});
console.table(manifest.map(({ id, lessons, minutes, scenarios, knowledgeChecks, transfers, tabs, accordions, sources, sourceWords, packWords, linesChecked }) => ({ id, lessons, minutes, scenarios, knowledgeChecks, transfers, tabs, accordions, sources, sourceWords, packWords, linesChecked })));
console.log("Totals", totals);

const stable = value => `${JSON.stringify(value, null, 1)}\n`;
const indexSource = [
  'import type { CoursePack } from "../../source-types";',
  ...packs.map(({ id }, i) => `import pack${i + 1} from "./${id}.json";`),
  "",
  "/**",
  " * Generated by scripts/content/import-supervisor-courses.mjs from the sm-*.md sources.",
  " * Do not edit these packs by hand; change the Markdown and run the importer again.",
  " */",
  `export const SUPERVISOR_MANAGER_COURSE_PACKS = [${packs.map((_, i) => `pack${i + 1}`).join(", ")}] as unknown as readonly CoursePack[];`,
  "",
].join("\n");
if (check) {
  let stale = 0;
  for (const { id, pack } of packs) {
    const target = path.join(outDir, `${id}.json`);
    if (!existsSync(target) || readFileSync(target, "utf8").replace(/\r\n/g, "\n") !== stable(pack)) { console.log(`Out of date: ${id}`); stale += 1; }
  }
  if (stale) process.exit(1);
  console.log("All 19 packs match the source files.");
} else {
  mkdirSync(outDir, { recursive: true });
  for (const { id, pack } of packs) writeFileSync(path.join(outDir, `${id}.json`), stable(pack));
  writeFileSync(path.join(outDir, "import-manifest.json"), stable({ courses: manifest, totals }));
  writeFileSync(path.join(outDir, "index.ts"), indexSource);
  console.log(`Wrote ${packs.length} course packs to ${path.relative(root, outDir)}`);
}
