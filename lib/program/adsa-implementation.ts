// Exact source actions are separate from program-authored operational support.
export type ADSAImplementationAction = {
  id: string;
  sourceAction: string;
  sourceLine: number;
  support: {
    status: string;
    constitutionalDuties: { number: number; responsibility: string }[];
    constitutionalProvisions: string[];
    toolRoutes: string[];
    workProduct: string;
    evidenceQuestions: string[];
    missingSpecificSources: string[];
  };
};
export type ADSAImplementationGoal = {
  number: number; id: string; title: string; actions: ADSAImplementationAction[];
};
export type ADSAImplementation = {
  source: { path: string; sha256: string; suppliedBy: string; sourceTitle: string; versionBoundary: string; exactStepCount: number };
  scope: string;
  authorityBoundary: string;
  documentDistinctions: { document: number; title: string; use: string; dateInText?: string }[];
  goals: ADSAImplementationGoal[];
};

export const adsaImplementation: ADSAImplementation = {
  "source": {
    "path": "C:\\Users\\garyb\\.codex\\attachments\\832637fb-d995-43f1-990f-04d17fe7a182\\Pasted text.txt",
    "sha256": "c6d4bace9996c8ef5d870a302acfe7e671c4a11ef96e333381e49d6be87a33c4",
    "suppliedBy": "User attachment; pasted email containing three documents",
    "sourceTitle": "ADSA Equity and Inclusion Implementation Plan",
    "versionBoundary": "No adoption date, issuing signature, revision number or current-status certification supplied. Exact plan wording is available; present legal force and current institutional implementation must be confirmed separately.",
    "exactStepCount": 28
  },
  "scope": "ADSA implementation goals connected to division work within the DHS equity ecosystem; these are not declared department-wide adopted goals.",
  "authorityBoundary": "The supplied plan is preserved as a source. Institutional approval, current policy, legal compliance and observed outcomes require actual responsible review and evidence. Gary’s application stewardship does not confer agency decision authority.",
  "documentDistinctions": [
    {
      "document": 1,
      "title": "ADSA Equity and Inclusion Implementation Plan",
      "use": "Exact goals and 28 action steps; dated/current adoption status unspecified."
    },
    {
      "document": 2,
      "title": "The Field of Operationalizing Equity — A Practitioner Reference Report",
      "dateInText": "April 2026",
      "use": "Professional grounding, frameworks and integrated practice reference. Not settled doctrine, adopted DHS rules or replacement for Gary’s agreed role/constitution."
    },
    {
      "document": 3,
      "title": "Axial Coding Analysis: Embedding Equity and Inclusion in Minnesota’s Disability Services Division",
      "use": "Interpretive relationships among conditions, context, strategies and anticipated consequences. Underlying open-coded dataset and detailed citations are not supplied; relationships are hypotheses, not demonstrated causality or measured results."
    }
  ],
  "goals": [
    {
      "number": 1,
      "id": "equity-goal-1",
      "title": "Eliminate Disparities",
      "actions": [
        {
          "id": "ADSA-1.1",
          "sourceAction": "Create an equity team in each division that will plan, track, and develop accountability for remaining on task. Ensure the chairs of the team are connected to the administration’s Equity Committee to serve as liaisons between the division and the administration.",
          "sourceLine": 17,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 3,
                "responsibility": "Lead work groups and organizational culture change"
              },
              {
                "number": 11,
                "responsibility": "Build internal accountability"
              }
            ],
            "constitutionalProvisions": [
              "3.6",
              "8.3",
              "15.1"
            ],
            "toolRoutes": [
              "/practice/gp-4",
              "/one-dsd/team",
              "/my-work/plan"
            ],
            "workProduct": "Division equity-team charter with proposed responsibilities, tracking arrangements and a confirmed chair-to-administration liaison connection.",
            "evidenceQuestions": [
              "Who has actually designated the team and its chair, and how does the chair connect with the administration Equity Committee?",
              "What responsibilities, decisions and review arrangements are agreed, and what designation remains pending?"
            ],
            "missingSpecificSources": []
          }
        },
        {
          "id": "ADSA-1.2",
          "sourceAction": "Create division specific disparities elimination goals, ensure that these goals are strategically created based on data, surveys, and the specifics of program area.",
          "sourceLine": 19,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 4,
                "responsibility": "Establish benchmarks and targets"
              },
              {
                "number": 12,
                "responsibility": "Collaborate with DSD data staff and FARM"
              }
            ],
            "constitutionalProvisions": [
              "3.5",
              "9.1",
              "9.2",
              "9.5"
            ],
            "toolRoutes": [
              "/practice/measurement",
              "/practice/gp-7"
            ],
            "workProduct": "Division-specific disparity goal proposal tied to a program-area baseline, affected populations, survey or other evidence, target rationale and data limitations.",
            "evidenceQuestions": [
              "Which disparity in this program area is supported by the available data and community experience?",
              "How were the baseline, denominator, comparison and proposed goal selected, and what missing evidence could change the goal?"
            ],
            "missingSpecificSources": []
          }
        },
        {
          "id": "ADSA-1.3",
          "sourceAction": "Create division equity and inclusion action plan per each goal.",
          "sourceLine": 21,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 2,
                "responsibility": "Guide policy development, implementation, and compliance"
              },
              {
                "number": 11,
                "responsibility": "Build internal accountability"
              }
            ],
            "constitutionalProvisions": [
              "5.1",
              "5.3",
              "5.4"
            ],
            "toolRoutes": [
              "/learn/equity-toolkit/goals",
              "/my-work/plan"
            ],
            "workProduct": "Goal-by-goal division action plan identifying the relevant source action, feasible work, accountable role, support, decision needed and review evidence.",
            "evidenceQuestions": [
              "Does each applicable goal have a specific action and responsible role rather than the same general activity?",
              "What is authorized, what remains proposed and how will progress against each action be reviewed?"
            ],
            "missingSpecificSources": []
          }
        },
        {
          "id": "ADSA-1.4",
          "sourceAction": "Use the Equity Analysis Toolkit to guide decision making.",
          "sourceLine": 23,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 2,
                "responsibility": "Guide policy development, implementation, and compliance"
              },
              {
                "number": 6,
                "responsibility": "Support DHS Equity Policy implementation"
              }
            ],
            "constitutionalProvisions": [
              "3.1",
              "3.3",
              "3.5",
              "7.1"
            ],
            "toolRoutes": [
              "/learn/equity-toolkit",
              "/practice/gp-7",
              "/equity-review/general"
            ],
            "workProduct": "Decision analysis using the current official Equity Analysis Toolkit, with the problem, evidence, affected perspectives, alternatives and recommendation documented.",
            "evidenceQuestions": [
              "Was the toolkit used while the decision could still change, and which applicable official toolkit version was consulted?",
              "How did the analysis alter an option or recommendation, and what unresolved question needs the decision owner?"
            ],
            "missingSpecificSources": []
          }
        },
        {
          "id": "ADSA-1.5",
          "sourceAction": "Be data driven and focus on measurable outcomes.",
          "sourceLine": 25,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 4,
                "responsibility": "Establish benchmarks and targets"
              },
              {
                "number": 12,
                "responsibility": "Collaborate with DSD data staff and FARM"
              }
            ],
            "constitutionalProvisions": [
              "9.1",
              "9.2",
              "9.3",
              "9.4"
            ],
            "toolRoutes": [
              "/practice/measurement",
              "/program/reflection"
            ],
            "workProduct": "Outcome measurement plan with defined indicators, baseline and comparison, approved data source, privacy limits and an explanation of observed change.",
            "evidenceQuestions": [
              "Do the measures assess a meaningful outcome rather than only participation or activity counts?",
              "What do results show, what can they not establish and what evidence would justify revising the action?"
            ],
            "missingSpecificSources": []
          }
        }
      ]
    },
    {
      "number": 2,
      "id": "equity-goal-2",
      "title": "Community Engagement",
      "actions": [
        {
          "id": "ADSA-2.1",
          "sourceAction": "Consult with DHS Advisory Councils such as Cultural and Ethnic Communities Leadership Council.",
          "sourceLine": 29,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 14,
                "responsibility": "Support engagement and representation"
              },
              {
                "number": 1,
                "responsibility": "Advise leadership and staff on DEIA"
              }
            ],
            "constitutionalProvisions": [
              "3.3",
              "3.6"
            ],
            "toolRoutes": [
              "/practice/gp-3",
              "/support/right-person"
            ],
            "workProduct": "Advisory-council engagement preparation identifying the relevant council, decision question, appropriate relationship owner and how advice will inform the work.",
            "evidenceQuestions": [
              "Which council has relevant advisory responsibilities, and has the relationship owner confirmed the appropriate engagement route?",
              "What advice was received and how will the decision owner explain its use or the reasons it could not be used?"
            ],
            "missingSpecificSources": []
          }
        },
        {
          "id": "ADSA-2.2",
          "sourceAction": "Complete appropriate Tribal Consultation training",
          "sourceLine": 31,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 5,
                "responsibility": "Build staff and manager capacity"
              },
              {
                "number": 14,
                "responsibility": "Support engagement and representation"
              }
            ],
            "constitutionalProvisions": [
              "2.3",
              "10.1",
              "10.4"
            ],
            "toolRoutes": [
              "/learn/tribal-referral",
              "/support/right-person"
            ],
            "workProduct": "Official Tribal Consultation training referral and completion record maintained through the responsible agency channel.",
            "evidenceQuestions": [
              "Which training is officially appropriate for this role and who confirms its completion requirements?",
              "What government-to-government responsibilities require referral to the authorized Tribal relations staff?"
            ],
            "missingSpecificSources": []
          }
        },
        {
          "id": "ADSA-2.3",
          "sourceAction": "Partner with impacted communities.",
          "sourceLine": 33,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 14,
                "responsibility": "Support engagement and representation"
              },
              {
                "number": 9,
                "responsibility": "Integrate CLAS and culturally responsive services"
              }
            ],
            "constitutionalProvisions": [
              "3.3",
              "3.4",
              "11.4"
            ],
            "toolRoutes": [
              "/practice/gp-3",
              "/minnesota-communities",
              "/library/ja-stakeholder-map"
            ],
            "workProduct": "Community partnership preparation naming the affected communities, shared work, participation supports, influence on decisions and an accessible report-back arrangement.",
            "evidenceQuestions": [
              "Which impacted people helped shape the partnership question and whose perspective is still missing?",
              "What access, language or compensation arrangements are appropriate and how will the partners influence the options?"
            ],
            "missingSpecificSources": []
          }
        },
        {
          "id": "ADSA-2.4",
          "sourceAction": "Embed communities’ feedback into decision making. Create feedback loops.",
          "sourceLine": 35,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 14,
                "responsibility": "Support engagement and representation"
              },
              {
                "number": 11,
                "responsibility": "Build internal accountability"
              }
            ],
            "constitutionalProvisions": [
              "3.3",
              "5.3",
              "5.4"
            ],
            "toolRoutes": [
              "/practice/gp-3",
              "/program/reflection"
            ],
            "workProduct": "Decision-and-feedback account showing community input, the resulting changes, reasons for limits and how participants can correct the account.",
            "evidenceQuestions": [
              "Can the decision owner trace a community contribution to a changed option or recommendation?",
              "What could not change and why, and have participants had an accessible opportunity to respond to the account?"
            ],
            "missingSpecificSources": []
          }
        },
        {
          "id": "ADSA-2.5",
          "sourceAction": "Use resource guides such as Equity Analysis Toolkit and Community Relations Guide",
          "sourceLine": 37,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 6,
                "responsibility": "Support DHS Equity Policy implementation"
              },
              {
                "number": 14,
                "responsibility": "Support engagement and representation"
              }
            ],
            "constitutionalProvisions": [
              "2.1",
              "3.3",
              "7.1"
            ],
            "toolRoutes": [
              "/learn/equity-toolkit",
              "/practice/gp-3",
              "/practice/requirements"
            ],
            "workProduct": "Source-based engagement and decision preparation using the applicable Equity Analysis Toolkit and current Community Relations Guide.",
            "evidenceQuestions": [
              "Were the applicable official versions of both guides confirmed rather than treating an application companion as the official guide?",
              "Which guide questions changed the engagement preparation or decision analysis, and what source remains unavailable?"
            ],
            "missingSpecificSources": []
          }
        }
      ]
    },
    {
      "number": 3,
      "id": "equity-goal-3",
      "title": "Hiring and Retention",
      "actions": [
        {
          "id": "ADSA-3.1",
          "sourceAction": "Focus on workplace culture and climate. Create yearly surveys gauging employee experiences.",
          "sourceLine": 41,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 3,
                "responsibility": "Lead work groups and organizational culture change"
              },
              {
                "number": 12,
                "responsibility": "Collaborate with DSD data staff and FARM"
              }
            ],
            "constitutionalProvisions": [
              "8.3",
              "8.4",
              "9.4",
              "12.3"
            ],
            "toolRoutes": [
              "/practice/gp-4",
              "/practice/measurement"
            ],
            "workProduct": "Employee-experience survey plan and climate response record, with the source plan’s yearly cadence, responsible HR/data review, privacy safeguards and proposed follow-through.",
            "evidenceQuestions": [
              "Who owns the survey, how are anonymity and small-group disclosure protected, and what approved prior results provide a baseline?",
              "How will staff learn what was heard, what climate practices will change and what cannot be inferred from the responses?"
            ],
            "missingSpecificSources": []
          }
        },
        {
          "id": "ADSA-3.2",
          "sourceAction": "Actively and continuously address and mitigate microaggressions, implicit and explicit bias, institutional and structural racism.",
          "sourceLine": 43,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 3,
                "responsibility": "Lead work groups and organizational culture change"
              },
              {
                "number": 5,
                "responsibility": "Build staff and manager capacity"
              }
            ],
            "constitutionalProvisions": [
              "3.2",
              "8.3",
              "8.4"
            ],
            "toolRoutes": [
              "/practice/gp-4",
              "/learn/self-directed",
              "/support/right-person"
            ],
            "workProduct": "Workplace-practice improvement plan addressing observable bias, microaggressions and institutional patterns, with learning, supervisor responsibility and the proper formal route for individual concerns.",
            "evidenceQuestions": [
              "Which recurring practice or structural condition is being addressed and what evidence supports that concern?",
              "What preventive action is within the role’s authority, how will its effect be reviewed and which concerns belong in a protected formal channel?"
            ],
            "missingSpecificSources": []
          }
        },
        {
          "id": "ADSA-3.3",
          "sourceAction": "Assemble culturally competent interview panels.",
          "sourceLine": 45,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 7,
                "responsibility": "Promote inclusive recruitment and succession"
              },
              {
                "number": 5,
                "responsibility": "Build staff and manager capacity"
              }
            ],
            "constitutionalProvisions": [
              "8.1",
              "3.4",
              "10.3"
            ],
            "toolRoutes": [
              "/practice/gp-6",
              "/library/ja-access-checks"
            ],
            "workProduct": "Interview-panel preparation covering relevant perspectives, cultural competence, structured evaluation, accessibility and conflicts, reviewed with HR.",
            "evidenceQuestions": [
              "What preparation enables panelists to evaluate job-related evidence fairly across candidates?",
              "Are panel participation and perspectives meaningful without expecting one employee to represent an entire community?"
            ],
            "missingSpecificSources": []
          }
        },
        {
          "id": "ADSA-3.4",
          "sourceAction": "Focus on a comprehensive onboarding process that sets new hires up for success.",
          "sourceLine": 47,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 5,
                "responsibility": "Build staff and manager capacity"
              },
              {
                "number": 7,
                "responsibility": "Promote inclusive recruitment and succession"
              }
            ],
            "constitutionalProvisions": [
              "8.1",
              "8.2",
              "11.1"
            ],
            "toolRoutes": [
              "/practice/gp-4",
              "/practice/gp-11"
            ],
            "workProduct": "Onboarding plan that connects role expectations, access and accommodations, team relationships, essential resources and early support/review.",
            "evidenceQuestions": [
              "Can a new employee understand the work, obtain access and identify the people who can resolve an onboarding barrier?",
              "How will new-hire feedback improve the plan without turning an adjustment need into a negative performance inference?"
            ],
            "missingSpecificSources": []
          }
        },
        {
          "id": "ADSA-3.5",
          "sourceAction": "Ensure all interviews include equity related questions and candidates are assessed on their ability to serve all Minnesotans.",
          "sourceLine": 49,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 7,
                "responsibility": "Promote inclusive recruitment and succession"
              },
              {
                "number": 6,
                "responsibility": "Support DHS Equity Policy implementation"
              }
            ],
            "constitutionalProvisions": [
              "8.1",
              "2.3"
            ],
            "toolRoutes": [
              "/practice/gp-6"
            ],
            "workProduct": "Job-related equity interview questions and consistent evaluation criteria assessing the candidate’s ability to serve all Minnesotans.",
            "evidenceQuestions": [
              "What observable job-related equity capability does each question assess and how will answers be evaluated consistently?",
              "Have HR and the hiring authority reviewed the questions, accessibility and scoring before use?"
            ],
            "missingSpecificSources": []
          }
        },
        {
          "id": "ADSA-3.6",
          "sourceAction": "Close the two-year retention rate gap for employees from historically marginalized communities.",
          "sourceLine": 51,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 4,
                "responsibility": "Establish benchmarks and targets"
              },
              {
                "number": 7,
                "responsibility": "Promote inclusive recruitment and succession"
              },
              {
                "number": 12,
                "responsibility": "Collaborate with DSD data staff and FARM"
              }
            ],
            "constitutionalProvisions": [
              "8.1",
              "9.2",
              "9.4",
              "9.5"
            ],
            "toolRoutes": [
              "/practice/measurement",
              "/library/pn-stay-interviews-and-retention",
              "/practice/gp-11"
            ],
            "workProduct": "Two-year retention-gap analysis and response proposal defining cohorts, comparison groups, privacy protections and the workplace conditions to investigate.",
            "evidenceQuestions": [
              "How is two-year retention calculated for comparable employee cohorts, and how reliable are the subgroup estimates?",
              "Which conditions may contribute to the gap and what action can be evaluated without assuming the data alone prove a cause?"
            ],
            "missingSpecificSources": [
              "Authorized two-year retention baseline, populations, period and approved gap/target definition need confirmation."
            ]
          }
        },
        {
          "id": "ADSA-3.7",
          "sourceAction": "Support and promote participation in Employee Resource Groups (ERGs).",
          "sourceLine": 53,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 3,
                "responsibility": "Lead work groups and organizational culture change"
              },
              {
                "number": 14,
                "responsibility": "Support engagement and representation"
              }
            ],
            "constitutionalProvisions": [
              "8.3",
              "3.8",
              "11.1"
            ],
            "toolRoutes": [
              "/employee-resource-groups",
              "/practice/gp-4"
            ],
            "workProduct": "Voluntary ERG participation support plan that explains available official groups, access to participation and manager support without requiring disclosure or membership.",
            "evidenceQuestions": [
              "Can staff find current official ERG information and participate without being pressured to disclose an identity?",
              "What scheduling, accessibility or workload barriers can the responsible manager address?"
            ],
            "missingSpecificSources": []
          }
        },
        {
          "id": "ADSA-3.8",
          "sourceAction": "Support and promote Employee Engagement Committee.",
          "sourceLine": 55,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 3,
                "responsibility": "Lead work groups and organizational culture change"
              },
              {
                "number": 11,
                "responsibility": "Build internal accountability"
              },
              {
                "number": 14,
                "responsibility": "Support engagement and representation"
              }
            ],
            "constitutionalProvisions": [
              "8.3",
              "3.6",
              "8.4"
            ],
            "toolRoutes": [
              "/practice/gp-4",
              "/support/right-person"
            ],
            "workProduct": "Employee Engagement Committee participation-support proposal identifying its actual remit, contact route, staff contribution opportunities and response arrangements.",
            "evidenceQuestions": [
              "What is the actual Employee Engagement Committee remit and how can staff contribute through its established channel?",
              "What participation barriers or unanswered proposals need follow-through, without confusing this committee with a division equity-team liaison?"
            ],
            "missingSpecificSources": []
          }
        }
      ]
    },
    {
      "number": 4,
      "id": "equity-goal-4",
      "title": "Learning and Development",
      "actions": [
        {
          "id": "ADSA-4.1",
          "sourceAction": "Develop the intercultural competence of staff and hiring managers to facilitate the creation of an inclusive workplace.",
          "sourceLine": 61,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 5,
                "responsibility": "Build staff and manager capacity"
              },
              {
                "number": 7,
                "responsibility": "Promote inclusive recruitment and succession"
              }
            ],
            "constitutionalProvisions": [
              "10.1",
              "10.2",
              "10.3",
              "8.1"
            ],
            "toolRoutes": [
              "/learn/self-directed",
              "/practice/gp-5",
              "/practice/gp-6"
            ],
            "workProduct": "Intercultural learning-and-application plan for staff and hiring managers, with role-relevant service or workplace practice and feedback about its use.",
            "evidenceQuestions": [
              "Which intercultural capability does the role require and how will learners practice it in a relevant situation?",
              "What observable change in communication, hiring or team practice would show application beyond course completion?"
            ],
            "missingSpecificSources": []
          }
        },
        {
          "id": "ADSA-4.2",
          "sourceAction": "Complete all steps of ADSA’s IDI Implementation Plan.",
          "sourceLine": 63,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 5,
                "responsibility": "Build staff and manager capacity"
              }
            ],
            "constitutionalProvisions": [
              "2.1",
              "10.1",
              "12.5"
            ],
            "toolRoutes": [
              "/practice/gp-5",
              "/support/right-person"
            ],
            "workProduct": "Source-dependent completion checklist for the actual ADSA IDI Implementation Plan, following its specified steps and authorized administration.",
            "evidenceQuestions": [
              "Has the actual current IDI Implementation Plan been obtained and its applicable steps verified?",
              "Who is authorized to administer or interpret an assessment, and how are private assessment information and voluntary disclosure protected?"
            ],
            "missingSpecificSources": [
              "Separate ADSA IDI Implementation Plan and its exact implementation steps have not been supplied."
            ]
          }
        },
        {
          "id": "ADSA-4.3",
          "sourceAction": "Increase employees access to skills-building opportunities and leadership development capabilities.",
          "sourceLine": 65,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 5,
                "responsibility": "Build staff and manager capacity"
              },
              {
                "number": 7,
                "responsibility": "Promote inclusive recruitment and succession"
              }
            ],
            "constitutionalProvisions": [
              "8.1",
              "10.2",
              "11.1"
            ],
            "toolRoutes": [
              "/practice/gp-11",
              "/practice/gp-5"
            ],
            "workProduct": "Accessible skills-building and leadership-development opportunity plan identifying role-relevant capabilities, selection/access criteria, support and application opportunities.",
            "evidenceQuestions": [
              "Who can access development opportunities and do selection, workload or accommodation practices create unequal access?",
              "How will the acquired capability be used and reviewed, without promising a promotion or appointment?"
            ],
            "missingSpecificSources": []
          }
        }
      ]
    },
    {
      "number": 5,
      "id": "equity-goal-5",
      "title": "Contracts and Procurement",
      "actions": [
        {
          "id": "ADSA-5.1",
          "sourceAction": "Use the equity analysis toolkit to analyze current practices",
          "sourceLine": 69,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 13,
                "responsibility": "Embed equity across contracts and grants"
              },
              {
                "number": 6,
                "responsibility": "Support DHS Equity Policy implementation"
              }
            ],
            "constitutionalProvisions": [
              "7.2",
              "3.3",
              "3.5"
            ],
            "toolRoutes": [
              "/practice/gp-10",
              "/learn/equity-toolkit"
            ],
            "workProduct": "Toolkit-based review of current contracting or grant practices, documenting barriers, alternatives and proposed changes for procurement or grant-owner review.",
            "evidenceQuestions": [
              "Which current requirement or contract-cycle decision is being examined and who experiences its burden?",
              "How did toolkit evidence and affected perspectives change the proposed criteria or monitoring approach?"
            ],
            "missingSpecificSources": []
          }
        },
        {
          "id": "ADSA-5.2",
          "sourceAction": "Prioritize diverse vendors to achieve current state benchmarks.",
          "sourceLine": 71,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 13,
                "responsibility": "Embed equity across contracts and grants"
              },
              {
                "number": 4,
                "responsibility": "Establish benchmarks and targets"
              }
            ],
            "constitutionalProvisions": [
              "7.2",
              "9.2",
              "9.5",
              "2.3"
            ],
            "toolRoutes": [
              "/practice/gp-10",
              "/practice/measurement",
              "/practice/requirements"
            ],
            "workProduct": "Vendor-participation benchmark review using verified current state benchmarks, eligible categories, baseline measures and legally reviewed sourcing options.",
            "evidenceQuestions": [
              "What current benchmark and approved vendor definitions apply, and what does the verified baseline show?",
              "Which lawful sourcing or participation approach can procurement authorize, and how will progress be measured?"
            ],
            "missingSpecificSources": [
              "Current state vendor benchmarks, definitions and responsible procurement authority need confirmation."
            ]
          }
        },
        {
          "id": "ADSA-5.3",
          "sourceAction": "Diversify communication and advertisement venues to create a vast awareness about opportunities.",
          "sourceLine": 73,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 13,
                "responsibility": "Embed equity across contracts and grants"
              },
              {
                "number": 14,
                "responsibility": "Support engagement and representation"
              }
            ],
            "constitutionalProvisions": [
              "7.2",
              "3.4",
              "11.3"
            ],
            "toolRoutes": [
              "/practice/gp-10",
              "/practice/gp-3",
              "/library/ja-plain-language"
            ],
            "workProduct": "Solicitation outreach plan comparing communication venues, accessible opportunity information, reach and equal access to submission requirements.",
            "evidenceQuestions": [
              "Which relevant vendors are unlikely to receive the current notice and which additional venues can reach them?",
              "Are the notices accessible and consistent, and what evidence will show awareness improved without promising selection?"
            ],
            "missingSpecificSources": []
          }
        }
      ]
    },
    {
      "number": 6,
      "id": "equity-goal-6",
      "title": "Communication and Accessibility",
      "actions": [
        {
          "id": "ADSA-6.1",
          "sourceAction": "Use proactive and inclusive language consistently",
          "sourceLine": 77,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 9,
                "responsibility": "Integrate CLAS and culturally responsive services"
              },
              {
                "number": 5,
                "responsibility": "Build staff and manager capacity"
              }
            ],
            "constitutionalProvisions": [
              "3.4",
              "11.2",
              "11.4"
            ],
            "toolRoutes": [
              "/practice/gp-13",
              "/library/ja-plain-language"
            ],
            "workProduct": "Inclusive-language revision and use guide tied to the actual audience, purpose, preferred terminology and accessibility of the communication.",
            "evidenceQuestions": [
              "What wording could exclude, stereotype or obscure the intended task, and what audience or source guidance supports the revision?",
              "Can people understand and use the revised communication, and how will correction requests improve future wording?"
            ],
            "missingSpecificSources": []
          }
        },
        {
          "id": "ADSA-6.2",
          "sourceAction": "Use the notable dates calendar proactively to engage, recognize, and celebrate your staff.",
          "sourceLine": 79,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 3,
                "responsibility": "Lead work groups and organizational culture change"
              },
              {
                "number": 14,
                "responsibility": "Support engagement and representation"
              }
            ],
            "constitutionalProvisions": [
              "8.5",
              "3.8",
              "11.1"
            ],
            "toolRoutes": [
              "/practice/gp-4",
              "/practice/gp-8"
            ],
            "workProduct": "Source-checked notable-date recognition plan with voluntary participation, access needs and staff input about respectful recognition.",
            "evidenceQuestions": [
              "Which current notable-date calendar is being used and how are dates and meanings verified?",
              "How can staff help shape recognition without being expected to speak for a group or participate in observance?"
            ],
            "missingSpecificSources": []
          }
        },
        {
          "id": "ADSA-6.3",
          "sourceAction": "Monitor accessibility compliance, including but not limited to completing appropriate trainings.",
          "sourceLine": 81,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 2,
                "responsibility": "Guide policy development, implementation, and compliance"
              },
              {
                "number": 5,
                "responsibility": "Build staff and manager capacity"
              },
              {
                "number": 9,
                "responsibility": "Integrate CLAS and culturally responsive services"
              }
            ],
            "constitutionalProvisions": [
              "11.1",
              "11.2",
              "11.4",
              "10.3"
            ],
            "toolRoutes": [
              "/library/ja-access-checks",
              "/practice/gp-9",
              "/practice/requirements"
            ],
            "workProduct": "Accessibility review and remediation record with applicable standards, observed barriers, responsible owner, appropriate training and evidence of rechecking.",
            "evidenceQuestions": [
              "Which applicable accessibility requirements and qualified staff govern this material, service or technology?",
              "Which barriers were corrected and retested, which remain and what appropriate training supports continued monitoring?"
            ],
            "missingSpecificSources": []
          }
        },
        {
          "id": "ADSA-6.4",
          "sourceAction": "Ensure communication practices align with the National Culturally and Linguistically Appropriate Services Standards.",
          "sourceLine": 83,
          "support": {
            "status": "Program-authored implementation support; not an additional official action or completion claim.",
            "constitutionalDuties": [
              {
                "number": 9,
                "responsibility": "Integrate CLAS and culturally responsive services"
              },
              {
                "number": 2,
                "responsibility": "Guide policy development, implementation, and compliance"
              }
            ],
            "constitutionalProvisions": [
              "7.4",
              "11.3",
              "11.4"
            ],
            "toolRoutes": [
              "/practice/clas",
              "/library/ja-language-access-checklist"
            ],
            "workProduct": "Communication practice crosswalk to applicable National Culturally and Linguistically Appropriate Services Standards, with language/cultural access actions, responsible review and evidence of intended-task use.",
            "evidenceQuestions": [
              "Which CLAS standards apply to this communication context and what action follows from each?",
              "How will language assistance, cultural responsiveness and participant feedback be reviewed without declaring compliance from a completed checklist?"
            ],
            "missingSpecificSources": []
          }
        }
      ]
    }
  ]
};

