import type { Metadata } from "next";
import { PolicyAnalyzer } from "@/components/policy-analysis/policy-analyzer";
import type { CatalogKind, CatalogPolicy, QuestionLabels } from "@/components/policy-analysis/labels";
import { PageIntro } from "@/components/ui";
import { getInstrument } from "@/lib/analysis/instruments";
import { analysisRoleFromCookies } from "@/lib/auth/consultant-or-team";
import { formatPolicyDate, getPolicies, getPolicyKind, getPolicyKinds } from "@/lib/content/hub/dsd-policies";
import { EQUITY_PRINCIPLES } from "@/lib/policy-analysis/principles";

export const metadata: Metadata = { title: "Equity Policy Analyzer" };
export const dynamic = "force-dynamic";

const CASE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CATALOG_ID = /^[a-z0-9][a-z0-9-]{0,119}$/;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** A slim copy of the catalog for the picker: the full catalog file is close to a megabyte. */
function slimCatalog(): CatalogPolicy[] {
  return getPolicies().map(policy => ({
    id: policy.id,
    title: policy.title,
    kind: policy.kind,
    kindLabel: getPolicyKind(policy.kind)?.title ?? "",
    summary: policy.summary,
    programs: policy.programs,
    tags: policy.tags,
    sourceTitle: policy.source.title,
    sourceUrl: policy.source.url,
    sourceDate: policy.source.date ? formatPolicyDate(policy.source.date) : "",
  }));
}

function questionLabels(): QuestionLabels {
  const labels: QuestionLabels = {};
  getInstrument("policy-review").stages.forEach((stage, stageOrder) => {
    for (const question of stage.questions) labels[question.id] = { prompt: question.prompt, stage: stage.title, stageOrder };
  });
  return labels;
}

export default async function PolicyAnalyzerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!(await analysisRoleFromCookies())) return null;
  const params = await searchParams;
  const caseId = one(params.case);
  const policyId = one(params.policy);
  const kinds: CatalogKind[] = getPolicyKinds().map(kind => ({ id: kind.id, title: kind.title }));
  return (
    <>
      <PageIntro
        kicker="Equity workspace"
        title="Equity Policy Analyzer"
        lede="Choose a policy, add its text and any supporting material, and analyze it with equity principles. Then shape the recommended changes, decide on each one, and formalize the approved changes as a document you can download."
        tone="business"
      />
      <div className="wrap py-8">
        <PolicyAnalyzer
          catalog={slimCatalog()}
          kinds={kinds}
          questions={questionLabels()}
          principleLabels={Object.fromEntries(EQUITY_PRINCIPLES.map(principle => [principle.id, principle.title]))}
          initialCaseId={caseId && CASE_ID.test(caseId) ? caseId : undefined}
          initialCatalogId={policyId && CATALOG_ID.test(policyId) ? policyId : undefined}
        />
      </div>
    </>
  );
}
