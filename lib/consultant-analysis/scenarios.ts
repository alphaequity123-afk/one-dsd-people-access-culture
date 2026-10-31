import type { AnalysisRequest } from "./schema";

/** Invented learning cases, never evidence about actual DHS people or programs. */
export const PRACTICE_SCENARIOS: (AnalysisRequest & { id: string })[] = [
  {
    id: "hcbs-access", title: "Practice: access to a community service", mode: "practice", kind: "hcbs", scope: "division",
    publicMaterialConfirmed: true, publicResearch: false, goals: ["equity-goal-1", "equity-goal-2", "equity-goal-6"],
    question: "What should be examined before changing how people request this service? Compare options and identify whose perspectives are missing.",
    sources: [{ id: "practice-case", title: "Practice service-access case", text: "This case is invented for practice. A practice program proposes an online-only request form. In one six-month period, 60 of 100 requests from urban areas were completed within 30 days, compared with 20 of 50 requests from rural areas. These figures do not explain the causes. Staff report variable internet access. No interviews with people seeking services have yet been conducted. The proposal includes no phone or paper option, interpretation plan, or accessible-format testing." }],
  },
  {
    id: "hiring-practice", title: "Practice: a hiring process", mode: "practice", kind: "workplace", scope: "team",
    publicMaterialConfirmed: true, publicResearch: false, goals: ["equity-goal-3", "equity-goal-4", "equity-goal-6"],
    question: "Examine the proposed hiring process, distinguish evidence from assumptions, and recommend a practical review plan.",
    sources: [{ id: "practice-case", title: "Practice hiring case", text: "This case is invented for practice. In this example, a team recruits mainly through its existing professional contacts. A proposed interview asks applicants to describe prior agency experience and answer questions without advance preparation. Managers believe this predicts success, but no validation evidence is available. The team has not documented which job duties require prior agency experience. No applicant demographic data, accessibility feedback, or retention measures are supplied." }],
  },
  {
    id: "bill-review", title: "Practice: a legislative proposal", mode: "practice", kind: "bill", scope: "administration",
    publicMaterialConfirmed: true, publicResearch: false, goals: ["equity-goal-1", "equity-goal-2", "equity-goal-6"],
    question: "Analyze possible equity impacts of the proposed change. Compare alternatives and identify research needed before a recommendation.",
    sources: [{ id: "practice-case", title: "Practice proposal excerpt", text: "This proposal is invented for practice and is not a Minnesota bill. It would require annual online renewal of a practice benefit within 14 days of notice. Notice would be issued in English by email. A missed deadline would pause the benefit until a new application is processed. No fiscal estimate, appeal procedure, language-access assessment, disability-access review, community consultation, or information about affected populations is included." }],
  },
  {
    id: "language-support-contract", title: "Practice: a language support contract", mode: "practice", kind: "policy", scope: "agency",
    publicMaterialConfirmed: true, publicResearch: false, goals: ["equity-goal-5", "equity-goal-6"],
    question: "Review the proposed contract approach. Compare price, service access and quality, identify missing perspectives, and suggest evidence to guide a procurement decision.",
    sources: [{ id: "practice-case", title: "Practice language support procurement case", text: "This case is invented for practice and does not describe an actual DHS contract or procurement rule. A practice agency is considering one contract for interpretation and accessible language support across several service lines. Its proposed selection method gives all weight to the lowest hourly price, with no service-quality or accessibility criteria. During January through June 2026, the current arrangement fulfilled 48 of 60 remote interpretation requests by the requested appointment time and 12 of 30 in-person requests by that time. Request complexity, language, urgency and geographic coverage were not recorded, so these figures do not establish why fulfillment differed or which contract would improve it. For this exercise only, planners suggest a target of 90 percent timely fulfillment for each request type. No feedback from people using the service, interpreters, disability-access specialists or smaller vendors has been gathered. The proposed contract does not describe how accessible communication formats or service disruptions would be addressed. Costs, qualifications and the procurement requirements applicable to an actual purchase would need to be checked before a decision." }],
  },
  {
    id: "employee-development-access", title: "Practice: access to employee development", mode: "practice", kind: "workplace", scope: "agency",
    publicMaterialConfirmed: true, publicResearch: false, goals: ["equity-goal-3", "equity-goal-4", "equity-goal-6"],
    question: "Examine access to the development opportunity across work schedules. Distinguish what the participation figures show from what they cannot explain, and compare practical changes without ranking employees.",
    sources: [{ id: "practice-case", title: "Practice employee development case", text: "This case is invented for practice and contains no actual employee records. A practice agency offers the same optional development course to 75 employees on daytime schedules and 50 employees on evening or rotating schedules. During January through June 2026, 60 daytime employees and 15 evening or rotating employees completed it. Sessions were offered only on weekday afternoons, and there was no recording or alternative session. These figures show completion among those offered the course, not learning quality, motivation, job performance or the cause of the difference. For this exercise only, planners propose an 80 percent completion target within each schedule group, while keeping participation voluntary. The agency has no feedback about workload, paid time for participation, accessibility, caregiving conflicts or preferred learning formats. No demographic breakdown or evidence about career outcomes is supplied. Leaders are considering repeat sessions, flexible learning options and clearer access to development time. They have not yet asked employees across schedules which changes would help." }],
  },
];
