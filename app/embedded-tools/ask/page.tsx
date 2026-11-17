import { AskClient } from "@/components/ask-client";
import { prepareAsk } from "@/app/ask/ask-view";
export default async function EmbeddedAsk() {
  const { copy, research } = await prepareAsk();
  return <div className="embedded-tool"><h1 className="sr-only">Ask for guidance</h1><AskClient researchAvailable={Boolean(research?.enabled)} intakeEnabled={false} copy={copy} /></div>;
}
