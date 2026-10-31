import manifest from "./legacy-media-manifest.json";

export type PreservedMedia = { identity: string; kind: string; disposition: string; href: string; donorSha256: string; targetSha256?: string };
/** Portable-edition preservation, not course approval or a replacement voice selection. */
export const preservedMedia: PreservedMedia[] = manifest.resources;
export const legacyMergeSummary = manifest.summary;
export const mergedResourceConnections = [
  { title: "Learning and practical resources", description: "The full native catalog and later self-directed courses remain available in the unified course library.", href: "/courses" },
  { title: "Equity analysis and policy review", description: "Use the existing Toolkit companion and practice resources, with current authority confirmed for official work.", href: "/learn/equity-toolkit" },
  { title: "Service and workplace responsibilities", description: "Work areas connect resources with the decisions and tasks people carry out in DSD.", href: "/areas" },
  { title: "Community knowledge", description: "Published community resources retain their review and referral boundaries; recovery does not make held material approved.", href: "/minnesota-communities" },
  { title: "Listening and spoken examples", description: "The current audio library provides recordings already available in the full application. Approved course voices remain unchanged.", href: "/audio-library" },
  { title: "One DSD collaboration", description: "Team learning, resource selections and Amplify Equity remain connected to the program’s DSD home.", href: "/one-dsd" },
];

