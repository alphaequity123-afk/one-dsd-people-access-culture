export type ProgramDocument = {
  slug: string; libraryId: string; title: string; shortTitle: string; kind: string;
  dateLabel: string; author: string; summary: string; purpose: string;
  href: string; filename: string; context: string; tags: string[];
};

// Original reports are retained in the private archive.
export const programDocuments: ProgramDocument[] = [];

export function getProgramDocument(slug: string) {
  return programDocuments.find(document => document.slug === slug);
}
export function originalDocumentHref(document: ProgramDocument) {
  return `/one-dsd/evidence/source/${document.slug}`;
}
export function documentDownloadHref(document: ProgramDocument) {
  return `/documents/program-evidence/${document.filename}`;
}

/** Only top-level numbered sections become navigation headings; original wording is retained. */
export function sourceSections(text: string) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const sections: { id: string; title: string; text: string }[] = [];
  let title = "Opening and context";
  let content: string[] = [];
  const flush = () => {
    if (content.join("\n").trim()) sections.push({ id: `section-${sections.length + 1}`, title, text: content.join("\n").trim() });
    content = [];
  };
  for (const line of lines) {
    if (/^\d{1,2}\.\s+[A-Z]/.test(line.trim()) && line.trim().length < 150) {
      flush(); title = line.trim();
    } else content.push(line);
  }
  flush();
  return sections;
}
