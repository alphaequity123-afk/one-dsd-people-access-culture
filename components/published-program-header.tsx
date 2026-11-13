import "server-only";
import { DsdProgramHeader } from "@/components/dsd-program-header";
import { culturalIntelligenceHubAvailable } from "@/lib/content/cultural-intelligence-publication";
import { prepareAsk } from "@/app/ask/ask-view";

export async function PublishedProgramHeader() {
  const [culturalIntelligenceAvailable, ask] = await Promise.all([
    culturalIntelligenceHubAvailable(),
    prepareAsk(),
  ]);
  return <DsdProgramHeader culturalIntelligenceAvailable={culturalIntelligenceAvailable}
    ask={ask.enabled ? { copy: ask.copy, researchAvailable: Boolean(ask.research?.enabled) } : undefined} />;
}
