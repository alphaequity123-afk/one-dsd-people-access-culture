import { notFound, redirect } from "next/navigation";
import { currentLearningStage } from "@/lib/domains/learning";
import { learningStageHref } from "@/lib/content/learning-journey";

/** Preserve original stage bookmarks at their current learning destinations. */
export default async function LearningStageAlias({ params }: { params: Promise<{ stage: string }> }) {
  const stage = currentLearningStage((await params).stage);
  if (!stage) notFound();
  redirect(learningStageHref(stage.id));
}
