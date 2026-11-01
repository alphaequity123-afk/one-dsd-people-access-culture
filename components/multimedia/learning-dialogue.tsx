import { LearningAudio } from "@/components/learning-audio";
import sceneMedia from "@/lib/content/learning-scene-media.json";

function reviewedSceneSrc(file: string, text: string): string | null {
  const entry = (sceneMedia as Record<string, { src: string; turns: { text: string }[] }>)[file];
  return entry && entry.turns.map(turn => turn.text).join("\n") === text ? entry.src : null;
}

import { LEARNING_DIALOGUES, LEARNING_MOMENT_AUDIO } from "./learning-dialogue-data";
export { LEARNING_DIALOGUES, LEARNING_MOMENT_AUDIO } from "./learning-dialogue-data";

export function LearningDialogue({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const example = LEARNING_DIALOGUES.find(x => x.courseId === courseId && x.lessonId === lessonId);
  if (!example) return null;
  const id = `dialogue-${courseId}-${lessonId}`;
  return <section aria-labelledby={id} className="my-8 rounded-2xl border border-[#cbd8e2] bg-[#f3f7fa] p-5 sm:p-8">
    <p className="text-sm font-semibold uppercase tracking-wider text-[#425e75]">Practice conversation</p>
    <h2 id={id} className="mt-3 text-2xl font-bold text-[#123f60]">{example.title}</h2>
    <p className="mt-4 leading-7">{example.intro}</p>
    {LEARNING_MOMENT_AUDIO[courseId] ? <p className="mt-3 text-sm leading-6">You can listen or read along. The spoken text is available beside each recording.</p> : null}
    {example.audio?.map(clip => <figure key={clip.file} className="m-0 mt-5 rounded-xl bg-white p-5">
      <figcaption className="font-bold">{clip.label}</figcaption>
      {reviewedSceneSrc(clip.file, clip.transcript) ? <LearningAudio src={reviewedSceneSrc(clip.file, clip.transcript)!} title={clip.label} /> : null}
      <details className="mt-3"><summary className="cursor-pointer font-semibold">Read the complete transcript</summary><p className="mt-3 leading-7">{clip.transcript}</p></details>
    </figure>)}
    <ol className="mt-6 list-none space-y-5 p-0" aria-label="Conversation moments">
      {example.moments.map((moment, index) => <li key={moment.title} className="rounded-xl border border-[#cbd8e2] bg-white p-5">
        <h3 className="text-lg font-bold">{index + 1}. {moment.title}</h3>
        {LEARNING_MOMENT_AUDIO[courseId]?.[index] && reviewedSceneSrc(LEARNING_MOMENT_AUDIO[courseId][index], moment.dialogue) ? <LearningAudio src={reviewedSceneSrc(LEARNING_MOMENT_AUDIO[courseId][index], moment.dialogue)!} title={`Listen: ${moment.title}`} /> : null}
        <blockquote className="mx-0 my-4 border-l-4 border-[#567d98] pl-4 leading-7">{moment.dialogue}</blockquote>
        <p className="font-semibold">{moment.question}</p>
        <details className="mt-3"><summary className="cursor-pointer font-semibold text-[#123f60]">Consider the response</summary><p className="mt-3 leading-7">{moment.feedback}</p></details>
      </li>)}
    </ol>
    <p className="mt-5 leading-7">What might you say next in a similar conversation? Think it through privately, or jot down a line and what you hope it would help you understand.</p>
  </section>;
}
