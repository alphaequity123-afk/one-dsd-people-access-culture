import { defineEditableSurface } from "../editable-surface-contract";

// Owner-editable copy for the Community Outreach and Engagement front page.
// The five steps follow one learning cycle: understand yourself, learn about the
// community, connect, engage, then report back and reflect.
const copy = {
  kicker: "Community Outreach and Engagement",
  title: "Community Outreach and Engagement",
  lede: "This page helps staff of the Disability Services Division work with Minnesota communities. You can prepare for the work, find connected organizations, involve people in decisions, and report back on what changed.",
  tasksTitle: "Where would you like to start?",
  cycleTitle: "One cycle, five steps",
  cycleIntro: "Good outreach and engagement follow the same order every time. Each step below links to the part of this program that supports it.",
  stepUnderstandTitle: "Understand yourself",
  stepUnderstand: "Notice your own lens, habits and assumptions before you meet anyone. Your culture shapes what feels normal, polite or clear.",
  stepLearnTitle: "Learn about the community",
  stepLearn: "Build accurate, specific knowledge from the community pages: history, everyday life, language, and dated figures with their sources.",
  stepConnectTitle: "Connect",
  stepConnect: "Find the organizations connected with the Disability Services Division, what each one does, and the public records behind each connection.",
  stepEngageTitle: "Engage",
  stepEngage: "Involve people in a decision that is still open. Plan for language, access, timing, compensation and what participants can influence.",
  stepReportTitle: "Report back and reflect",
  stepReport: "Tell participants what changed, what did not and why. Then reflect on what you learned and what you would do differently.",
  numbersNote: "Figures describe groups and conditions, not any one person. Read how people differ within a community before you read the numbers.",
  tribalNote: "Work with Tribal Nations is government-to-government consultation, not community outreach. For anything concerning Native American individuals, communities or Tribal Nations, contact the Office of Indian Affairs and the Department of Human Services offices that handle Tribal relations and consultation.",
  privacyNote: "This program does not record who you contact or what you plan. The planning tool on these pages saves nothing. Print your plan or copy it before you leave the page.",
};

export const COMMUNITY_OUTREACH_SURFACE = defineEditableSurface({
  surfaceId: "community-outreach.home",
  route: "/community-outreach",
  scopePolicy: "inheritable",
  label: "Community Outreach and Engagement",
  fields: Object.keys(copy).map(key => ({ key, label: key, kind: "long" as const, required: true })),
  approvedValues: copy,
});
