"use client";

import { LearningAssistant, type StudyMode } from "./learning-assistant";

const modes: { value: StudyMode; label: string; prompt: string; modulePrompt: string }[] = [
  {
    value: "explain",
    label: "Explain an idea",
    prompt: "What does the course mean by the water we swim in? Show me a workplace example.",
    modulePrompt: "Explain a main idea in this lesson and show how it could come up at work.",
  },
  {
    value: "compare",
    label: "Compare readings",
    prompt: "How do the essay and the American and Minnesota Culture briefs help explain differences in communication at work?",
    modulePrompt: "Compare what the essay and culture briefs tell us about this lesson's topic. Where do they emphasize different things?",
  },
  {
    value: "practice",
    label: "Try a scenario",
    prompt: "Give me a fictional workplace scenario where I can spot an assumption and improve how a service works. Ask me what I would do.",
    modulePrompt: "Give me a fictional workplace scenario to practice this lesson. Ask what I would do and let me think through the choice.",
  },
  {
    value: "reflect",
    label: "Reflect on a practice",
    prompt: "Help me examine an everyday team practice for barriers. Give me questions I can use to test one change.",
    modulePrompt: "What assumption could I look for in my work after this lesson, and how could I check it?",
  },
];

export function WaterLearningAssistant({ unit }: { unit?: string }) {
  return <LearningAssistant
    panelId="water-learning-assistant"
    endpoint="/api/learn/water-we-swim-in"
    scope={{ unit }}
    introduction="Explore The Water We Swim In and the American and Minnesota Culture briefs. Choose a starting question or ask your own."
    privacyNotice="Use fictional examples or remove identifying details. Your question and relevant passages are shared with an outside service to prepare the answer."
    workingMessage="Checking the readings…"
    modes={modes.map(({ value, label, prompt, modulePrompt }) => ({ value, label, prompt: unit ? modulePrompt : prompt }))}
    citationAllowed={href => /^\/(learn\/water-we-swim-in(?:[\/#]|$)|minnesota-communities\/(american|minnesota)(?:[\/#?]|$))/.test(href)}
  />;
}
