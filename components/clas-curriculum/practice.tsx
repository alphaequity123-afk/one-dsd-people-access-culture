'use client';
import { useEffect, useRef, useState } from 'react';
import { checkOrdering, type Decision, type Ordering, type PracticeOption, type RecallQuestion } from '@/lib/content/clas-curriculum-practice';

type ChoiceProps = { id: string; question: string; scenario?: string; options: PracticeOption[] };

/**
 * One multiple-choice item: radio buttons, a check button, feedback for the chosen option and a
 * retry. Nothing is recorded; the choice lives only in component state.
 */
export function ChoiceQuestion({ id, question, scenario, options }: ChoiceProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [needsChoice, setNeedsChoice] = useState(false);
  const firstChoice = useRef<HTMLInputElement>(null);
  const chosen = checked && selected !== null ? options[selected] : null;
  return (
    <fieldset className="clas-question" aria-describedby={`${id}-feedback`}>
      <legend>{question}</legend>
      {scenario && <p className="clas-question-scenario">{scenario}</p>}
      {options.map((option, n) => (
        <label key={n}>
          <input ref={n === 0 ? firstChoice : undefined} type="radio" name={id} value={n} checked={selected === n} onChange={() => { setSelected(n); setChecked(false); setNeedsChoice(false); }} />
          <span>{option.text}</span>
        </label>
      ))}
      <div className="clas-question-actions">
        {!checked
          ? <button type="button" onClick={() => { if (selected === null) { setNeedsChoice(true); firstChoice.current?.focus(); } else setChecked(true); }}>Check my answer</button>
          : <button type="button" className="clas-study-secondary" onClick={() => { setChecked(false); setSelected(null); firstChoice.current?.focus(); }}>Try again</button>}
      </div>
      <div id={`${id}-feedback`} className="clas-study-feedback" aria-live="polite" aria-atomic="true">
        {needsChoice && !checked && <p>Choose one option, then check your answer.</p>}
        {chosen && <>
          <h3>{chosen.correct ? 'That is the stronger choice' : 'Not the strongest choice'}</h3>
          <p>{chosen.feedback}</p>
          <p>{chosen.correct ? 'You can choose another response to compare the reasoning.' : 'Try again and compare the reasoning for each option.'}</p>
        </>}
      </div>
    </fieldset>
  );
}

export function RecallSection({ questions, previousTitle, previousPart }: { questions: RecallQuestion[]; previousTitle: string; previousPart: number }) {
  if (!questions.length) return null;
  return (
    <section aria-labelledby="recall">
      <h2 id="recall">Before you watch: a quick recall from Part {previousPart}</h2>
      <p>Recall the main ideas from “{previousTitle}”, then compare your reasoning with the feedback. These practice responses are not saved or submitted by the exercise.</p>
      {questions.map(q => <ChoiceQuestion key={q.id} id={`recall-${q.id}`} question={q.question} options={q.options} />)}
    </section>
  );
}

export function DecisionList({ decisions }: { decisions: Decision[] }) {
  if (!decisions.length) return null;
  return (
    <div className="clas-decisions">
      <h3>More decisions to practice</h3>
      <p>Each scenario is fictional and about your next decision. Check an answer to read why it is stronger or weaker; you can try again as often as you like.</p>
      {decisions.map(d => <ChoiceQuestion key={d.id} id={`decision-${d.id}`} question={d.question} scenario={d.scenario} options={d.options} />)}
    </div>
  );
}

/**
 * The learner builds an order by choosing the next step from numbered buttons; nothing is dragged.
 * Checking compares each position with the suggested order and allows another attempt.
 */
export function OrderingQuestion({ ordering }: { ordering: Ordering }) {
  const [chosen, setChosen] = useState<number[]>([]);
  const [result, setResult] = useState<ReturnType<typeof checkOrdering> | null>(null);
  const remaining = ordering.steps.map((_, i) => i).filter(i => !chosen.includes(i));
  const complete = chosen.length === ordering.steps.length;
  const orderHeading = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);
  useEffect(() => { if (moveFocus.current) { orderHeading.current?.focus(); moveFocus.current = false; } }, [chosen, result]);
  function reset() { moveFocus.current = true; setChosen([]); setResult(null); }
  return (
    <fieldset className="clas-ordering">
      <legend>{ordering.prompt}</legend>
      {ordering.scenario && <p className="clas-question-scenario">{ordering.scenario}</p>}
      <p className="clas-ordering-help">Choose the step you would do first, then the next. Use the numbered buttons; nothing needs to be dragged. You can remove the last step or start over at any time.</p>
      <div className="clas-ordering-chosen">
        <h3 ref={orderHeading} tabIndex={-1}>Your order{chosen.length ? ` (${chosen.length} of ${ordering.steps.length})` : ''}</h3>
        {chosen.length
          ? <ol aria-live="polite">{chosen.map((step, position) => <li key={step}>{ordering.steps[step]}{result && <em className={result.matches[position] ? 'clas-order-match' : 'clas-order-miss'}> ({result.matches[position] ? 'in the suggested place' : 'not in the suggested place'})</em>}</li>)}</ol>
          : <p>No steps chosen yet.</p>}
      </div>
      {!complete && (
        <div className="clas-ordering-remaining">
          <h3>Choose step {chosen.length + 1}</h3>
          <ul>{remaining.map(i => <li key={i}><button type="button" className="clas-study-secondary" onClick={() => { moveFocus.current = true; setChosen([...chosen, i]); setResult(null); }}>Step {chosen.length + 1}: {ordering.steps[i]}</button></li>)}</ul>
        </div>
      )}
      <div className="clas-question-actions">
        {complete && !result && <button type="button" onClick={() => { moveFocus.current = true; setResult(checkOrdering(chosen, ordering.correctOrder)); }}>Check my order</button>}
        {chosen.length > 0 && !result && <button type="button" className="clas-study-secondary" onClick={() => { moveFocus.current = true; setChosen(chosen.slice(0, -1)); }}>Remove last step</button>}
        {chosen.length > 0 && <button type="button" className="clas-study-secondary" onClick={reset}>{result ? 'Try again' : 'Start over'}</button>}
      </div>
      <div className="clas-study-feedback" aria-live="polite">
        {result && <>
          <h3>{result.correct ? 'That matches the suggested order' : `Not yet: ${result.matches.filter(Boolean).length} of ${ordering.steps.length} steps are in the suggested place`}</h3>
          {ordering.feedback && <p>{ordering.feedback}</p>}
          {!result.correct && <p>Choose “Try again” to build the order once more.</p>}
        </>}
      </div>
    </fieldset>
  );
}