export const adsaImplementationGoals = adsaImplementation.goals;
export const adsaImplementationActions = adsaImplementationGoals.flatMap((goal) => goal.actions);

/** Display/record adapters retain source text while identifying support as authored guidance. */
export const ADSA_IMPLEMENTATION_GOALS = adsaImplementationGoals.map((goal) => ({
  number: goal.number,
  title: goal.title,
  actions: goal.actions.map((action) => ({
    id: action.id,
    sourceText: action.sourceAction,
    sourceLines: [action.sourceLine],
    provisionIds: action.support.constitutionalProvisions,
    capabilities: action.support.constitutionalDuties.map((duty) => ({
      number: duty.number, label: duty.responsibility,
    })),
    tools: action.support.toolRoutes.map((href) => ({
      href,
      label: href === '/consultant/program' ? 'Protected program work' : href.split('/').filter(Boolean).pop()!.replaceAll('-', ' '),
    })),
    workProduct: action.support.workProduct,
    evidenceQuestions: action.support.evidenceQuestions,
    dependencies: action.support.missingSpecificSources,
    supportStatus: action.support.status,
  })),
}));
export const ADSA_IMPLEMENTATION_ACTIONS = ADSA_IMPLEMENTATION_GOALS.flatMap((goal) =>
  goal.actions.map((action) => ({ ...action, goalNumber: goal.number, goalTitle: goal.title })),
);
export const ADSA_IMPLEMENTATION_SOURCE = adsaImplementation.source;
