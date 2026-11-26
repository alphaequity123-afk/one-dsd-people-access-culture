export function isDisabilityOutreach(question: string): boolean {
  return /\b(?:disability|DSD)\b/i.test(question) && /\boutreach\b/i.test(question);
}
