import type { Metadata } from "next";
import Link from "@/components/app-link";
import register from "@/config/contributor-access.json";
import { PageIntro } from "@/components/ui";
import { ownerPageGuard } from "@/lib/auth/owner-page";
import {
  protectedActivationBundleSha256,
  protectedFeatureActivation,
  type ProtectedFeature,
} from "@/lib/auth/protected-feature-activation";
import { PROGRAM, ROUTES } from "@/lib/constants";
import { consultationActivationEvidence, CONSULTATION_EVIDENCE_REQUIREMENTS } from "@/lib/intelligence/consult/activation-evidence";
import {
  consultationActivationStatus,
  consultationTrackingActivationStatus,
  type ConsultationActivationRequirement,
} from "@/lib/intelligence/consult/availability";
import { getStore } from "@/lib/intelligence/memory/store";

export const metadata: Metadata = { title: "Activation status" };
export const dynamic = "force-dynamic";

type RowState = "Met" | "Missing" | "Not checked yet";

/** Every consultation requirement key, what satisfies it, and where it is set. Values of secrets are never read into this page. */
const CONSULTATION_REQUIREMENTS: ReadonlyArray<{ key: ConsultationActivationRequirement; label: string; how: string; intakeOnly?: boolean }> = [
  { key: "feature_switch", label: "Accept new requests", how: "Set PAC_CONSULTATION_INTAKE_ENABLED=on.", intakeOnly: true },
  { key: "durable_store", label: "Saved work is kept", how: "Set PAC_STORE=postgres." },
  { key: "runtime_database", label: "Database connection", how: "Set PAC_RUNTIME_DATABASE_URL (restricted database role)." },
  { key: "tracking_secret", label: "Private access to request status", how: "Set PAC_CONSULTATION_TRACKING_SECRET to a value of at least 32 bytes." },
  { key: "rate_limit_secret", label: "Protection against repeated requests", how: "Set PAC_RATE_LIMIT_SECRET to a value of at least 32 bytes." },
  { key: "activation_evidence", label: "Required checks completed", how: "In config/protected-feature-activation.json set approval_state to approved with every requirement verified, then set PAC_CONSULTATION_ACTIVATION_EVIDENCE_ID to that file's evidence_id." },
  { key: "approved_policy", label: "Agreed rules in place", how: "Mark approved_policy verified and set policy_version in config/protected-feature-activation.json, then set PAC_CONSULTATION_POLICY_VERSION to the same value." },
  { key: "approved_retention", label: "Approved retention period", how: "Set either retention_calendar_years with PAC_CONSULTATION_RETENTION_CALENDAR_YEARS, or retention_days with PAC_CONSULTATION_RETENTION_DAYS. The evidence and setting must match." },
  { key: "deletion_process", label: "Deletion process", how: "Mark deletion_process verified in the register and set PAC_CONSULTATION_DELETION_READY=on." },
  { key: "correction_process", label: "Correction process", how: "Mark correction_process verified in the register and set PAC_CONSULTATION_CORRECTION_READY=on (tracking needs the register entry; corrections also need the switch)." },
  { key: "backup_process", label: "Backup process", how: "Mark backup_process verified in the register and set PAC_CONSULTATION_BACKUP_READY=on." },
  { key: "restore_process", label: "Restore process", how: "Mark restore_process verified in the register and set PAC_CONSULTATION_RESTORE_READY=on." },
  { key: "recovery_process", label: "Recovery process", how: "Mark recovery_process verified in the register and set PAC_CONSULTATION_RECOVERY_READY=on." },
  { key: "incident_process", label: "Incident process", how: "Mark incident_process verified in the register and set PAC_CONSULTATION_INCIDENT_READY=on." },
  { key: "delivery_process", label: "Delivery process", how: "Mark delivery_process verified in the register and set PAC_CONSULTATION_DELIVERY_READY=on (tracking needs the register entry only)." },
];

