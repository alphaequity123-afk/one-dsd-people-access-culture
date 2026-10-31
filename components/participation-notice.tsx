import Link from "next/link";
import { TRAINING_CREDIT_NOTICE } from "@/lib/program/learning-credit";
import { participationContract, type ParticipationSurface } from "@/lib/participation/contracts";
import { CONSULTATION_TOMBSTONE_RETENTION_DAYS } from "@/lib/privacy/consultation-terminal-retention";

const STAFF_NOTICES: Partial<Record<ParticipationSurface, string[]>> = {
  start_routing: ["These questions are optional and exist only to help you find a place to begin. Your choices stay on this page and clear when you leave it."],
  support_routing: ["Use general work information to find support. Your choices stay on this page; no one is contacted and no request is submitted."],
  ask: ["Ask takes a question in your own words. So that it can respond, your question and the recent conversation go to outside answer and research services, so please keep names, case details and other confidential material out of what you type. The conversation stays in this browser for this session only, and you can clear it at any time.", "If you used an earlier version that accepted questions, clearing data on this device does not remove any separate records already held by the program."],
  learning: ["Learn at your own pace; none of this is required. Notes and progress you save stay on this computer until you delete them, which also means anyone else who uses this computer could see them. Nothing is shared with supervisors or program staff.", TRAINING_CREDIT_NOTICE],
  path_practice: ["The guided practices are for reading and downloading; this page does not save your answers or progress. If you saved notes in an earlier version of the site, they may still be in this browser and visible to anyone using this computer; this page neither shows nor deletes them. Nothing you read or download here goes to your supervisor or counts toward any evaluation.", TRAINING_CREDIT_NOTICE],
  my_work: ["Your saved resources, practice plans, reflection and course bookmarks stay in this browser until you clear them, so anyone using this computer could see them. None of it is sent to your supervisor or to program staff.", "Earlier versions may have saved notes or consultation references on this device. Removing a local reference does not withdraw or delete a request submitted through an earlier version, or erase any separate records already held by the program."],
  consultation_preview: ["Reviewing a summary is optional. It does not save or send a consultation request or arrange a meeting. Your form and summary disappear when you leave this page. Information carried over from Ask stays on this computer until you clear it or close the tab, and the program owner’s copy of your Ask questions stays."],
  consultation_submission: ["Submitting is optional. Review the summary first, and leave out client, medical, personnel, complaint, and other identifying details. Only authorized consultants can see the request you submit; it is not sent to your supervisor.", "You receive a reference and private access key to follow up. Submission does not schedule a meeting. Only requests confirmed as DSD work enter the consultation queue. This is a program consultation request, not an official DHS record or evidence of required training."],
  consultation_tracking: ["Use your reference and private access key to check your request. Keep the access key private. You can correct general work information or withdraw the request when those options are available. Authorized consultants can see these changes.", "Saving a reference on this device is optional. Anyone using this computer may see it. Deleting that saved reference does not withdraw or delete your request. Corrections and withdrawal do not change how long the request is kept."],
};

const FACTS = [
  ["participation", "Participation"],
  ["privacy", "Privacy and recording"],
  ["purpose", "Purpose and requirements"],
  ["viewers", "Who can see it"],
  ["creates", "What this creates"],
  ["officialRecord", "Official record"],
  ["retention", "How long it stays"],
] as const;

const SURFACE_HEADINGS: Partial<Record<ParticipationSurface, string>> = {
  consultant_sign_in: "How Consultant Workspace sign-in works",
  consultant_workspace: "How the Consultant Workspace works",
  one_dsd_team: "How the One DSD Team space works",
};

type ParticipationNoticeProps = {
  surface: ParticipationSurface;
  consultationRetentionDays?: number;
  consultationRetentionCalendarYears?: number;
  correctionEnabled?: boolean;
};

function displayedFact(
  field: (typeof FACTS)[number][0],
  value: string,
  props: ParticipationNoticeProps,
): string {
  if (
    field === "retention"
    && (props.surface === "consultation_submission" || props.surface === "consultation_tracking")
    && (props.consultationRetentionDays || props.consultationRetentionCalendarYears)
  ) {
    return `${value} The approved consultation period is ${props.consultationRetentionCalendarYears ? `${props.consultationRetentionCalendarYears} calendar years` : `${props.consultationRetentionDays} calendar days`} from submission.`;
  }
  if (
    field === "creates"
    && props.surface === "consultation_tracking"
    && props.correctionEnabled === false
  ) {
    return `${value} Corrections are temporarily unavailable; checking status and any permitted withdrawal remain available.`;
  }
  return value;
}

export function ParticipationNotice(props: ParticipationNoticeProps) {
  const { surface } = props;
  const contract = participationContract(surface);
  const headingId = `participation-${contract.id}`;
  const staffNotice = STAFF_NOTICES[surface];

  if (staffNotice) {
    const consultation = surface === "consultation_submission" || surface === "consultation_tracking";
    // One short line per page; the page's own detail sits one click away. Consultation pages keep their retention terms in view.
    if (!consultation) return (
      <section className="text-sm text-muted" aria-label="Your privacy and participation" data-participation-class={contract.participationClass}>
        <p className="m-0">Taking part here is voluntary, and anything you save stays on this computer, under your control. <Link href="/about#participation-title">Read how participation and privacy work.</Link></p>
        <details className="mt-1"><summary className="cursor-pointer">More about this page</summary><div className="mt-2 space-y-2">{staffNotice.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></details>
      </section>
    );
    return (
      <section className="text-sm text-muted space-y-2" aria-label="Your privacy and participation" data-participation-class={contract.participationClass}>
        {staffNotice.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        {consultation && (props.consultationRetentionDays || props.consultationRetentionCalendarYears) && (
          <p>Your submitted details are retained for {props.consultationRetentionCalendarYears ? `${props.consultationRetentionCalendarYears} calendar years` : `${props.consultationRetentionDays} calendar days`} from submission, even if you withdraw the request. After that, only an expired status remains for {CONSULTATION_TOMBSTONE_RETENTION_DAYS} more days before it is deleted.</p>
        )}
        {surface === "consultation_tracking" && props.correctionEnabled === false && (
          <p>Corrections are temporarily unavailable. You can still check status and withdraw when that option is available.</p>
        )}
      </section>
    );
  }

  return (
    <section className="panel" aria-labelledby={headingId} data-participation-class={contract.participationClass}>
      <p className="kicker">Before you begin</p>
      <h2 id={headingId} className="text-xl font-extrabold">
        {SURFACE_HEADINGS[surface] ?? "How this works"}
      </h2>
      <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
        {FACTS.map(([field, label]) => (
          <div key={field}>
            <dt className="font-bold">{label}</dt>
            <dd className="m-0">{displayedFact(field, contract.disclosure[field], props)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
