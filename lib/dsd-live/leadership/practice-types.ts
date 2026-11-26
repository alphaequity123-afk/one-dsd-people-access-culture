export type Role = "aspiring" | "supervisor" | "senior";
export type CycleStep = "plan" | "do" | "study" | "act";
export type PracticeSource = { id: string; title: string; url: string; finding: string; limit: string; application: string };
export type PracticeChoice = { label: string; feedback: string; next: string };
export type PracticeCase = {
  id: string; competency: string; title: string; scenario: string; decisionPrompt: string; start: string;
  steps: { id: string; prompt: string; choices: PracticeChoice[] }[]; debrief: string;
  reflection: string[]; smart: string; pdsa: Record<CycleStep, string>; roles: Record<Role, string>;
  sources: string[]; articleIds: number[];
};
export const cycles: { key: CycleStep; label: string; prompt: string }[] = [
  { key:"plan", label:"Plan", prompt:"Describe one small test. Who will be involved, what do you predict, and what evidence would change your mind?" },
  { key:"do", label:"Do", prompt:"Once you try it, record what happened, including any surprises and who could take part." },
  { key:"study", label:"Study", prompt:"Compare what happened with your prediction. Whose account is missing? Did extra work fall on someone else?" },
  { key:"act", label:"Act", prompt:"Decide what to adopt, adapt or stop. Who will hear the result, and when will you check again?" },
];
