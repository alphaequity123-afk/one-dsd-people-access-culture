import Link from "@/components/app-link";
import { TRAINING_CREDIT_NOTICE } from "@/lib/program/learning-credit";
import { participationContract, type ParticipationSurface } from "@/lib/participation/contracts";
import { CONSULTATION_TOMBSTONE_RETENTION_DAYS } from "@/lib/privacy/consultation-terminal-retention";

const STAFF_NOTICES: Partial<Record<ParticipationSurface, string[]>> = {
  start_routing: ["Answer the questions to find a place to begin."],
  support_routing: ["Use general work information to find support."],
  ask: ["Ask takes a question in your own words. So that it can respond, your question and the recent conversation go to outside answer and research services, so keep names, case details and other confidential material out of what you type."],
  learning: ["Keep names, case details and other confidential information out of learning notes.", TRAINING_CREDIT_NOTICE],
  path_practice: ["The guided practices are for reading and downloading. Store completed downloads according to the requirements that apply to your work.", TRAINING_CREDIT_NOTICE],
  my_work: ["Keep names, case details and other confidential information out of saved notes and plans."],
  consultation_preview: ["Review the summary before you share it. Leave out client, medical, personnel, complaint, and other identifying details."],
  consultation_submission: ["Review the summary first, and leave out client, medical, personnel, complaint, and other identifying details. Only authorized consultants can see the request you submit; it is not sent to your supervisor.", "You receive a reference and private access key to follow up. Submission does not schedule a meeting. Only requests confirmed as DSD work enter the consultation queue. This is a program consultation request, not an official DHS record or evidence of required training."],
  consultation_tracking: ["Use your reference and private access key to check your request. Keep the access key private. You can correct general work information or withdraw the request when those options are available. Authorized consultants can see these changes.", "Deleting a saved reference does not withdraw or delete your request. Corrections and withdrawal do not change how long the request is kept."],
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
      <section className="text-sm text-muted" aria-label="Privacy" data-participation-class={contract.participationClass}>
        <p className="m-0">{surface === "ask" ? "Your question and recent conversation may be sent to outside services, so use general examples and leave out confidential details." : "Choose the learning or practice that fits your work. Formal responsibilities still apply."} <Link href="/about#participation-title">Read how privacy works across the program.</Link></p>
        <details className="mt-1"><summary className="cursor-pointer">More about this page</summary><div className="mt-2 space-y-2">{staffNotice.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></details>
      </section>
    );
    return (
      <section className="text-sm text-muted space-y-2" aria-label="Privacy" data-participation-class={contract.participationClass}>
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
