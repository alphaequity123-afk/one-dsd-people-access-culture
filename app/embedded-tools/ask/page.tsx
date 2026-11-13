import { AskClient } from "@/components/ask-client";
import { prepareAsk } from "@/app/ask/ask-view";
export default async function EmbeddedAsk() {
  const { copy, research } = await prepareAsk();
  return <div className="embedded-tool"><AskClient researchAvailable={Boolean(research?.enabled)} intakeEnabled={false} copy={copy} /></div>;
}
