import type { ReactNode } from "react";

function inline(text: string, turn: number): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\[\d+\])/).map((part, index) => {
    const citation = part.match(/^\[(\d+)\]$/);
    if (citation) return <sup key={index}><a className="cite" href={`#source-${turn}-${citation[1]}`} aria-label={`Source ${citation[1]}`}>[{citation[1]}]</a></sup>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{inline(part.slice(2, -2), turn)}</strong>;
    return part;
  });
}

/** Render a small, inert formatting subset; source citations remain the only generated links. */
export function AnswerText({ text, turn }: { text: string; turn: number }) {
  return <>{text.split(/\n{2,}/).filter(Boolean).map((block, index) => {
    const heading = block.match(/^#{1,3}\s+([^\n]+)$/) ?? block.match(/^\*\*([^*\n]+:)\*\*$/);
    if (heading) return <h3 key={index}>{inline(heading[1], turn)}</h3>;
    const lines = block.split("\n").filter(line => line.trim());
    if (lines.every(line => /^\d+\.\s+/.test(line))) {
      return <ol key={index}>{lines.map((line, item) => <li key={item} value={Number(line.match(/^\d+/)![0])}>{inline(line.replace(/^\d+\.\s+/, ""), turn)}</li>)}</ol>;
    }
    if (lines.every(line => /^[-*]\s+/.test(line))) {
      return <ul key={index}>{lines.map((line, item) => <li key={item}>{inline(line.replace(/^[-*]\s+/, ""), turn)}</li>)}</ul>;
    }
    return <p key={index} style={{ whiteSpace: "pre-line" }}>{inline(block, turn)}</p>;
  })}</>;
}
