/** Exact supplied ADSA steps for optional work links; no private provenance or adoption claim. */
export const ADSA_WORK_GOALS = [
  {
    "number": 1,
    "title": "Eliminate Disparities",
    "actions": [
      {
        "id": "ADSA-1.1",
        "sourceText": "Create an equity team in each division that will plan, track, and develop accountability for remaining on task. Ensure the chairs of the team are connected to the administration’s Equity Committee to serve as liaisons between the division and the administration."
      },
      {
        "id": "ADSA-1.2",
        "sourceText": "Create division specific disparities elimination goals, ensure that these goals are strategically created based on data, surveys, and the specifics of program area."
      },
      {
        "id": "ADSA-1.3",
        "sourceText": "Create division equity and inclusion action plan per each goal."
      },
      {
        "id": "ADSA-1.4",
        "sourceText": "Use the Equity Analysis Toolkit to guide decision making."
      },
      {
        "id": "ADSA-1.5",
        "sourceText": "Be data driven and focus on measurable outcomes."
      }
    ]
  },
  {
    "number": 2,
    "title": "Community Engagement",
    "actions": [
      {
        "id": "ADSA-2.1",
        "sourceText": "Consult with DHS Advisory Councils such as Cultural and Ethnic Communities Leadership Council."
      },
      {
        "id": "ADSA-2.2",
        "sourceText": "Complete appropriate Tribal Consultation training"
      },
      {
        "id": "ADSA-2.3",
        "sourceText": "Partner with impacted communities."
      },
      {
        "id": "ADSA-2.4",
        "sourceText": "Embed communities’ feedback into decision making. Create feedback loops."
      },
      {
        "id": "ADSA-2.5",
        "sourceText": "Use resource guides such as Equity Analysis Toolkit and Community Relations Guide"
      }
    ]
  },
  {
    "number": 3,
    "title": "Hiring and Retention",
    "actions": [
      {
        "id": "ADSA-3.1",
        "sourceText": "Focus on workplace culture and climate. Create yearly surveys gauging employee experiences."
      },
      {
        "id": "ADSA-3.2",
        "sourceText": "Actively and continuously address and mitigate microaggressions, implicit and explicit bias, institutional and structural racism."
      },
      {
        "id": "ADSA-3.3",
        "sourceText": "Assemble culturally competent interview panels."
      },
      {
        "id": "ADSA-3.4",
        "sourceText": "Focus on a comprehensive onboarding process that sets new hires up for success."
      },
      {
        "id": "ADSA-3.5",
        "sourceText": "Ensure all interviews include equity related questions and candidates are assessed on their ability to serve all Minnesotans."
      },
      {
        "id": "ADSA-3.6",
        "sourceText": "Close the two-year retention rate gap for employees from historically marginalized communities."
      },
      {
        "id": "ADSA-3.7",
        "sourceText": "Support and promote participation in Employee Resource Groups (ERGs)."
      },
      {
        "id": "ADSA-3.8",
        "sourceText": "Support and promote Employee Engagement Committee."
      }
    ]
  },
  {
    "number": 4,
    "title": "Learning and Development",
    "actions": [
      {
        "id": "ADSA-4.1",
        "sourceText": "Develop the intercultural competence of staff and hiring managers to facilitate the creation of an inclusive workplace."
      },
      {
        "id": "ADSA-4.2",
        "sourceText": "Complete all steps of ADSA’s IDI Implementation Plan."
      },
      {
        "id": "ADSA-4.3",
        "sourceText": "Increase employees access to skills-building opportunities and leadership development capabilities."
      }
    ]
  },
  {
    "number": 5,
    "title": "Contracts and Procurement",
    "actions": [
      {
        "id": "ADSA-5.1",
        "sourceText": "Use the equity analysis toolkit to analyze current practices"
      },
      {
        "id": "ADSA-5.2",
        "sourceText": "Prioritize diverse vendors to achieve current state benchmarks."
      },
      {
        "id": "ADSA-5.3",
        "sourceText": "Diversify communication and advertisement venues to create a vast awareness about opportunities."
      }
    ]
  },
  {
    "number": 6,
    "title": "Communication and Accessibility",
    "actions": [
      {
        "id": "ADSA-6.1",
        "sourceText": "Use proactive and inclusive language consistently"
      },
      {
        "id": "ADSA-6.2",
        "sourceText": "Use the notable dates calendar proactively to engage, recognize, and celebrate your staff."
      },
      {
        "id": "ADSA-6.3",
        "sourceText": "Monitor accessibility compliance, including but not limited to completing appropriate trainings."
      },
      {
        "id": "ADSA-6.4",
        "sourceText": "Ensure communication practices align with the National Culturally and Linguistically Appropriate Services Standards."
      }
    ]
  }
] as const;
export const ADSA_WORK_ACTIONS = ADSA_WORK_GOALS.flatMap(goal=>goal.actions.map(action=>({...action,goalNumber:goal.number,goalTitle:goal.title})));
export function adsaWorkAction(id:string) { return ADSA_WORK_ACTIONS.find(action=>action.id===id); }
