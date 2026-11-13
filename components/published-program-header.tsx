import "server-only";
import { DsdProgramHeader } from "@/components/dsd-program-header";
import { culturalIntelligenceHubAvailable } from "@/lib/content/cultural-intelligence-publication";

/** Retain the existing navigation; only the collection entry depends on its publication. */
export async function PublishedProgramHeader() {
  // A failed check keeps existing navigation usable while withholding the collection.
  const culturalIntelligenceAvailable = await culturalIntelligenceHubAvailable();
  return <DsdProgramHeader culturalIntelligenceAvailable={culturalIntelligenceAvailable} />;
}
