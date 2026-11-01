import { AskClient } from "@/components/ask-client";
import { cloneAgentsEnabled } from "@/lib/intelligence/clone/config";
import { getResearchPolicy } from "@/lib/intelligence/research/governance";
import styles from "./ask.module.css";
import { PageIntro } from "@/components/ui";
import { StaffAskBrowse } from "@/components/staff-ask-browse";
import { matchStaffAskTopic, staffAskTopics } from "@/lib/content/staff-ask-topics";
import { ParticipationNotice } from "@/components/participation-notice";
import { ProgramContextNote } from "@/components/program-context";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { stringValue } from "@/lib/content/staff-surface-registry";
import { requestedContentScope } from "@/lib/product/request-context";

export type AskSearchParams = { path?: string; q?: string; mode?: string; topic?: string; facet?: string };

/** Lighter surface on /ask shows the first questions; /ask/all keeps the complete original page. */
export const ASK_SURFACE_LIMIT = 6;

export async function AskView({ searchParams, part }: { searchParams: AskSearchParams; part: "surface" | "all" }) {
  const sp = searchParams;
  const scope = await requestedContentScope();
  const surface = await prepareEditableSurface("ask.page");
  const enabled = cloneAgentsEnabled();
  const research = enabled ? await getResearchPolicy() : null;
  const copy = enabled ? { ...surface.values, introKicker: "Your conversation", introTitle: "Ask", introLede: "Ask a question in your own words, whether it concerns your work, a resource, or an idea you are still shaping. Ask draws on the program's own material first and checks current public sources when a question calls for them. You can follow up, take the conversation in a new direction, or start fresh whenever you like.", answerButton: "Ask", questionLabel: "What would you like to ask?", questionHelp: "Write it the way you would put it to a colleague. There is no need to choose a topic or a search setting.", questionExample: "Ask a question or explore an idea…", howDsdPreviewSupport: "When a decision belongs to a person, Ask points you to the person or office responsible for it.", moreDsdPreviewBody: "Find the right person shows you who is responsible when a decision calls for someone's judgment.", privacyNotice: "Please use general or made-up examples, and leave out names, assessment scores, case details, medical or personnel information, and anything else confidential. So that Ask can respond, your question and the recent conversation are sent to outside answer and research services. This browser keeps the conversation for this session. The site’s operational records are designed to record use without retaining your conversation; outside services have their own data-handling terms." } : surface.values;
  const topics = staffAskTopics();
  const initial = matchStaffAskTopic(sp.topic) ?? matchStaffAskTopic(sp.path) ?? matchStaffAskTopic(sp.q);
  const all = part === "all";
  return (
    <EditableSurfaceRegion surface={surface} className={styles.page}>
      <PageIntro kicker={stringValue(copy, "introKicker")} title={all && !enabled ? "All common questions" : stringValue(copy, "introTitle")} lede={stringValue(copy, "introLede")}>
      </PageIntro>
      <div className={`wrap space-y-6 ${styles.body}`}>
        {enabled ? <>
          <AskClient initialQuestion={sp.q?.slice(0, 4000)} initialMode={sp.mode === "review" ? "review" : "question"} researchAvailable={Boolean(research?.enabled)} intakeEnabled={false} copy={copy} />
        </> : null}
        {!enabled ? <StaffAskBrowse topics={topics} initialTopicId={initial?.id} facet={sp.facet} scope={scope} /> : null}
        {all ? <details className={styles.details}>
          <summary>Your privacy and program view</summary>
          <div className={styles.detailsBody}>
            <ProgramContextNote />
            <ParticipationNotice surface="ask" />
          </div>
        </details> : null}
      </div>
    </EditableSurfaceRegion>
  );
}
