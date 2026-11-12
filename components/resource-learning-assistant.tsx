"use client";

import { localStudyHref } from "@/lib/client/resource-study-links";
import { LearningAssistant, type StudyMode } from "./learning-assistant";
import { useProgramContext } from "./program-context";

const modes: { value: StudyMode; label: string; library: string; scoped: string }[] = [
  {
    value: "explain",
    label: "Explain an idea",
    library: "What do the program resources say about planning an accessible meeting? Give me a practical example.",
    scoped: "Explain a main idea in this resource and give me an example of using it at work.",
  },
  {
    value: "compare",
    label: "Compare approaches",
    library: "Compare how the program resources approach plain language and language access. How do they work together?",
    scoped: "Compare two ideas or approaches described in this resource. When would I use each one?",
  },
  {
    value: "practice",
    label: "Try a scenario",
    library: "Give me a fictional workplace scenario to practice improving access to a public service. Ask what I would do.",
    scoped: "Give me a fictional workplace scenario to practice an idea from this resource. Ask what I would do.",
  },
  {
    value: "reflect",
    label: "Reflect on a practice",
    library: "Help me reflect on how our team invites feedback. Give me one assumption to check and a way to test it.",
    scoped: "Give me a question I can use to reflect on my work and one way to try an idea from this resource.",
  },
];

export function ResourceLearningAssistant({ resourcePath, prompts }: {
  resourcePath?: string;
  prompts?: Partial<Record<StudyMode, string>>;
}) {
  const { context } = useProgramContext();
  return <LearningAssistant
    key={`${context}:${resourcePath ?? "library"}`}
    panelId="resource-learning-assistant"
    endpoint="/api/learn/resources"
    scope={{ resourcePath }}
    introduction={resourcePath
      ? prompts ? "Explore how the readings and toolkit inform the North Crossing case. Try a starting question or ask your own."
        : "Ask about the selected resource or try one of the starting questions."
      : "Ask across the program’s published resources or try one of the starting questions."}
    privacyNotice="Use fictional examples or remove identifying details. Your question and relevant passages are shared with an outside service to prepare the answer."
    workingMessage="Checking the readings…"
    modes={modes.map(({ value, label, library, scoped }) => ({ value, label, prompt: prompts?.[value] ?? (resourcePath ? scoped : library) }))}
    citationAllowed={localStudyHref}
    sourceLabel="Source"
    sourcesHeading="Sources cited"
  />;
}
