/**
 * The text of one string field in a JSON object that is still being written.
 * Returns what has arrived so far, decoded, or undefined when the field has not started.
 * An escape sequence that is cut off at the end is left out until the rest arrives.
 */
export function partialStringField(json: string, field: string): string | undefined {
  return readStringField(json, field)?.text;
}

/** The same, and whether the field's closing quote has arrived. */
export function readStringField(json: string, field: string): { text: string; complete: boolean } | undefined {
  const key = JSON.stringify(field);
  const at = json.indexOf(key);
  if (at < 0) return undefined;
  const opening = /^\s*:\s*"/.exec(json.slice(at + key.length));
  if (!opening) return undefined;
  let out = "";
  for (let index = at + key.length + opening[0].length; index < json.length; index++) {
    const character = json[index];
    if (character === "\"") return { text: out, complete: true };
    if (character !== "\\") { out += character; continue; }
    const next = json[index + 1];
    if (next === undefined) return { text: out, complete: false };
    if (next === "u") {
      const hex = json.slice(index + 2, index + 6);
      if (hex.length < 4 || !/^[0-9a-fA-F]{4}$/.test(hex)) return { text: out, complete: false };
      const code = parseInt(hex, 16);
      // The first half of a two-part character waits for its second half.
      if (code >= 0xd800 && code <= 0xdbff) {
        const low = /^\\u([dD][c-fC-F][0-9a-fA-F]{2})/.exec(json.slice(index + 6, index + 12));
        if (!low) return { text: out, complete: false };
        out += String.fromCharCode(code, parseInt(low[1], 16));
        index += 11;
        continue;
      }
      out += String.fromCharCode(code);
      index += 5;
      continue;
    }
    const simple: Record<string, string> = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", "\"": "\"", "\\": "\\", "/": "/" };
    out += simple[next] ?? next;
    index += 1;
  }
  return { text: out, complete: false };
}
