import type { UnitId } from "../unit";
import { DHS_EQUITY_POLICY_URL, policyEvidence, policyQuestion } from "./policy-evidence";
import { isDisabilityOutreach } from "./outreach";

export type AskNavigation = { title: string; href: string };
const divisionGuide = "/practice/disability/outreach";

export function policyNavigation(question: string, previous: string | undefined, unit: UnitId): AskNavigation[] {
  const context = policyQuestion(question, previous);
  if (!isDisabilityOutreach(context)) return [];
  const guide = unit === "dsd" ? divisionGuide : "https://dsd-web-production-3080eb48.up.railway.app" + divisionGuide;
  return [
    { title: "One DSD disability outreach guide", href: guide },
    { title: "DHS Equity Policy", href: policyEvidence(context)?.sourceUrl ?? DHS_EQUITY_POLICY_URL },
  ];
}
