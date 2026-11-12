export const resourceArtifactKinds = {
  "study-guide": "Study guide",
  quiz: "Quiz",
  flashcards: "Flashcards",
  "mind-map": "Mind map",
  slides: "Slide outline",
  infographic: "Infographic",
  "audio-overview": "Audio overview",
  "video-overview": "Video overview",
} as const;

export type ResourceArtifactKind = keyof typeof resourceArtifactKinds;
export function isResourceArtifactKind(value: unknown): value is ResourceArtifactKind {
  return typeof value === "string" && Object.hasOwn(resourceArtifactKinds, value);
}
export type ResourceArtifactSource = { id: string; title: string; href: string };
type Cited = { sourceIds: string[] };

export type ResourceArtifactSections = {
  "study-guide": { heading: string; text: string } & Cited;
  quiz: { question: string; options: string[]; correctIndex: number; explanation: string } & Cited;
  flashcards: { front: string; back: string } & Cited;
  "mind-map": { heading: string; branches: string[] } & Cited;
  slides: { heading: string; points: string[]; speakerNotes: string } & Cited;
  infographic: { heading: string; text: string; visualCue: string } & Cited;
  "audio-overview": { speaker: "host1" | "host2"; text: string } & Cited;
  "video-overview": { heading: string; narration: string; visualCue: string; onScreen: string[] } & Cited;
};

export type ResourceArtifact = {
  [Kind in ResourceArtifactKind]: {
    version: 1;
    kind: Kind;
    resourcePath: string;
    title: string;
    summary: string;
    sourceRevision: string;
    createdAt: string;
    sources: ResourceArtifactSource[];
    sections: ResourceArtifactSections[Kind][];
  }
}[ResourceArtifactKind];

export type ArtifactResourceLink = { resourcePath: string; title: string };
export type ArtifactResource = ArtifactResourceLink & { type: string; relatedCount: number; related: ArtifactResourceLink[] };
export type ArtifactResourceSearch = { resources: ArtifactResource[]; total: number; nextOffset?: number };
