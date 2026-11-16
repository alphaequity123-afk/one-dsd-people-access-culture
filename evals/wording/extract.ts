/**
 * Staff-visible text, read straight from the repository (no build, no server).
 *
 * Sources: lib/content and lib/program data (TypeScript and JSON), the page copy contracts inside lib/content,
 * training definitions under data/trainings, area names under data/workforce, JSX text and visible attributes in
 * app/ and components/, and the published HTML documents under public/.
 *
 * Extraction is deliberately conservative so a person can trust each hit:
 * - JSX text and the visible attributes (title, alt, aria-label, placeholder, label, description and similar).
 * - String values in object literals and JSON, unless the nearest key is technical (id, href, className, ...)
 *   or an ancestor key holds someone else's words (sources, citations, quotes, transcripts, captions).
 * - Prose constants (three or more words) assigned to variables or returned from functions.
 * Strings passed to calls (errors, logs, class helpers, SQL) are never read as visible text.
 * Shared by A5 (wording) and A9 (visible text that claims counting).
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

export const ROOT = fileURLToPath(new URL("../../", import.meta.url));

export type TextOrigin = "jsx" | "attribute" | "property" | "constant" | "json" | "html";
export type VisibleText = {
  /** Repository-relative path with forward slashes. */
  file: string;
  line: number;
  text: string;
  origin: TextOrigin;
  /** Nearest property or attribute name, when there is one. */
  key?: string;
  /** Grouping for "first use" rules: one course, one page record or one component file. */
  unit: string;
};

const VISIBLE_ATTRIBUTES = new Set([
  "title", "alt", "aria-label", "aria-description", "aria-roledescription", "placeholder", "label", "description", "heading",
  "summary", "intro", "lede", "eyebrow", "kicker", "caption", "subtitle", "text", "body", "cta", "ctaLabel", "buttonLabel",
  "linkLabel", "actionLabel", "emptyMessage", "emptyText", "helper", "hint", "note", "legend", "question", "prompt", "message",
  "name", "value", "defaultValue", "content", "children", "tooltip", "backLabel", "submitLabel", "listenLabel", "watchLabel",
]);

/** Nearest keys whose values are addresses, identifiers, styling or machine states, never prose. */
const TECHNICAL_KEYS = new Set([
  "id", "ids", "slug", "slugs", "key", "keys", "href", "hrefs", "url", "urls", "src", "srcset", "path", "paths", "file", "files", "route",
  "routes", "type", "types", "kind", "kinds", "status", "state", "classname", "class", "style", "styles", "color", "colors", "colour", "tone",
  "icon", "variant", "size", "format", "formats", "mime", "mimetype", "contenttype", "lang", "language", "locale", "date", "dates", "time",
  "updated", "created", "reviewed", "reviewedon", "reviewdate", "retrieved", "sha256", "hash", "audio", "video", "poster", "image", "images",
  "thumbnail", "cover", "coverimage", "vtt", "email", "phone", "rel", "target", "method", "role", "as", "anchor", "fragment", "query",
  "pattern", "patterns", "regex", "sql", "scope", "scopes", "scopepolicy", "surfaceid", "field", "fieldkey", "fields", "rights", "width",
  "height", "credit", "voice", "voices", "model", "provider", "env", "cookie", "header", "headers", "accept", "name_key", "sourcehref",
  "communityid", "agencyid", "courseid", "lessonid", "moduleid", "eventid", "areaid", "family", "families", "competency", "competencies",
  "tags", "tag", "keywords", "intents", "aliases", "matches", "match", "terms", "search", "searchterms", "facets", "facet", "level", "order",
  "duration", "minutes", "seconds", "start", "end", "count", "version", "schema", "schemaversion", "checksum", "bytes", "mode", "layout",
  "position", "align", "placement", "sort", "category", "categories", "group", "groups", "audience", "audiences", "theme", "themes",
]);
const TECHNICAL_KEY_SUFFIX = /(?:Id|Ids|Href|Hrefs|Url|Urls|Path|Paths|Key|Keys|Class|ClassName|Date|At|Sha256|Hash|Slug|Slugs|File|Files|Src|Kind|Type|Status|Pattern|Regex|Route|Scope|Cookie)$/;

