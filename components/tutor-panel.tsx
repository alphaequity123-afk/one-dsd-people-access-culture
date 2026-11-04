'use client';
import { useState } from 'react';
import { scoreChoice, tutorItems, type ScoredChoice, type TutorItem } from '@/lib/tutor/items';
import { chooseStrategy, recordAttempt, recordRound, useStudentModel, type Strategy } from '@/lib/tutor/student-model';

/**
 * Guided practice for one lesson: the question and options come from the
 * content engine (lib/tutor/items.ts), the answer is scored on the device by
 * the same deterministic rule the server uses, and guidance is fetched from
 * /api/tutor only when the learner asks for it. The learner record stays in
 * this browser; the server counts totals only.
 */

/** Every static string a learner can see. Tests check reading level and banned words against this table. */
export const GUIDANCE_COPY = {
  heading: 'Guidance for this question',
  before: 'Answer the question first. Then you can get guidance on your thinking.',
  check: 'Check my answer',
  needsChoice: 'Choose one option, then check your answer.',
  strongerChoice: 'That is the stronger choice',
  notStrongest: 'Not the strongest choice',
  getGuidance: 'Get guidance',
  loading: 'Getting guidance…',
  unavailable: 'Guidance is not available right now. The lesson feedback above still applies.',
  tryAgain: 'Try again',
  nextQuestion: 'Next question',
  finished: 'You have finished the guided practice for this part.',
  followUpLabel: 'Ask the guide a question',
  followUpHint: 'You can ask one question about this guidance.',
  send: 'Send question',
  followUpDone: 'Thanks. That was your one question for this round.',
  readMore: 'Read more in the lesson',
  notice: 'The guide sees the question and what you chose. Your progress stays on this device. Nothing is kept about who you are.',
  strategy: {
    'socratic-hint': 'A question to think about',
    nudge: 'A short pointer',
    'worked-example': 'A worked example from a similar situation',
    stop: 'A quick check and one next idea',
  } satisfies Record<Strategy, string>,
} as const;

export type GuidanceReply = {
  tutor: string | null;
  parts: { restatement: string; guidance: string; nextStep: string } | null;
  strategy: Strategy;
  grounding: { title: string; href: string }[];
};

type Props = {
  lessonId: string;
  /** Overrides the lesson's items (tests and previews); the default comes from the curriculum content. */
  items?: TutorItem[];
};

async function requestGuidance(body: Record<string, unknown>): Promise<GuidanceReply | null> {
  try {
    const response = await fetch('/api/tutor', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), credentials: 'omit' });
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<GuidanceReply>;
    return { tutor: typeof data.tutor === 'string' ? data.tutor : null, parts: data.parts ?? null, strategy: data.strategy ?? 'stop', grounding: Array.isArray(data.grounding) ? data.grounding : [] };
  } catch {
    return null;
  }
}

function ReplyView({ reply }: { reply: GuidanceReply }) {
  if (!reply.tutor) return <p>{GUIDANCE_COPY.unavailable}</p>;
  const parts = reply.parts ?? { restatement: reply.tutor, guidance: '', nextStep: '' };
  return <div className="clas-guidance-reply">
    <p className="clas-guidance-kind">{GUIDANCE_COPY.strategy[reply.strategy]}</p>
    <p>{parts.restatement}</p>
    {parts.guidance && <p>{parts.guidance}</p>}
    {parts.nextStep && <p><strong>{parts.nextStep}</strong></p>}
  </div>;
}

