import "server-only";
import { createHash } from "node:crypto";
import { EQUITY_POLICY } from "@/lib/equity-analysis/policy";
import { EQUITY_FRAMEWORK } from "@/lib/program/equity-framework";
import { structuralReviewResource } from "@/lib/program/review-resources";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import type { Doc } from "./search";

/** Public, code-defined guidance only. User-entered worksheet answers are never read. */
export function publicPracticeDocs(scope: StaffProgramScope): Doc[] {
  const make = (id: string, title: string, href: string, summary: string, text: string, related: string[]): Doc => ({
    kind: "content", id, title, href, authority: "guidance", type: "public_practice", status: "approved", reviewDate: "",
    scope: scope === "dsd" ? "dsd" : "agencywide", summary, text, tags: ["equity", "practice", title], intents: [], graphRelated: related,
    evidenceRevisions: [{ sourceId: id, revisionId: null, payloadHash: createHash("sha256").update(text).digest("hex"), scope }],
  });
  const framework = [EQUITY_FRAMEWORK.title, EQUITY_FRAMEWORK.lede, EQUITY_FRAMEWORK.summary,
    ...EQUITY_FRAMEWORK.howToRead, EQUITY_FRAMEWORK.vision, EQUITY_FRAMEWORK.mission, EQUITY_FRAMEWORK.focus,
    ...EQUITY_FRAMEWORK.cycle.flatMap(stage => [stage.stage, stage.question, stage.programStep]),
    ...EQUITY_FRAMEWORK.pillars.flatMap(pillar => [pillar.title, pillar.purpose, ...pillar.objectives, ...pillar.initiatives, ...pillar.measures]),
  ].join("\n");
  const policy = [EQUITY_POLICY.title, EQUITY_POLICY.lede, ...EQUITY_POLICY.commitments.flatMap(item => [item.name, item.body]), ...EQUITY_POLICY.asks,
    `The official policy is available at ${EQUITY_POLICY.href}. Check the official policy and current requirements before relying on this program summary.`].join("\n");
  return [
    make("public-equity-framework", EQUITY_FRAMEWORK.title, "/equity-framework", EQUITY_FRAMEWORK.lede, framework, ["/program/model", "/learn/equity-toolkit", "/practice/measurement"]),
    make("public-equity-policy", EQUITY_POLICY.title, "/equity-policy", EQUITY_POLICY.lede, policy, ["/learn/equity-toolkit", "/equity-review/structural", "/practice/requirements"]),
    make("public-structural-equity-review", structuralReviewResource.title, structuralReviewResource.href, structuralReviewResource.summary,
      `${structuralReviewResource.summary} This public tool helps examine barriers in a process and connect evidence with a practical change. It does not make or approve a decision.`, ["/equity-review", "/learn/equity-toolkit", "/support/right-person"]),
    make("public-requirements-crosswalk", "Requirements and review evidence", "/practice/requirements", "Keep a requirement, the source behind it, the work it affects and the evidence together in one place.",
      "Begin with applicable law and binding requirements, then current approved agency policy and delegated procedures. Keep guidance, examples and proposed commitments clearly identified. If sources conflict or applicability is uncertain, record the question and seek the responsible review. Connect each requirement with its source, affected work, evidence, responsible role and next action.", ["/practice/gp-2", "/learn/equity-toolkit", "/practice/measurement", "/support/right-person"]),
  ];
}
