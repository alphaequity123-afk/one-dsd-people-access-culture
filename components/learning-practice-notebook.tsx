import Link from "@/components/app-link";
import type { LearningStop } from "@/lib/content/learning-journey";

/** F-02: published practice prompts only. Staff do not type or save notes here. */
export function LearningPracticeNotebook({ stops }: {stops: Pick<LearningStop,"id"|"title"|"practice"|"reflection">[]; initialFocus?: string}) {
  return <section id="practice-notebook" className="scroll-mt-8 rounded-2xl border border-[#8ea2b5] bg-[#f4f7f9] p-5 sm:p-8" aria-labelledby="practice-notebook-title">
    <h2 id="practice-notebook-title" className="text-3xl font-semibold">Put one idea into practice</h2>
    <p className="notice mt-3 max-w-3xl leading-7" role="note">
      <strong>Read it here, then download it to use. </strong>
      This page does not save anything you write. Work through the prompts below, then download the related tools from the Library and keep your notes in your own file.
    </p>
    <ol className="mt-6 list-none space-y-6 p-0">
      {stops.map(stop => (
        <li key={stop.id} id={`practice-${stop.id}`} className="rounded-xl border border-line bg-white p-5">
          <h3 className="m-0 text-xl font-semibold">{stop.title}</h3>
          <p className="mt-3 leading-7">{stop.practice}</p>
          <p className="mt-3 font-medium">{stop.reflection}</p>
        </li>
      ))}
    </ol>
    <p className="mt-6 text-sm">
      <Link href="/library" className="font-semibold underline">Browse the Library</Link>
    </p>
  </section>;
}
