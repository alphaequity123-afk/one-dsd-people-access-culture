/**
 * Server-sent events from a model service's streamed reply, one at a time.
 * Only the "event" and "data" fields are used; comment lines and other fields are skipped.
 */
export async function* sseEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<{ event: string; data: string }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const parse = (block: string) => {
    let event = "message";
    const data: string[] = [];
    for (const line of block.replace(/\r\n?/g, "\n").split("\n")) {
      if (!line || line.startsWith(":")) continue;
      const colon = line.indexOf(":");
      const field = colon < 0 ? line : line.slice(0, colon);
      const value = colon < 0 ? "" : line.slice(colon + 1).replace(/^ /, "");
      if (field === "event") event = value;
      else if (field === "data") data.push(value);
    }
    return data.length ? { event, data: data.join("\n") } : undefined;
  };
  try {
    for (;;) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      for (let boundary = /\r\n\r\n|\n\n|\r\r/.exec(buffer); boundary; boundary = /\r\n\r\n|\n\n|\r\r/.exec(buffer)) {
        const parsed = parse(buffer.slice(0, boundary.index));
        buffer = buffer.slice(boundary.index + boundary[0].length);
        if (parsed) yield parsed;
      }
      if (done) {
        const parsed = parse(buffer);
        if (parsed) yield parsed;
        return;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
