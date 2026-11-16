/**
 * Staff pages carry guidance for the work, not statements about the system.
 * Owner-editable copy can still hold older sentences about what is saved, sent,
 * recorded or voluntary; this keeps the guidance and drops those sentences.
 */
const SYSTEM_SENTENCE = [
  /\b(?:sav(?:e|ed|es|ing)|stor(?:e|ed|es|ing)|stays?|remains?|kept)\b[^.!?]{0,120}\b(?:browser|device|computer)\b/i,
  /\b(?:is|are|was|were)\s+(?:not|never)\s+(?:automatically\s+)?(?:saved|stored|recorded|sent|submitted|shared|counted|collected|retained|used to rank)\b/i,
  /\bnothing\b[^.!?]{0,80}\b(?:saved|stored|recorded|sent|submitted|shared|counted|kept|collected)\b/i,
  /\b(?:this|the)\s+(?:page|app|program|site|tool|form|feature|planning tool)\b[^.!?]{0,60}\b(?:does not|will not|saves nothing)\b[^.!?]{0,40}\b(?:save|autosave|store|record|send|submit|share|collect|retain|nothing)\b/i,
  /\b(?:is|are)\s+(?:voluntary|optional)\b/i,
  /\bsaves nothing\b/i,
];

export function withoutSystemNotices(value: string): string {
  return value
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !SYSTEM_SENTENCE.some((pattern) => pattern.test(sentence)))
    .join(" ")
    .trim();
}
