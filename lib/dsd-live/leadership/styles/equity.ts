/**
 * Where each style tends to sit in relation to advancing equity, following the program's leadership styles guide
 * (the opening of each style's "How it affects staff and fair service"). Placement describes styles, never people.
 */
export type EquityZone = { id: string; label: string; note: string; styles: string[] };

export const EQUITY_ZONES: EquityZone[] = [
  { id: "against", label: "Works against equity", note: "Undermines the conditions equity needs.", styles: ["authoritarian", "laissez-faire"] },
  { id: "mixed", label: "Double-edged", note: "Helps or harms depending on how it is used.", styles: ["directive", "transactional", "procedural", "charismatic", "participative"] },
  { id: "foundation", label: "Strong foundation, used with care", note: "Builds equity when its blind spot is watched.", styles: ["transformational", "adaptive-situational", "empowering", "shared", "servant", "coaching", "ethical"] },
  { id: "advances", label: "Most directly advances equity", note: "Changes systems and daily experience.", styles: ["transformative", "inclusive"] },
];