export default function TutorPanel({ lessonId, items }: Props) {
  const list = items ?? tutorItems(lessonId);
  const [record, update] = useStudentModel(lessonId);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [needsChoice, setNeedsChoice] = useState(false);
  const [scored, setScored] = useState<ScoredChoice | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [reply, setReply] = useState<GuidanceReply | null>(null);
  const [followUp, setFollowUp] = useState('');
  const [followUpReply, setFollowUpReply] = useState<GuidanceReply | null>(null);
  const [busy, setBusy] = useState(false);
  const item = list[index];
  if (!item) return null;
  const hasMore = index < list.length - 1;

  function resetQuestion() { setSelected(null); setNeedsChoice(false); setScored(null); setStrategy(null); setReply(null); setFollowUp(''); setFollowUpReply(null); }

  function check() {
    if (selected === null) { setNeedsChoice(true); return; }
    const result = scoreChoice(item, selected);
    const next = recordAttempt(record, item.itemId, result.correct);
    update(next.record);
    setScored(result);
    setAttemptNumber(next.attemptNumber);
    setStrategy(chooseStrategy(next.record, item, next.attemptNumber));
    setReply(null); setFollowUp(''); setFollowUpReply(null);
  }

  async function getGuidance() {
    if (selected === null || !strategy || busy) return;
    setBusy(true);
    const result = await requestGuidance({ lessonId: item.lessonId, itemId: item.itemId, chosenIndex: selected, attemptNumber, strategy });
    update(recordRound(record, item.itemId, strategy));
    setReply(result ?? { tutor: null, parts: null, strategy, grounding: [] });
    setBusy(false);
  }

  async function sendFollowUp() {
    const message = followUp.trim();
    if (selected === null || !strategy || busy || !message) return;
    setBusy(true);
    const result = await requestGuidance({ lessonId: item.lessonId, itemId: item.itemId, chosenIndex: selected, attemptNumber, strategy, learnerMessage: message.slice(0, 500) });
    setFollowUpReply(result ?? { tutor: null, parts: null, strategy, grounding: [] });
    setBusy(false);
  }

  function nextQuestion() { setIndex(index + 1); resetQuestion(); }

  const group = `guided-${item.lessonId}-${item.itemId}`;
  return <div className="clas-guidance">
    <fieldset className="clas-question">
      <legend>{item.question}</legend>
      {item.options.map((option, n) => <label key={n}>
        <input type="radio" name={group} value={n} checked={selected === n} disabled={scored !== null} onChange={() => { setSelected(n); setNeedsChoice(false); }} />
        <span>{option.text}</span>
      </label>)}
      <div className="clas-question-actions">
        {scored === null && <button type="button" onClick={check}>{GUIDANCE_COPY.check}</button>}
        {scored && !scored.correct && <button type="button" className="clas-study-secondary" onClick={resetQuestion}>{GUIDANCE_COPY.tryAgain}</button>}
        {scored?.correct && hasMore && <button type="button" onClick={nextQuestion}>{GUIDANCE_COPY.nextQuestion}</button>}
      </div>
      <div className="clas-study-feedback" aria-live="polite">
        {needsChoice && scored === null && <p>{GUIDANCE_COPY.needsChoice}</p>}
        {scored && <>
          <h3>{scored.correct ? GUIDANCE_COPY.strongerChoice : GUIDANCE_COPY.notStrongest}</h3>
          <p>{scored.feedback}</p>
          {scored.correct && !hasMore && <p>{GUIDANCE_COPY.finished}</p>}
        </>}
      </div>
    </fieldset>
    <section className="clas-guidance-area" aria-labelledby={`${group}-guidance`}>
      <h3 id={`${group}-guidance`}>{GUIDANCE_COPY.heading}</h3>
      {scored === null && <p>{GUIDANCE_COPY.before}</p>}
      {scored && !reply && <p><button type="button" onClick={getGuidance} disabled={busy}>{busy ? GUIDANCE_COPY.loading : GUIDANCE_COPY.getGuidance}</button></p>}
      <div aria-live="polite">
        {reply && <ReplyView reply={reply} />}
        {reply?.tutor && followUpReply === null && <div className="clas-guidance-followup">
          <label htmlFor={`${group}-followup`}>{GUIDANCE_COPY.followUpLabel}</label>
          <p className="clas-guidance-hint">{GUIDANCE_COPY.followUpHint}</p>
          <textarea id={`${group}-followup`} rows={3} maxLength={500} value={followUp} onChange={event => setFollowUp(event.target.value)} />
          <button type="button" onClick={sendFollowUp} disabled={busy || !followUp.trim()}>{busy ? GUIDANCE_COPY.loading : GUIDANCE_COPY.send}</button>
        </div>}
        {followUpReply && <>
          <ReplyView reply={followUpReply} />
          <p className="clas-guidance-hint">{GUIDANCE_COPY.followUpDone}</p>
        </>}
        {reply && reply.grounding.length > 0 && <div className="clas-guidance-links">
          <p>{GUIDANCE_COPY.readMore}</p>
          <ul>{reply.grounding.map(link => <li key={link.href}><a href={link.href}>{link.title}</a></li>)}</ul>
        </div>}
      </div>
      <p className="clas-guidance-notice">{GUIDANCE_COPY.notice}</p>
    </section>
  </div>;
}
