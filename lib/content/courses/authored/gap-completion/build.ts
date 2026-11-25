import type { CoursePack, Source } from '../../source-types';
import plan from '../gap-plan.json';

/** One lesson as authored in a gap-completion spec file. */
export type GapLesson = {
  title: string;
  objectives: string[];
  teaching: string;
  keyPoint: string;
  example: string;
  question: string;
  choices: [string, string, string];
  feedback: [string, string, string];
  recommended: 0 | 1 | 2;
  reflection: string;
  action: string;
  check: { question: string; correct: string; wrong: [string, string]; feedback: string };
  /** Optional picture of the people in the practice case, shown just before it. */
  image?: { src: string; alt: string; caption?: string };
};
export type GapSpec = {
  id: string;
  subtitle: string;
  audience: string;
  lessons: GapLesson[];
  cards: { front: string; back: string }[];
  aid: { heading: string; items: string[] }[];
  sources: Source[];
};

const OWNER = 'One DHS / One DSD — People, Access and Culture';
const html = (value: string) => value.trim().split(/\n\s*\n/).map(p => `<p>${p.trim().replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</p>`).join('');
const firstSentence = (p: string) => p.trim().match(/^.*?[.!?](?:\s|$)/)?.[0].trim() ?? p.trim();

/** Builds a gap-completion course pack in the program's full authored-course format. */
export function gapCourse(spec: GapSpec): CoursePack {
  const row = plan.find(entry => entry.id === spec.id);
  if (!row) throw new Error(`gap-completion course ${spec.id} is not in gap-plan.json`);
  const minutes = spec.lessons.length === 5 ? 11 : 12;
  const total = minutes * spec.lessons.length;
  const last = spec.lessons[spec.lessons.length - 1];
  return {
    course: {
      id: spec.id, indexNumber: row.indexNumber, title: row.title, seriesLabel: row.seriesLabel, subtitle: spec.subtitle,
      scope: `${spec.audience} Participation is voluntary and lessons can be opened in any order. Examples are practice. Keep reflection notes without identifying coworkers or members of the public. This course supports learning; formal employment, accommodation, civil-rights, eligibility and licensing decisions stay with the responsible office.`,
      treatment: `${spec.lessons.length} lessons with explanations, practice cases, practice decisions and feedback, knowledge checks, private reflection, flashcards, and a practical job aid.`,
      duration: `About ${total} minutes, plus optional practice`, author: OWNER,
      coverImage: row.coverImage, coverAlt: row.coverAlt, kind: 'course', contentType: row.contentType as CoursePack['course']['contentType'],
      learning: {
        objectives: spec.lessons.map(l => l.objectives[0]),
        evidence: ['Explain the distinction tested in each knowledge check.', 'Compare the responses to each practice case and the reasons behind them.', 'Complete the course job aid for a situation you choose.'],
        appliedNextStep: last.action,
      },
      governance: {
        contentOwner: OWNER, reviewers: [], evidenceDate: '2026-09-25',
        lastReviewed: 'Authoring and source checks, 2026-09-25; no independent check recorded',
        nextReview: '2027-03-25 or when evidence, law, or relevant guidance changes',
        updateTriggers: ['Updated research, law, or official guidance', 'Learner or community feedback about accuracy, accessibility, or a stereotyping example'],
        relatedDoor: 'Use the responsible agency office for formal policy, employment, accommodation, civil-rights, or eligibility decisions. This course supports learning rather than making those determinations.',
        toolkitQuestion: 'Who is affected by this decision, and what would I need to learn from them before it is final?',
        status: 'current',
      },
      lessons: spec.lessons.map((l, i) => {
        const slot = i % 3;
        const options = [l.check.wrong[0], l.check.wrong[1]].map(text => ({ text, correct: false }));
        options.splice(slot, 0, { text: l.check.correct, correct: true });
        const paragraphs = l.teaching.split(/\n\s*\n/).filter(p => p.trim());
        return {
          id: `${spec.id}-${i + 1}`, number: i + 1, title: l.title, summary: l.objectives[0], minutes,
          learning: { objective: l.objectives[0], objectives: l.objectives, takeaways: paragraphs.map(firstSentence), evidence: l.action, appliedNextStep: l.action },
          scenario: { context: l.example, prompt: l.question, options: l.choices.map((label, j) => ({ label, response: l.feedback[j], recommended: j === l.recommended })) },
          transfer: { prompt: l.reflection, options: ['Explore this privately using the practice case.', 'Apply the exercise to a situation I choose without identifying anyone.', 'Return to this practice later.'] },
          blocks: [
            { type: 'text' as const, heading: l.title, body: html(l.teaching) },
            { type: 'statement' as const, body: l.keyPoint },
            ...(i === 0 ? [{ type: 'flashcards' as const, heading: 'Concepts to carry forward', cards: spec.cards }] : []),
            ...(l.image ? [{ type: 'image' as const, src: l.image.src, alt: l.image.alt, ...(l.image.caption ? { caption: l.image.caption } : {}) }] : []),
            { type: 'text' as const, heading: 'A practice example to examine', body: html(l.example) },
            { type: 'text' as const, heading: 'Practice and review', body: html(l.action) },
            { type: 'text' as const, heading: 'Private reflection', body: html(l.reflection) },
            { type: 'knowledgeCheck' as const, id: `${spec.id}-${i + 1}-check`, question: l.check.question, options, feedbackCorrect: l.check.feedback, feedbackIncorrect: l.check.feedback },
          ],
        };
      }),
    },
    jobAid: {
      title: `${row.title}: practice guide`, subtitle: 'A reusable guide for a situation you choose',
      use: { purpose: spec.subtitle, remember: ['Use observable details rather than assigning motives.', 'Invite perspectives without requiring personal disclosure.', 'Keep learning separate from individual assessment or personnel decisions.'], doNext: last.action },
      sections: [...spec.aid, { heading: 'Try the guide and revisit it', items: [last.action, last.reflection] }],
    },
    sources: spec.sources,
  };
}
