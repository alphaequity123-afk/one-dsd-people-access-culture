
import { SourceLink } from "@/components/app-link";
import { Fragment, type ReactNode } from "react";
import { parseResearchMarkdown, type ResearchBlock } from "@/lib/content/research-markdown";
import { PrivateNotes } from "./private-notes";
import "./research-markdown.css";

const INLINE = /\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)|\*\*(.+?)\*\*|(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])|(https?:\/\/[^\s<]*[^\s<.,;:)])/g;

export function ResearchInline({ text }: { text: string }): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const key = match.index;
    if (match[1]) parts.push(<SourceLink key={key} href={match[2]}><ResearchInline text={match[1]} /></SourceLink>);
    else if (match[3]) parts.push(<strong key={key}><ResearchInline text={match[3]} /></strong>);
    else if (match[4]) parts.push(<em key={key}><ResearchInline text={match[4]} /></em>);
    else if (match[5]) parts.push(<SourceLink key={key} href={match[5]}>{match[5]}</SourceLink>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts.map((part, index) => <Fragment key={index}>{part}</Fragment>)}</>;
}

function Block({ block, notesKey }: { block: ResearchBlock; notesKey?: string }) {
  switch (block.type) {
    case "heading": {
      const Heading = block.level === 4 ? "h4" : "h3";
      return <Heading><ResearchInline text={block.text} /></Heading>;
    }
    case "paragraph": return <p><ResearchInline text={block.text} /></p>;
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return <List>{block.items.map((item, index) => <li key={index}><ResearchInline text={item} /></li>)}</List>;
    }
    case "table": return <div className="community-table" role="region" aria-label="Table" tabIndex={0}><table>
      <thead><tr>{block.header.map((cell, index) => <th key={index} scope="col"><ResearchInline text={cell} /></th>)}</tr></thead>
      <tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, index) => <td key={index}><ResearchInline text={cell} /></td>)}</tr>)}</tbody>
    </table></div>;
    case "note": return <aside className="research-note" role="note"><strong>Content note.</strong> <ResearchInline text={block.text} /></aside>;
    case "voice": return <blockquote className="research-voice"><ResearchBlocks blocks={block.blocks} /></blockquote>;
    case "fact": return <aside className="research-fact"><ResearchBlocks blocks={block.blocks} /></aside>;
    case "takeaway": return <aside className="research-takeaway"><p className="research-label">Practice this week</p><ResearchBlocks blocks={block.blocks} /></aside>;
    case "reflect": return <section className="research-reflect" aria-label="Reflection">
      <p className="research-label">For your own reflection.</p>
      <ol>{block.items.map((item, index) => <li key={index}><ResearchInline text={item} /></li>)}</ol>
      {notesKey ? <PrivateNotes storageKey={notesKey} /> : null}
    </section>;
    case "scenario": return <section className="research-scenario" aria-label="Practice scenario">
      {block.label ? <p className="research-label"><ResearchInline text={block.label} /></p> : null}
      <ResearchBlocks blocks={block.blocks} />
      <p className="research-scenario-question"><ResearchInline text={block.question} /></p>
      {block.options.map((option, index) => <details key={index} className="research-scenario-option">
        <summary><ResearchInline text={option.choice} /></summary>
        <p><ResearchInline text={option.feedback} /></p>
      </details>)}
      <p className="research-scenario-hint">Open any answer to see what it might lead to. You can open all of them.</p>
    </section>;
  }
}

export function ResearchBlocks({ blocks, notesKey }: { blocks: ResearchBlock[]; notesKey?: string }) {
  return <>{blocks.map((block, index) => <Block key={index} block={block} notesKey={notesKey} />)}</>;
}

export function ResearchMarkdown({ markdown, notesKey }: { markdown: string; notesKey?: string }) {
  return <ResearchBlocks blocks={parseResearchMarkdown(markdown)} notesKey={notesKey} />;
}