/** Checks in the exact order lib/auth/protected-feature-activation.ts applies them; it stops at the first failure. */
function protectedChecks(feature: ProtectedFeature): ReadonlyArray<{ reason: string; label: string; how: string }> {
  const prefix = feature === "protected_identity" ? "PAC_PROTECTED_IDENTITY" : "PAC_PROTECTED_CONTRIBUTION";
  const contract = register.features[feature];
  let expectedSha = "(cannot be computed: config/contributor-access.json does not match the contract)";
  try {
    expectedSha = protectedActivationBundleSha256(register, feature);
  } catch {
    // Reported through the invalid_contract row below.
  }
  return [
    { reason: "invalid_contract", label: "Access rules recorded", how: "config/contributor-access.json must match the contract schema (policy_version contributor-access-v1)." },
    { reason: "not_enabled", label: "Feature turned on", how: `Set ${prefix}_ENABLED=on.` },
    ...(feature === "protected_contribution"
      ? [{ reason: "writes_paused", label: "Saving is available", how: "Leave PAC_CONTRIBUTOR_WRITES_PAUSED unset, or set it to off." }]
      : []),
    { reason: "separate_connections_required", label: "Sign-in and contribution records kept separately", how: "Set PAC_CONTRIBUTOR_DATABASE_URL (role pac_dsd_contributor_runtime) and PAC_PROGRAM_AUTH_DATABASE_URL (role pac_dsd_authentication_broker) to different connections." },
    { reason: "invalid_environment_or_transport", label: "Secure connection", how: "PAC_DATA_ENV must be local, preview, or production and match VERCEL_ENV; PAC_CONTRIBUTOR_DATABASE_SSL and PAC_PROGRAM_AUTH_DATABASE_SSL must be accepted for that environment." },
    { reason: "binding_mismatch", label: "Settings match the completed checks", how: `Set ${prefix}_ACTIVATION_EVIDENCE_ID=${contract.evidence_id} and ${prefix}_ACTIVATION_BUNDLE_SHA256=${expectedSha}.` },
    ...(feature === "protected_contribution"
      ? [{ reason: "identity_not_active", label: "Contributor sign-in ready", how: "Contributor identity (above) must be ready first." }]
      : []),
  ];
}

function protectedRows(feature: ProtectedFeature): { ready: boolean; reason: string; rows: Array<{ label: string; how: string; state: RowState }> } {
  const activation = protectedFeatureActivation(feature);
  const checks = protectedChecks(feature);
  const blockingIndex = activation.active ? checks.length : checks.findIndex((check) => check.reason === activation.reason);
  return {
    ready: activation.active,
    reason: activation.reason,
    rows: checks.map((check, index) => ({
      label: check.label,
      how: check.how,
      state: activation.active || index < blockingIndex ? "Met" : index === blockingIndex ? "Missing" : "Not checked yet",
    })),
  };
}

function secretLongEnough(name: string): boolean {
  const value = process.env[name]?.trim();
  return Boolean(value && Buffer.byteLength(value, "utf8") >= 32);
}

function outcomeRows(): { ready: boolean; rows: Array<{ label: string; how: string; state: RowState }> } {
  const switchOn = process.env.PAC_PROGRAM_OUTCOME_COLLECTION_ENABLED?.trim().toLowerCase() === "on";
  let backend = "unavailable";
  try {
    backend = getStore().backend;
  } catch {
    // Reported below as saved work not being kept.
  }
  const durable = backend === "postgres";
  const limiter = secretLongEnough("PAC_RATE_LIMIT_SECRET");
  const rows = [
    { label: "Accept shared results", how: "Set PAC_PROGRAM_OUTCOME_COLLECTION_ENABLED=on.", state: switchOn ? "Met" : "Missing" as RowState },
    { label: "Saved work is kept", how: `Set PAC_STORE=postgres and PAC_RUNTIME_DATABASE_URL (work is currently saved in: ${backend}).`, state: durable ? "Met" : "Missing" as RowState },
    { label: "Protection against repeated requests", how: "Set PAC_RATE_LIMIT_SECRET to a value of at least 32 bytes.", state: limiter ? "Met" : "Missing" as RowState },
  ];
  return { ready: rows.every((row) => row.state === "Met"), rows };
}

function StatusLine({ ready, missingCount }: { ready: boolean; missingCount: number }) {
  return (
    <p className="m-0 text-sm">
      <strong>{ready ? "Ready" : "Not ready"}.</strong>{" "}
      {ready ? "Every requirement is met." : `${missingCount} requirement${missingCount === 1 ? "" : "s"} missing.`}
    </p>
  );
}

