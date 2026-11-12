/**
 * Ask's written answers are plain text. This removes Markdown markup that a writer or a
 * public source may have used, and keeps the words, numbers, code and formulas themselves.
 * It is safe to apply to an answer that is still arriving.
 */
export function plainAnswerText(value: string): string {
  return (value ?? "")
    // Code fences go; the code inside stays on its own lines.
    .replace(/^[ \t]*(?:`{3,}|~{3,})[^\n`]*(?:\n|$)/gm, "")
    // Inline code keeps its text.
    .replace(/`+([^`\n]+?)`+/g, "$1")
    // Images and links become their label followed by the address.
    .replace(/!?\[([^\]\n]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)(?:\s+"[^"\n]*")?\)/g, "$1 ($2)")
    // Headings and block quotes lose their markers.
    .replace(/^[ \t]{0,3}#{1,6}(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/gm, (_line, heading?: string) => heading ?? "")
    .replace(/^[ \t]{0,3}>[ \t]?/gm, "")
    // Rules and table divider rows are dropped.
    .replace(/^[ \t]*([-*_])(?:[ \t]*\1){2,}[ \t]*(?:\n|$)/gm, "")
    .replace(/^[ \t]*\|?[ \t]*:?-{2,}:?[ \t]*(?:\|[ \t]*:?-{2,}:?[ \t]*)+\|?[ \t]*(?:\n|$)/gm, "")
    // A table row becomes its cells, separated by semicolons.
    .replace(/^[ \t]*\|(.+)\|[ \t]*$/gm, (_row, cells: string) => cells.split("|").map(cell => cell.trim()).filter(Boolean).join("; "))
    // Bold, strikethrough and emphasis keep their words. Arithmetic and names such as 2**3, 3 * 4 and snake_case are untouched.
    .replace(/(?<![\w*])\*\*(?=\S)([^*\n]+?)(?<=\S)\*\*(?![\w*])/g, "$1")
    // Two underscores mark bold only around a phrase; a name such as __init__ is left alone.
    .replace(/(?<![\w_])__(?=\S)([^_\n]*?\s[^_\n]*?)(?<=\S)__(?![\w_])/g, "$1")
    .replace(/~~(?=\S)([^~\n]+?)(?<=\S)~~/g, "$1")
    .replace(/(?<![\w*])\*(?=[^\s*])([^*\n]+?)(?<=[^\s*])\*(?![\w*])/g, "$1")
    .replace(/(?<![\w_])_(?=[^\s_])([^_\n]+?)(?<=[^\s_])_(?![\w_])/g, "$1")
    // List items start with a hyphen.
    .replace(/^([ \t]*)[*+][ \t]+/gm, "$1- ")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * The same for an answer that is still arriving. Markup that has only half arrived is held
 * back or dropped, so the words on the page only ever grow and nothing flickers.
 */
export function plainLiveText(value: string): string {
  // A link, image or bracketed note that has not finished arriving is held back.
  const text = (value ?? "").replace(/!?\[[^\]\n]*(?:\](?:\([^)\n]*)?)?$/, "");
  const lastBreak = text.lastIndexOf("\n");
  const head = text.slice(0, lastBreak + 1);
  let tail = text.slice(lastBreak + 1);
  // A last line that is so far only a marker (list, heading, quote, rule, table row or code fence) is held back.
  if (/^[ \t]*(?:[*+>-]+|#{1,6}|[-*_ \t]{2,}|[`~]+[\w+-]*|\|.*)$/.test(tail)) tail = "";
  // A marker still arriving at the very end is held back.
  tail = tail.replace(/[*_~`]+$/, "");
  // A marker with no partner yet is dropped; the words stay.
  if ((tail.split("`").length - 1) % 2 === 1) {
    const at = tail.lastIndexOf("`");
    tail = tail.slice(0, at) + tail.slice(at + 1);
  }
  // Only a marker that opens emphasis is dropped. Arithmetic such as 2**3 or 3 * 4 is left as written.
  tail = tail
    .replace(/(?<![\w*])\*\*(?=\S)([^*\n]*)$/, "$1")
    .replace(/(?<![\w~])~~(?=\S)([^~\n]*)$/, "$1")
    .replace(/(?<![\w*])\*(?=[^\s*])([^*\n]*)$/, "$1");
  return plainAnswerText(head + tail);
}

