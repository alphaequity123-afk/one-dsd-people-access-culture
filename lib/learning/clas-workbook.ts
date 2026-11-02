import curriculum from '@/lib/content/clas-curriculum.json';

/** The companion working-notes download offered on the front page and every lesson. */
export function workbookText(): string {
  const standardIndex = curriculum.standards.map(s => {
    const part = curriculum.modules.find(m => m.id === s.lesson);
    return `Standard ${s.number}: ${s.focus}\n  Start with Part ${Number(s.lesson)}${part ? `: ${part.title}` : ''}`;
  }).join('\n');
  const reflections = curriculum.modules.map(m => `Part ${Number(m.id)}: ${m.title}\n${m.practice.reflection}\n\nMy notes:\n\n\n`).join('\n');
  return `${curriculum.title}\n\nUse a non-sensitive example. Keep official records in approved systems. These notes are for your own use. You can pause and return whenever you choose.\n\nMY WORKING PLAN\n\nWork example and the experience I want to improve:\n\nRelevant CLAS standard or standards:\n\nChange I propose and why:\n\nWhat I can do within my role; what needs coordination or approval:\n\nHow I will listen to and involve people affected:\n\nLanguage assistance, accessibility or other communication needs to consider:\n\nEvidence I will use to understand the issue and check progress:\n\nHow a person can raise a concern and what happens next:\n\nA follow-up date and the next step:\n\n\nWHERE THE STANDARDS FIT\nUse this index to find a starting lesson. Read the original standards for their complete wording.\n\n${standardIndex}\n\n\nREFLECTIONS BY LESSON\n\n${reflections}\nVoluntary follow-up date:\nWhat changed?\nWhat evidence do I have?\nWhat remains?\n`;
}
