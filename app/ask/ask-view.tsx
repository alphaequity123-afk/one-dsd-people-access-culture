import { AskClient } from "@/components/ask-client";
import Link from "@/components/app-link";
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

/** The Ask wording and availability, shared by the Ask page and the Ask panel on the landing page. */
export async function prepareAsk() {
  const surface = await prepareEditableSurface("ask.page");
  const enabled = cloneAgentsEnabled();
  const research = enabled ? await getResearchPolicy() : null;
  const copy = enabled ? {
    ...surface.values,
    introKicker: "",
    introTitle: "Ask",
    introLede: "Ask about your work or find a program resource.",
    answerButton: "Ask",
    questionLabel: "Your question",
    questionHelp: "Use your own words.",
    questionExample: "Type your question",
    privacyNotice: "Your question and recent messages are shared with outside services to prepare the answer. Your browser keeps the conversation for this session. Site records are designed to track use without storing the conversation.",
  } : surface.values;
  return { surface, enabled, research, copy };
}

export async function AskView({ searchParams, part }: { searchParams: AskSearchParams; part: "surface" | "all" }) {
  const sp = searchParams;
  const scope = await requestedContentScope();
  const { surface, enabled, research, copy } = await prepareAsk();
  const topics = staffAskTopics();
  const initial = matchStaffAskTopic(sp.topic) ?? matchStaffAskTopic(sp.path) ?? matchStaffAskTopic(sp.q);
  const all = part === "all";
  return (
    <EditableSurfaceRegion surface={surface} className={styles.page}>
      <PageIntro kicker={stringValue(copy, "introKicker")} title={all && !enabled ? "All common questions" : stringValue(copy, "introTitle")} lede={stringValue(copy, "introLede")}>
        {process.env.GEMINI_API_KEY?.trim() ? <p className="mt-4"><Link href="/ask/study" className="font-semibold underline underline-offset-4">Study the readings</Link></p> : null}
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