/** Ancestor keys whose subtree is someone else's words or the recorded audio (protected from rewording). */
const PROTECTED_SUBTREES = new Set([
  "sources", "source", "citations", "citation", "quotes", "quote", "quotation", "transcript", "transcripts", "captions", "references",
  "reference", "bibliography", "attribution", "originaltext", "original", "sourcetext", "verbatim", "excerpt", "excerpts", "publisher",
  "sourcetitle", "originaltitle", "narration", "introtranscript", "speakers", "segments", "cues", "before", "beforevariants",
]);

const LABEL_KEYS = new Set(["label", "title", "badge", "tag", "eyebrow", "kicker", "heading", "name", "cta", "button", "buttonlabel", "status_label", "statuslabel", "pill"]);

const lettersRe = /[A-Za-z]/;
const words = (text: string) => text.split(/\s+/).filter(word => /[A-Za-z]{2,}/.test(word)).length;
const technicalString = (text: string) =>
  /^(?:https?:|mailto:|tel:|\/|#|\.\/|\.\.\/|data:)/.test(text) || /^[\w.:/#?=&%@+~-]+$/.test(text) && !/^[A-Z][a-z]+$/.test(text) ||
  /^(?:[a-z0-9]+(?:[-:/][a-z0-9[\]/.%]+)+\s*)+$/.test(text) || /\b(?:select|insert|update|delete)\b[\s\S]*\b(?:from|into|set)\b/i.test(text) && /[_*=]/.test(text);

function normalizeKey(key: string): string { return key.replace(/^['"]|['"]$/g, ""); }
function keyIsTechnical(key: string): boolean { return TECHNICAL_KEYS.has(key.toLowerCase()) || TECHNICAL_KEY_SUFFIX.test(key); }

/** Is this string worth reading as prose for the given context? */
function proseLike(text: string, key: string | undefined, strict: boolean): boolean {
  const t = text.trim();
  if (!t || !lettersRe.test(t) || technicalString(t)) return false;
  if (strict) return words(t) >= 3;
  if (words(t) >= 2) return true;
  // A single word counts only as a label ("Draft", "TBD", "Coming").
  return Boolean(key && LABEL_KEYS.has(key.toLowerCase()) && /^[A-Z(]/.test(t));
}

function propertyName(node: ts.PropertyName | ts.JsxAttributeName, source: ts.SourceFile): string {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node) || ts.isPrivateIdentifier(node)) return node.text;
  return normalizeKey(node.getText(source));
}

type Context = { include: boolean; key?: string; origin: TextOrigin; strict: boolean };

/** Decide, from the parents, whether a string literal is visible text. */
function contextOf(node: ts.Node, source: ts.SourceFile, isJson: boolean): Context {
  let child: ts.Node = node;
  let parent = node.parent;
  let nearest: Context | undefined;
  while (parent) {
    if (ts.isPropertyAssignment(parent) && parent.initializer === child || ts.isShorthandPropertyAssignment(parent)) {
      const key = propertyName((parent as ts.PropertyAssignment).name, source);
      if (PROTECTED_SUBTREES.has(key.toLowerCase())) return { include: false, origin: "property", strict: false };
      if (!nearest) {
        if (keyIsTechnical(key)) return { include: false, origin: "property", strict: false };
        nearest = { include: true, key, origin: isJson ? "json" : "property", strict: false };
      }
    } else if (ts.isPropertyAssignment(parent) && parent.name === child) {
      return { include: false, origin: "property", strict: false };
    } else if (ts.isJsxAttribute(parent)) {
      const name = propertyName(parent.name, source);
      if (!nearest) return { include: VISIBLE_ATTRIBUTES.has(name), key: name, origin: "attribute", strict: false };
      return /^(?:style|className|sx|css|data-.*|href|src|id|key)$/.test(name) ? { include: false, origin: "attribute", strict: false } : nearest;
    } else if (ts.isJsxExpression(parent)) {
      if (parent.parent && (ts.isJsxElement(parent.parent) || ts.isJsxFragment(parent.parent))) return nearest ?? { include: true, origin: "jsx", strict: false };
    } else if (ts.isVariableDeclaration(parent)) {
      if (nearest) return nearest;
      const name = parent.name.getText(source);
      if (/(?:HREF|URL|PATH|_ID|IDS|KEY|PATTERN|REGEX|SQL|QUERY|CLASS|STYLE|SELECTOR|COOKIE|HEADER|MIME|ENV|FILE|ROUTE|SLUG)S?$/i.test(name)) return { include: false, origin: "constant", strict: false };
      return { include: true, origin: "constant", strict: true };
    } else if (!nearest && (ts.isReturnStatement(parent) || ts.isArrowFunction(parent) && parent.body === child)) {
      return { include: true, origin: "constant", strict: true };
    } else if (nearest && (ts.isCallExpression(parent) || ts.isNewExpression(parent))) {
      // An object of content handed to a helper (defineEditableSurface({...})) keeps its keys' meaning;
      // objects handed to logging or errors are not visible text.
      const callee = parent.expression.getText(source);
      if (/^(?:console\.\w+|new Error|Error|fetch|JSON\.stringify|Response\.json|NextResponse\.json|logger\.\w+|z\.\w+)/.test(callee)) return { include: false, origin: "property", strict: false };
    } else if (nearest) {
      // Above the nearest key only protected subtrees matter.
    } else if (
      ts.isCallExpression(parent) || ts.isNewExpression(parent) || ts.isTaggedTemplateExpression(parent) || ts.isImportDeclaration(parent) ||
      ts.isExportDeclaration(parent) || ts.isCaseClause(parent) || ts.isElementAccessExpression(parent) || ts.isTypeNode(parent) ||
      ts.isEnumMember(parent) || ts.isParameter(parent) || ts.isImportTypeNode(parent) || ts.isExternalModuleReference(parent) ||
      ts.isBinaryExpression(parent) && ![ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.PlusToken, ts.SyntaxKind.EqualsToken].includes(parent.operatorToken.kind) ||
      ts.isPropertyAccessExpression(parent) || ts.isExpressionStatement(parent) && ts.isStringLiteral(child) /* "use client" */
    ) {
      return { include: false, origin: "property", strict: false };
    } else if (isJson && ts.isSourceFile(parent)) {
      return nearest ?? { include: false, origin: "json", strict: false };
    } else if (ts.isSourceFile(parent) || ts.isBlock(parent) || ts.isFunctionDeclaration(parent) || ts.isClassDeclaration(parent)) {
      return nearest ?? { include: false, origin: "constant", strict: false };
    }
    child = parent;
    parent = parent.parent;
  }
  return nearest ?? { include: false, origin: "constant", strict: false };
}

/** Units for JSON: the path down to the first array element (one course, one brief, one event). */
function jsonUnit(node: ts.Node, file: string): string {
  const path: string[] = [];
  let child: ts.Node = node;
  let parent = node.parent;
  while (parent && !ts.isSourceFile(parent)) {
    if (ts.isArrayLiteralExpression(parent)) path.unshift(`[${parent.elements.indexOf(child as ts.Expression)}]`);
    else if (ts.isPropertyAssignment(parent)) path.unshift(`.${normalizeKey(parent.name.getText())}`);
    child = parent;
    parent = parent.parent;
  }
  const first = path.findIndex(part => part.startsWith("["));
  return `${file}${first >= 0 ? path.slice(0, first + 1).join("") : path.slice(0, 2).join("")}`;
}

function templateText(node: ts.TemplateExpression): string {
  return [node.head.text, ...node.templateSpans.map(span => span.literal.text)].join(" … ");
}

export function extractFromSource(file: string, text: string): VisibleText[] {
  const isJson = file.endsWith(".json");
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : isJson ? ts.ScriptKind.JSON : ts.ScriptKind.TS;
  const source = isJson ? ts.parseJsonText(file, text) : ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
  if (isJson) setParents(source);
  const out: VisibleText[] = [];
  const add = (node: ts.Node, value: string, ctx: Context) => {
    const clean = value.replace(/\s+/g, " ").trim();
    if (!ctx.include || !proseLike(clean, ctx.key, ctx.strict)) return;
    const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
    out.push({ file, line, text: clean, origin: ctx.origin, key: ctx.key, unit: isJson ? jsonUnit(node, file) : file });
  };
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) {
      const value = node.text;
      if (lettersRe.test(value)) add(node, value, { include: true, origin: "jsx", strict: false });
      return;
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      add(node, node.text, contextOf(node, source, isJson));
      return;
    }
    if (ts.isTemplateExpression(node)) {
      add(node, templateText(node), contextOf(node, source, isJson));
      // Strings inside the ${...} parts are checked on their own.
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return out;
}

function setParents(node: ts.Node) {
  ts.forEachChild(node, child => { (child as { parent?: ts.Node }).parent = node; setParents(child); });
}

/** Published HTML documents: visible text by line, scripts and styles removed. */
export function extractFromHtml(file: string, html: string): VisibleText[] {
  const blanked = html
    .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, match => match.replace(/[^\n]/g, " "))
    .replace(/<!--[\s\S]*?-->/g, match => match.replace(/[^\n]/g, " "));
  const out: VisibleText[] = [];
  blanked.split("\n").forEach((line, index) => {
    const text = line.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&[a-z]+;|&#\d+;/g, " ").replace(/\s+/g, " ").trim();
    if (text && lettersRe.test(text) && words(text) >= 1) out.push({ file, line: index + 1, text, origin: "html", unit: file });
  });
  return out;
}

export type SourceSet = { roots: string[]; include: RegExp; exclude: RegExp[] };

/** Where staff-visible text lives in this repository. */
export const STAFF_VISIBLE_SOURCES: SourceSet[] = [
  { roots: ["lib/content", "lib/program"], include: /\.(?:ts|json)$/, exclude: [
    /\.test\.ts$/, /__fixtures__/, /\.vitest\.config\./, /-revisions\.json$/, /historical-course-editorial\.json$/, /image-4k-paths\.json$/,
    /reading-links\.json$/, /page-edits-store\.ts$/, /\.d\.ts$/,
  ] },
  { roots: ["data/trainings"], include: /^data\/trainings\/[^/]+\.json$/, exclude: [] },
  { roots: ["data/workforce"], include: /^data\/workforce\/areas\.json$/, exclude: [] },
  { roots: ["app"], include: /\.tsx?$/, exclude: [/^app\/api\//, /^app\/consultant\//, /\/route\.ts$/, /\.test\.tsx?$/, /\.d\.ts$/] },
  { roots: ["components"], include: /\.tsx?$/, exclude: [/\.test\.tsx?$/, /consultant/, /owner/, /-editor\.tsx$/, /universal-editor/, /\.d\.ts$/] },
  { roots: ["public"], include: /\.html$/, exclude: [] },
];

export function listFiles(sets: SourceSet[] = STAFF_VISIBLE_SOURCES, root = ROOT): string[] {
  const files: string[] = [];
  const walk = (dir: string, set: SourceSet) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) { if (entry.name !== "node_modules" && !entry.name.startsWith(".")) walk(full, set); continue; }
      const rel = relative(root, full).split(sep).join("/");
      if (set.include.test(rel) && !set.exclude.some(re => re.test(rel))) files.push(rel);
    }
  };
  for (const set of sets) for (const r of set.roots) walk(join(root, r), set);
  return [...new Set(files)].sort();
}

/** Every staff-visible string in the repository, with file and line. */
export function collectVisibleText(options: { root?: string; sets?: SourceSet[]; skipFiles?: (file: string) => boolean } = {}): { texts: VisibleText[]; files: number } {
  const root = options.root ?? ROOT;
  const files = listFiles(options.sets, root).filter(file => !options.skipFiles?.(file));
  const texts: VisibleText[] = [];
  for (const file of files) {
    const full = join(root, file);
    if (statSync(full).size > 20_000_000) continue;
    const content = readFileSync(full, "utf8");
    texts.push(...(file.endsWith(".html") ? extractFromHtml(file, content) : extractFromSource(file, content)));
  }
  return { texts, files: files.length };
}
