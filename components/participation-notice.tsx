import { participationContract, type ParticipationSurface } from "@/lib/participation/contracts";

const FACTS = [
  ["participation", "Participation"],
  ["privacy", "Privacy and recording"],
  ["purpose", "Purpose and requirements"],
  ["viewers", "Who can see it"],
  ["creates", "What this creates"],
  ["officialRecord", "Official record"],
  ["retention", "How long it stays"],
] as const;

// Only the owner and consultant areas carry this panel. Staff pages render nothing.
const ADMIN_HEADINGS: Partial<Record<ParticipationSurface, string>> = {
  consultant_sign_in: "How Consultant Workspace sign-in works",
  consultant_workspace: "How the Consultant Workspace works",
  one_dsd_team: "How the One DSD Team space works",
};

type ParticipationNoticeProps = {
  surface: ParticipationSurface;
};

export function ParticipationNotice({ surface }: ParticipationNoticeProps) {
  const heading = ADMIN_HEADINGS[surface];
  if (!heading) return null;

  const contract = participationContract(surface);
  const headingId = `participation-${contract.id}`;

  return (
    <section className="panel" aria-labelledby={headingId} data-participation-class={contract.participationClass}>
      <p className="kicker">Before you begin</p>
      <h2 id={headingId} className="text-xl font-extrabold">{heading}</h2>
      <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
        {FACTS.map(([field, label]) => (
          <div key={field}>
            <dt className="font-bold">{label}</dt>
            <dd className="m-0">{contract.disclosure[field]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