function RequirementTable({ caption, rows }: { caption: string; rows: Array<{ key?: string; label: string; how: string; state: RowState }> }) {
  return (
    <div className="overflow-x-auto">
      <table className="data mt-2">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Requirement</th>
            <th scope="col">Status</th>
            <th scope="col">Setup help</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key ?? row.label}>
              <td>{row.label}</td>
              <td>{row.state}</td>
              <td><details><summary>Show setup details</summary><p>{row.how}</p></details></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ActivationStatusPage() {
  if (!(await ownerPageGuard())) return null;
  const intake = consultationActivationStatus();
  const tracking = consultationTrackingActivationStatus();
  const evidence = consultationActivationEvidence();
  const identity = protectedRows("protected_identity");
  const contribution = protectedRows("protected_contribution");
  const outcomes = outcomeRows();
  const consultationRows = (missing: ConsultationActivationRequirement[], includeIntakeOnly: boolean) =>
    CONSULTATION_REQUIREMENTS
      .filter((requirement) => includeIntakeOnly || !requirement.intakeOnly)
      .map((requirement) => ({
        key: requirement.key,
        label: requirement.label,
        how: requirement.how,
        state: (missing.includes(requirement.key) ? "Missing" : "Met") as RowState,
      }));

  return (
    <>
      <PageIntro
        kicker={PROGRAM.practiceOwnerRole}
        title="Activation status"
        lede="This page shows the consultant which features are ready and what still needs attention. Checking this page does not change any settings. Setup details are available when needed; private access keys are never shown."
      />
      <div className="wrap space-y-10 py-8">
        <section aria-labelledby="consultation-intake-heading">
          <h2 id="consultation-intake-heading" className="text-xl font-extrabold">Consultation intake</h2>
          <p className="text-sm text-muted">Check whether staff can <Link href={ROUTES.requestConsult.href}>request a One DSD consultation</Link>.</p>
          <StatusLine ready={intake.ready} missingCount={intake.missing.length} />
          <RequirementTable caption="Consultation intake requirements" rows={consultationRows(intake.missing, true)} />
        </section>

        <section aria-labelledby="consultation-tracking-heading">
          <h2 id="consultation-tracking-heading" className="text-xl font-extrabold">Consultation tracking</h2>
          <p className="text-sm text-muted">Staff can <Link href={ROUTES.trackRequest.href}>check an existing request</Link> even when new requests are paused, provided the checks below are met.</p>
          <StatusLine ready={tracking.ready} missingCount={tracking.missing.length} />
          <RequirementTable caption="Consultation tracking requirements" rows={consultationRows(tracking.missing, false)} />
        </section>

        <details>
          <summary className="text-xl font-extrabold">Consultation setup record</summary>
          <p className="text-sm text-muted">Read from config/protected-feature-activation.json. Hosting settings cannot approve a pending entry; a release with dated evidence has to replace it.</p>
          <dl className="grid gap-x-6 gap-y-2 text-sm md:grid-cols-2">
            <dt className="font-bold">Approval state</dt><dd className="m-0">{evidence.approvalState}</dd>
            <dt className="font-bold">Evidence ID</dt><dd className="m-0">{evidence.evidenceId ?? "not set"}</dd>
            <dt className="font-bold">Policy version</dt><dd className="m-0">{evidence.policyVersion ?? "not set"}{intake.policyVersion ? ` (PAC_CONSULTATION_POLICY_VERSION is ${intake.policyVersion})` : " (PAC_CONSULTATION_POLICY_VERSION is not set)"}</dd>
            <dt className="font-bold">Retention period</dt><dd className="m-0">{evidence.retentionCalendarYears ? `${evidence.retentionCalendarYears} calendar years` : evidence.retentionDays ?? "not set"}{intake.retentionCalendarYears ? ` (${intake.retentionCalendarYears} calendar years configured)` : intake.retentionDays ? ` (PAC_CONSULTATION_RETENTION_DAYS is ${intake.retentionDays})` : " (PAC_CONSULTATION_RETENTION_DAYS is not set)"}</dd>
          </dl>
          <ul className="mt-3 list-disc pl-6 text-sm">
            {CONSULTATION_EVIDENCE_REQUIREMENTS.map((requirement) => (
              <li key={requirement}>{requirement}: {evidence.missing.includes(requirement) ? "pending or unverified" : "verified"}</li>
            ))}
          </ul>
        </details>

        <section aria-labelledby="outcome-sharing-heading">
          <h2 id="outcome-sharing-heading" className="text-xl font-extrabold">Outcome sharing (Share a result)</h2>
          <p className="text-sm text-muted">Check whether staff can <Link href="/support/share-result">share a result from their work</Link>.</p>
          <StatusLine ready={outcomes.ready} missingCount={outcomes.rows.filter((row) => row.state !== "Met").length} />
          <RequirementTable caption="Outcome sharing requirements" rows={outcomes.rows} />
        </section>

        <section aria-labelledby="contributor-identity-heading">
          <h2 id="contributor-identity-heading" className="text-xl font-extrabold">Contributor sign-in</h2>
          <p className="text-sm text-muted">Checks run in order; any remaining checks wait until the first issue is resolved.</p>
          <StatusLine ready={identity.ready} missingCount={identity.rows.filter((row) => row.state !== "Met").length} />
          <RequirementTable caption="Contributor identity requirements" rows={identity.rows} />
        </section>

        <section aria-labelledby="contributor-contribution-heading">
          <h2 id="contributor-contribution-heading" className="text-xl font-extrabold">Resource contributions</h2>
          <p className="text-sm text-muted">Check whether contributors can save and edit resources. Checks run in order; any remaining checks wait until the first issue is resolved.</p>
          <StatusLine ready={contribution.ready} missingCount={contribution.rows.filter((row) => row.state !== "Met").length} />
          <RequirementTable caption="Contributor contribution requirements" rows={contribution.rows} />
        </section>
      </div>
    </>
  );
}

