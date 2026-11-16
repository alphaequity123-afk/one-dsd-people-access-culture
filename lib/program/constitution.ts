/** Proposed program charter. No agency policy adoption or completed acceptance is implied. */
export type FoundationState = "available-with-limits" | "proposed" | "deferred";
export type FoundationProvision = { id: string; article: number; title: string; summary: string; state: FoundationState; resources: { label: string; href: string }[]; gap: string };
export const foundationStatusLabels: Record<FoundationState, string> = { "available-with-limits": "Resources available; further work remains", proposed: "Proposed program requirement", deferred: "Excluded from current delivery" };
export const foundationArticles: { id: number; title: string }[] = [
  {
    "id": 1,
    "title": "Mission and intended outcomes"
  },
  {
    "id": 2,
    "title": "Authority and limits"
  },
  {
    "id": 3,
    "title": "Operating principles"
  },
  {
    "id": 4,
    "title": "Consultant responsibilities"
  },
  {
    "id": 5,
    "title": "From question to action"
  },
  {
    "id": 6,
    "title": "Current consultation boundaries"
  },
  {
    "id": 7,
    "title": "Policy, services, grants and contracts"
  },
  {
    "id": 8,
    "title": "Workforce and culture"
  },
  {
    "id": 9,
    "title": "Measurement and results"
  },
  {
    "id": 10,
    "title": "Learning and capacity"
  },
  {
    "id": 11,
    "title": "Accessibility and language access"
  },
  {
    "id": 12,
    "title": "Information and privacy"
  },
  {
    "id": 13,
    "title": "Ask and the judgment of responsible people"
  },
  {
    "id": 14,
    "title": "Connected work and resources"
  },
  {
    "id": 15,
    "title": "Stewardship and review"
  },
  {
    "id": 16,
    "title": "Conditions for adoption"
  }
];
export const foundationProvisions: FoundationProvision[] = [
  {
    "id": "1.1",
    "article": 1,
    "title": "Mission",
    "summary": "Help staff across DHS embed equity in their work and workplace by connecting learning, community knowledge, evidence, practical recommendations, authorized decisions and results. Administration and division resources connect this shared purpose to their own responsibilities and context.",
    "state": "proposed",
    "resources": [
      {
        "label": "Explore work areas",
        "href": "/areas"
      }
    ],
    "gap": "Learning and practice resources exist; a connected priorities-to-results record requires further work and agreed measures."
  },
  {
    "id": "1.2",
    "article": 1,
    "title": "Definition of operationalizing equity",
    "summary": "Consider equity in how work is designed, decided, resourced, implemented, evaluated and revised.",
    "state": "available-with-limits",
    "resources": [
      {
        "label": "Explore work areas",
        "href": "/areas"
      }
    ],
    "gap": "Learning and practice resources exist; a connected priorities-to-results record requires further work and agreed measures."
  },
  {
    "id": "1.3",
    "article": 1,
    "title": "Measures of application success",
    "summary": "Examine changes in barriers, access, participation and experience alongside evidence of follow-through.",
    "state": "proposed",
    "resources": [
      {
        "label": "Explore work areas",
        "href": "/areas"
      }
    ],
    "gap": "Learning and practice resources exist; a connected priorities-to-results record requires further work and agreed measures."
  },
  {
    "id": "2.1",
    "article": 2,
    "title": "Governing hierarchy",
    "summary": "Follow applicable law and binding agency requirements before program guidance or learning examples.",
    "state": "proposed",
    "resources": [
      {
        "label": "Equity Toolkit companion",
        "href": "/learn/equity-toolkit/policy-review"
      }
    ],
    "gap": "Current policy applicability and actual decision routes must be confirmed before official use."
  },
  {
    "id": "2.2",
    "article": 2,
    "title": "Required alignment",
    "summary": "Confirm connections to applicable DHS priorities, DHS Equity Policy, the Toolkit and relevant agency standards, including current DSD priorities when the work concerns that division.",
    "state": "proposed",
    "resources": [
      {
        "label": "Equity Toolkit companion",
        "href": "/learn/equity-toolkit/policy-review"
      }
    ],
    "gap": "Current policy applicability and actual decision routes must be confirmed before official use."
  },
  {
    "id": "2.3",
    "article": 2,
    "title": "Human decision authority",
    "summary": "Keep official decisions with the people and offices holding the relevant authority.",
    "state": "proposed",
    "resources": [
      {
        "label": "Equity Toolkit companion",
        "href": "/learn/equity-toolkit/policy-review"
      }
    ],
    "gap": "Current policy applicability and actual decision routes must be confirmed before official use."
  },
  {
    "id": "2.4",
    "article": 2,
    "title": "Explicit non-substitution rule",
    "summary": "Distinguish a practice draft from an approved policy, completed official review or demonstrated result.",
    "state": "proposed",
    "resources": [
      {
        "label": "Equity Toolkit companion",
        "href": "/learn/equity-toolkit/policy-review"
      }
    ],
    "gap": "Current policy applicability and actual decision routes must be confirmed before official use."
  },
  {
    "id": "3.1",
    "article": 3,
    "title": "Equity is integral to ordinary work",
    "summary": "Consider equity while decisions remain open and proposals can still change.",
    "state": "proposed",
    "resources": [
      {
        "label": "Intercultural learning",
        "href": "/learn/intercultural"
      }
    ],
    "gap": "Principles appear in existing resources; complete content, accessibility and information-use review is still needed."
  },
  {
    "id": "3.2",
    "article": 3,
    "title": "Examine systems before assigning individual blame",
    "summary": "Examine rules, resources, incentives and decision rights before interpreting a problem as an individual deficit.",
    "state": "available-with-limits",
    "resources": [
      {
        "label": "Intercultural learning",
        "href": "/learn/intercultural"
      }
    ],
    "gap": "Principles appear in existing resources; complete content, accessibility and information-use review is still needed."
  },
  {
    "id": "3.3",
    "article": 3,
    "title": "Affected people contribute knowledge and influence",
    "summary": "Identify missing perspectives, the influence participants can have and what changed after engagement.",
    "state": "available-with-limits",
    "resources": [
      {
        "label": "Intercultural learning",
        "href": "/learn/intercultural"
      }
    ],
    "gap": "Principles appear in existing resources; complete content, accessibility and information-use review is still needed."
  },
  {
    "id": "3.4",
    "article": 3,
    "title": "Accessibility and language access are design conditions",
    "summary": "Make resources available without learning prerequisites, disability disclosure or inaccessible steps.",
    "state": "proposed",
    "resources": [
      {
        "label": "Intercultural learning",
        "href": "/learn/intercultural"
      }
    ],
    "gap": "Principles appear in existing resources; complete content, accessibility and information-use review is still needed."
  },
  {
    "id": "3.5",
    "article": 3,
    "title": "Evidence and uncertainty remain visible",
    "summary": "Distinguish verified facts, user information, interpretation, recommendations, practice examples and unanswered questions.",
    "state": "proposed",
    "resources": [
      {
        "label": "Intercultural learning",
        "href": "/learn/intercultural"
      }
    ],
    "gap": "Principles appear in existing resources; complete content, accessibility and information-use review is still needed."
  },
  {
    "id": "3.6",
    "article": 3,
    "title": "Responsibility is distributed",
    "summary": "Support substantive consultant leadership while retaining managers’ and work owners’ implementation responsibilities.",
    "state": "proposed",
    "resources": [
      {
        "label": "Intercultural learning",
        "href": "/learn/intercultural"
      }
    ],
    "gap": "Principles appear in existing resources; complete content, accessibility and information-use review is still needed."
  },
  {
    "id": "3.7",
    "article": 3,
    "title": "Learning must support application",
    "summary": "Help learning lead to a decision, revised work, improved process or consequential conversation.",
    "state": "available-with-limits",
    "resources": [
      {
        "label": "Intercultural learning",
        "href": "/learn/intercultural"
      }
    ],
    "gap": "Principles appear in existing resources; complete content, accessibility and information-use review is still needed."
  },
  {
    "id": "3.8",
    "article": 3,
    "title": "Participation shall not become surveillance",
    "summary": "Keep private reflection and learning separate from employee scoring or monitoring.",
    "state": "proposed",
    "resources": [
      {
        "label": "Intercultural learning",
        "href": "/learn/intercultural"
      }
    ],
    "gap": "Principles appear in existing resources; complete content, accessibility and information-use review is still needed."
  },
  {
    "id": "4.1",
    "article": 4,
    "title": "Primary-duty priority",
    "summary": "Prioritize policy and operational analysis, implementation, accountability, measurement and staff capacity.",
    "state": "proposed",
    "resources": [
      {
        "label": "DSD example: One DSD Team choices",
        "href": "/one-dsd/team/resource-selections"
      },
      {
        "label": "Connect analysis, action and results",
        "href": "/program/model"
      },
      {
        "label": "Requirements and review evidence",
        "href": "/practice/requirements"
      },
      {
        "label": "Measurement and evaluation",
        "href": "/practice/measurement"
      }
    ],
    "gap": "Resources support these responsibilities; full operational capability and ownership are not established by a course or worksheet."
  },
  {
    "id": "4.2",
    "article": 4,
    "title": "Research-to-practice responsibility",
    "summary": "Review new research for evidence strength, DSD relevance, changed guidance and maintenance responsibility.",
    "state": "available-with-limits",
    "resources": [
      {
        "label": "DSD example: One DSD Team choices",
        "href": "/one-dsd/team/resource-selections"
      },
      {
        "label": "Connect analysis, action and results",
        "href": "/program/model"
      },
      {
        "label": "Requirements and review evidence",
        "href": "/practice/requirements"
      },
      {
        "label": "Measurement and evaluation",
        "href": "/practice/measurement"
      }
    ],
    "gap": "Resources support these responsibilities; full operational capability and ownership are not established by a course or worksheet."
  },
  {
    "id": "5.1",
    "article": 5,
    "title": "Common lifecycle",
    "summary": "Connect a work question to evidence, analysis, options, review, action and learning from results.",
    "state": "proposed",
    "resources": [
      {
        "label": "Guided practice",
        "href": "/paths"
      }
    ],
    "gap": "Practice paths prepare drafts; continuity, shared operational records and authorized follow-through need verification."
  },
  {
    "id": "5.2",
    "article": 5,
    "title": "Proportionate depth",
    "summary": "Match the depth of review to the significance, uncertainty and potential effects of the decision.",
    "state": "proposed",
    "resources": [
      {
        "label": "Guided practice",
        "href": "/paths"
      }
    ],
    "gap": "Practice paths prepare drafts; continuity, shared operational records and authorized follow-through need verification."
  },
  {
    "id": "5.3",
    "article": 5,
    "title": "Minimum work record",
    "summary": "Record enough context to understand the issue, evidence, decision, responsibility and next step.",
    "state": "proposed",
    "resources": [
      {
        "label": "Guided practice",
        "href": "/paths"
      }
    ],
    "gap": "Practice paths prepare drafts; continuity, shared operational records and authorized follow-through need verification."
  },
  {
    "id": "5.4",
    "article": 5,
    "title": "Status integrity",
    "summary": "Describe accurately whether work is a draft, reviewed, decided, implemented or awaiting action.",
    "state": "proposed",
    "resources": [
      {
        "label": "Guided practice",
        "href": "/paths"
      }
    ],
    "gap": "Practice paths prepare drafts; continuity, shared operational records and authorized follow-through need verification."
  },
  {
    "id": "6.1",
    "article": 6,
    "title": "Consultation intake",
    "summary": "Consultation intake is described in the proposed charter but excluded from the current application.",
    "state": "deferred",
    "resources": [
      {
        "label": "Published answers",
        "href": "/ask"
      }
    ],
    "gap": "No consultation intake, triage, booking or response promises are being introduced. Existing specialist routes remain distinct."
  },
  {
    "id": "6.2",
    "article": 6,
    "title": "Triage factors",
    "summary": "Request triage is excluded while consultation intake remains deferred.",
    "state": "deferred",
    "resources": [
      {
        "label": "Published answers",
        "href": "/ask"
      }
    ],
    "gap": "No consultation intake, triage, booking or response promises are being introduced. Existing specialist routes remain distinct."
  },
  {
    "id": "6.3",
    "article": 6,
    "title": "Service commitments",
    "summary": "Do not offer consultation response-time commitments that are not supported by confirmed arrangements.",
    "state": "deferred",
    "resources": [
      {
        "label": "Published answers",
        "href": "/ask"
      }
    ],
    "gap": "No consultation intake, triage, booking or response promises are being introduced. Existing specialist routes remain distinct."
  },
  {
    "id": "6.4",
    "article": 6,
    "title": "Escalation and scope boundaries",
    "summary": "Preserve existing specialist and authorized decision routes without establishing a new consultation queue.",
    "state": "proposed",
    "resources": [
      {
        "label": "Published answers",
        "href": "/ask"
      }
    ],
    "gap": "No consultation intake, triage, booking or response promises are being introduced. Existing specialist routes remain distinct."
  },
  {
    "id": "6.5",
    "article": 6,
    "title": "Reusable knowledge",
    "summary": "Share reviewed, de-identified knowledge from practice only when its use and publication are appropriate.",
    "state": "proposed",
    "resources": [
      {
        "label": "Published answers",
        "href": "/ask"
      }
    ],
    "gap": "No consultation intake, triage, booking or response promises are being introduced. Existing specialist routes remain distinct."
  },
  {
    "id": "7.1",
    "article": 7,
    "title": "Policy and procedure review",
    "summary": "Examine policy and procedures through their language, effects, evidence and implementation requirements.",
    "state": "available-with-limits",
    "resources": [
      {
        "label": "Policy review companion",
        "href": "/learn/equity-toolkit/policy-review"
      }
    ],
    "gap": "Review resources exist; source currency and authorized routing require confirmation for actual policy or contract work."
  },
  {
    "id": "7.2",
    "article": 7,
    "title": "Grants and contract lifecycle",
    "summary": "Consider equity through requirements, selection, implementation, monitoring and corrective action in grants and contracts.",
    "state": "proposed",
    "resources": [
      {
        "label": "Policy review companion",
        "href": "/learn/equity-toolkit/policy-review"
      }
    ],
    "gap": "Review resources exist; source currency and authorized routing require confirmation for actual policy or contract work."
  },
  {
    "id": "7.3",
    "article": 7,
    "title": "Common reporting elements",
    "summary": "Prepare a report that makes findings, options, implications, limits and needed decisions understandable.",
    "state": "proposed",
    "resources": [
      {
        "label": "Policy review companion",
        "href": "/learn/equity-toolkit/policy-review"
      }
    ],
    "gap": "Review resources exist; source currency and authorized routing require confirmation for actual policy or contract work."
  },
  {
    "id": "7.4",
    "article": 7,
    "title": "CLAS integration",
    "summary": "Consider relevant CLAS standards in service design, language access and culturally responsive practice.",
    "state": "available-with-limits",
    "resources": [
      {
        "label": "Policy review companion",
        "href": "/learn/equity-toolkit/policy-review"
      }
    ],
    "gap": "Review resources exist; source currency and authorized routing require confirmation for actual policy or contract work."
  },
  {
    "id": "8.1",
    "article": 8,
    "title": "Workforce lifecycle",
    "summary": "Examine recruitment, onboarding, development, assignments, retention and succession as connected working conditions.",
    "state": "available-with-limits",
    "resources": [
      {
        "label": "Workforce resources",
        "href": "/areas/workforce"
      }
    ],
    "gap": "Workforce and Team resources exist; personnel decisions and approved responsibilities remain outside practice activities."
  },
  {
    "id": "8.2",
    "article": 8,
    "title": "Consistent onboarding",
    "summary": "Make expectations, resources and opportunities understandable to new employees.",
    "state": "proposed",
    "resources": [
      {
        "label": "Workforce resources",
        "href": "/areas/workforce"
      }
    ],
    "gap": "Workforce and Team resources exist; personnel decisions and approved responsibilities remain outside practice activities."
  },
  {
    "id": "8.3",
    "article": 8,
    "title": "Culture-change work groups",
    "summary": "Support shared culture-change discussion with meaningful decisions and follow-through.",
    "state": "proposed",
    "resources": [
      {
        "label": "Workforce resources",
        "href": "/areas/workforce"
      }
    ],
    "gap": "Workforce and Team resources exist; personnel decisions and approved responsibilities remain outside practice activities."
  },
  {
    "id": "8.4",
    "article": 8,
    "title": "Feedback protections",
    "summary": "Protect candid feedback and avoid unnecessary disclosure of personal or sensitive information.",
    "state": "proposed",
    "resources": [
      {
        "label": "Workforce resources",
        "href": "/areas/workforce"
      }
    ],
    "gap": "Workforce and Team resources exist; personnel decisions and approved responsibilities remain outside practice activities."
  },
  {
    "id": "8.5",
    "article": 8,
    "title": "Recognition",
    "summary": "Recognize useful contributions without making participation coercive or implying unsupported outcomes.",
    "state": "proposed",
    "resources": [
      {
        "label": "Workforce resources",
        "href": "/areas/workforce"
      }
    ],
    "gap": "Workforce and Team resources exist; personnel decisions and approved responsibilities remain outside practice activities."
  },
  {
    "id": "9.1",
    "article": 9,
    "title": "Measurement partnership",
    "summary": "Work with appropriate DSD data partners to agree definitions, analysis and interpretation.",
    "state": "proposed",
    "resources": [
      {
        "label": "Measurement practice",
        "href": "/practice/measurement"
      }
    ],
    "gap": "A measurement worksheet supports preparation; approved definitions, data partnerships and actual result evidence need confirmation."
  },
  {
    "id": "9.2",
    "article": 9,
    "title": "Indicator requirements",
    "summary": "Define each measure, its source, baseline, limitations and responsible data arrangements.",
    "state": "proposed",
    "resources": [
      {
        "label": "Measurement practice",
        "href": "/practice/measurement"
      }
    ],
    "gap": "A measurement worksheet supports preparation; approved definitions, data partnerships and actual result evidence need confirmation."
  },
  {
    "id": "9.3",
    "article": 9,
    "title": "Balanced measurement",
    "summary": "Look across implementation, access, participation and outcomes rather than relying on activity counts.",
    "state": "proposed",
    "resources": [
      {
        "label": "Measurement practice",
        "href": "/practice/measurement"
      }
    ],
    "gap": "A measurement worksheet supports preparation; approved definitions, data partnerships and actual result evidence need confirmation."
  },
  {
    "id": "9.4",
    "article": 9,
    "title": "Interpretation safeguards",
    "summary": "Explain uncertainty and avoid conclusions that the available evidence cannot support.",
    "state": "proposed",
    "resources": [
      {
        "label": "Measurement practice",
        "href": "/practice/measurement"
      }
    ],
    "gap": "A measurement worksheet supports preparation; approved definitions, data partnerships and actual result evidence need confirmation."
  },
  {
    "id": "9.5",
    "article": 9,
    "title": "Targets and corrective action",
    "summary": "Agree meaningful targets and examine what corrective action is needed when progress falls short.",
    "state": "proposed",
    "resources": [
      {
        "label": "Measurement practice",
        "href": "/practice/measurement"
      }
    ],
    "gap": "A measurement worksheet supports preparation; approved definitions, data partnerships and actual result evidence need confirmation."
  },
  {
    "id": "10.1",
    "article": 10,
    "title": "Learning architecture",
    "summary": "Offer direct entry through role, work area, task, goal, question and guided practice.",
    "state": "available-with-limits",
    "resources": [
      {
        "label": "Course library",
        "href": "/courses"
      },
      {
        "label": "Self-directed courses",
        "href": "/learn/self-directed"
      }
    ],
    "gap": "The collection is extensive; course depth, learning-to-work transfer and review evidence are being assessed. The audio pilot remains limited to 72 self-directed courses."
  },
  {
    "id": "10.2",
    "article": 10,
    "title": "Applied learning outputs",
    "summary": "Help learning produce an appropriate draft communication, analysis, plan or next action.",
    "state": "available-with-limits",
    "resources": [
      {
        "label": "Course library",
        "href": "/courses"
      },
      {
        "label": "Self-directed courses",
        "href": "/learn/self-directed"
      }
    ],
    "gap": "The collection is extensive; course depth, learning-to-work transfer and review evidence are being assessed. The audio pilot remains limited to 72 self-directed courses."
  },
  {
    "id": "10.3",
    "article": 10,
    "title": "Awareness and capacity assessment",
    "summary": "Distinguish confidence from demonstrated understanding while keeping developmental learning separate from personnel evaluation.",
    "state": "proposed",
    "resources": [
      {
        "label": "Course library",
        "href": "/courses"
      },
      {
        "label": "Self-directed courses",
        "href": "/learn/self-directed"
      }
    ],
    "gap": "The collection is extensive; course depth, learning-to-work transfer and review evidence are being assessed. The audio pilot remains limited to 72 self-directed courses."
  },
  {
    "id": "10.4",
    "article": 10,
    "title": "External training",
    "summary": "Scope external learning to a real need, accessible participation and useful application afterward.",
    "state": "proposed",
    "resources": [
      {
        "label": "Course library",
        "href": "/courses"
      },
      {
        "label": "Self-directed courses",
        "href": "/learn/self-directed"
      }
    ],
    "gap": "The collection is extensive; course depth, learning-to-work transfer and review evidence are being assessed. The audio pilot remains limited to 72 self-directed courses."
  },
  {
    "id": "11.1",
    "article": 11,
    "title": "Accessibility baseline",
    "summary": "Treat accessibility as a condition of the experience and verify applicable agency requirements.",
    "state": "proposed",
    "resources": [
      {
        "label": "Accessibility resources",
        "href": "/library"
      }
    ],
    "gap": "Text, editable materials and supporting media exist; no complete accessibility or language-service certification is claimed."
  },
  {
    "id": "11.2",
    "article": 11,
    "title": "Required experience characteristics",
    "summary": "Provide usable navigation, readable explanations and meaningful alternatives to audio and visual material.",
    "state": "available-with-limits",
    "resources": [
      {
        "label": "Accessibility resources",
        "href": "/library"
      }
    ],
    "gap": "Text, editable materials and supporting media exist; no complete accessibility or language-service certification is claimed."
  },
  {
    "id": "11.3",
    "article": 11,
    "title": "Translation and interpretation",
    "summary": "Use appropriate translation and interpretation arrangements rather than assuming a translated document ensures understanding.",
    "state": "proposed",
    "resources": [
      {
        "label": "Accessibility resources",
        "href": "/library"
      }
    ],
    "gap": "Text, editable materials and supporting media exist; no complete accessibility or language-service certification is claimed."
  },
  {
    "id": "11.4",
    "article": 11,
    "title": "Participatory validation",
    "summary": "Include people with relevant access needs in validating the experience.",
    "state": "proposed",
    "resources": [
      {
        "label": "Accessibility resources",
        "href": "/library"
      }
    ],
    "gap": "Text, editable materials and supporting media exist; no complete accessibility or language-service certification is claimed."
  },
  {
    "id": "12.1",
    "article": 12,
    "title": "Separate information environments",
    "summary": "Separate public learning, private reflection and authorized operational information.",
    "state": "proposed",
    "resources": [
      {
        "label": "Prepare a practice plan",
        "href": "/my-work/plan"
      }
    ],
    "gap": "Saving differs by tool. Local browser drafts are not shared records; approved retention and access arrangements require confirmation."
  },
  {
    "id": "12.2",
    "article": 12,
    "title": "Persistence must be explained accurately",
    "summary": "Explain where a draft is saved, how to recover it and what may be lost.",
    "state": "available-with-limits",
    "resources": [
      {
        "label": "Prepare a practice plan",
        "href": "/my-work/plan"
      }
    ],
    "gap": "Saving differs by tool. Local browser drafts are not shared records; approved retention and access arrangements require confirmation."
  },
  {
    "id": "12.3",
    "article": 12,
    "title": "Data minimization",
    "summary": "Collect only information needed for the stated purpose; avoid case and personnel details in practice.",
    "state": "proposed",
    "resources": [
      {
        "label": "Prepare a practice plan",
        "href": "/my-work/plan"
      }
    ],
    "gap": "Saving differs by tool. Local browser drafts are not shared records; approved retention and access arrangements require confirmation."
  },
  {
    "id": "12.4",
    "article": 12,
    "title": "Protection of operational records",
    "summary": "Protect operational records according to confirmed access, classification and retention arrangements.",
    "state": "proposed",
    "resources": [
      {
        "label": "Prepare a practice plan",
        "href": "/my-work/plan"
      }
    ],
    "gap": "Saving differs by tool. Local browser drafts are not shared records; approved retention and access arrangements require confirmation."
  },
  {
    "id": "12.5",
    "article": 12,
    "title": "Purpose limitation",
    "summary": "Do not reuse information for an unrelated purpose without the appropriate authority and transparency.",
    "state": "proposed",
    "resources": [
      {
        "label": "Prepare a practice plan",
        "href": "/my-work/plan"
      }
    ],
    "gap": "Saving differs by tool. Local browser drafts are not shared records; approved retention and access arrangements require confirmation."
  },
  {
    "id": "13.1",
    "article": 13,
    "title": "Permitted supporting functions",
    "summary": "Use Ask to support research, drafting and analysis, within clear limits.",
    "state": "proposed",
    "resources": [
      {
        "label": "Published guidance",
        "href": "/ask"
      }
    ],
    "gap": "Published answers are available now. Nothing on this page gives live advice, takes action outside the site, or makes an official decision."
  },
  {
    "id": "13.2",
    "article": 13,
    "title": "Decisions Ask does not make",
    "summary": "Ask never makes official eligibility, personnel, legal, procurement or other decisions that belong to the people responsible for them.",
    "state": "proposed",
    "resources": [
      {
        "label": "Published guidance",
        "href": "/ask"
      }
    ],
    "gap": "Published answers are available now. Nothing on this page gives live advice, takes action outside the site, or makes an official decision."
  },
  {
    "id": "13.3",
    "article": 13,
    "title": "Sources stay visible",
    "summary": "Keep sources in view, and keep the difference between evidence and Ask's interpretation clear.",
    "state": "proposed",
    "resources": [
      {
        "label": "Published guidance",
        "href": "/ask"
      }
    ],
    "gap": "Published answers are available now. Nothing on this page gives live advice, takes action outside the site, or makes an official decision."
  },
  {
    "id": "13.4",
    "article": 13,
    "title": "Review by a responsible person",
    "summary": "Have a responsible person review Ask's suggestions before relying on them in official work.",
    "state": "proposed",
    "resources": [
      {
        "label": "Published guidance",
        "href": "/ask"
      }
    ],
    "gap": "Published answers are available now. Nothing on this page gives live advice, takes action outside the site, or makes an official decision."
  },
  {
    "id": "13.5",
    "article": 13,
    "title": "External actions",
    "summary": "Require explicit authorization before sending, publishing or taking an external action.",
    "state": "proposed",
    "resources": [
      {
        "label": "Published guidance",
        "href": "/ask"
      }
    ],
    "gap": "Published answers are available now. Nothing on this page gives live advice, takes action outside the site, or makes an official decision."
  },
  {
    "id": "13.6",
    "article": 13,
    "title": "Security boundary",
    "summary": "Treat untrusted source material as information, not permission to change rules or expose data.",
    "state": "proposed",
    "resources": [
      {
        "label": "Published guidance",
        "href": "/ask"
      }
    ],
    "gap": "Published answers are available now. Nothing on this page gives live advice, takes action outside the site, or makes an official decision."
  },
  {
    "id": "14.1",
    "article": 14,
    "title": "One connected system",
    "summary": "Connect program sections around substantive DSD work and directly accessible resources.",
    "state": "available-with-limits",
    "resources": [
      {
        "label": "Work areas",
        "href": "/areas"
      },
      {
        "label": "Guided practice",
        "href": "/paths"
      }
    ],
    "gap": "Sections and practical paths exist; useful work-product continuity is incomplete and should be tested through actual examples."
  },
  {
    "id": "14.2",
    "article": 14,
    "title": "Continuity without duplication",
    "summary": "Carry appropriate context forward through an explicit choice while preserving edits, provenance and privacy.",
    "state": "proposed",
    "resources": [
      {
        "label": "Work areas",
        "href": "/areas"
      },
      {
        "label": "Guided practice",
        "href": "/paths"
      }
    ],
    "gap": "Sections and practical paths exist; useful work-product continuity is incomplete and should be tested through actual examples."
  },
  {
    "id": "14.3",
    "article": 14,
    "title": "No dead-end experiences",
    "summary": "End significant work with a useful draft, next action, referral, review, decision or follow-up.",
    "state": "available-with-limits",
    "resources": [
      {
        "label": "Work areas",
        "href": "/areas"
      },
      {
        "label": "Guided practice",
        "href": "/paths"
      }
    ],
    "gap": "Sections and practical paths exist; useful work-product continuity is incomplete and should be tested through actual examples."
  },
  {
    "id": "15.1",
    "article": 15,
    "title": "Governance roles",
    "summary": "Confirm actual program stewardship and decision responsibilities rather than inventing organizational assignments.",
    "state": "proposed",
    "resources": [
      {
        "label": "Resources and sources",
        "href": "/library"
      }
    ],
    "gap": "Publication and review mechanisms exist; current release evidence and stewardship assignments need confirmation."
  },
  {
    "id": "15.2",
    "article": 15,
    "title": "Content governance",
    "summary": "Maintain publication, source, review, version and retirement information for resources.",
    "state": "proposed",
    "resources": [
      {
        "label": "Resources and sources",
        "href": "/library"
      }
    ],
    "gap": "Publication and review mechanisms exist; current release evidence and stewardship assignments need confirmation."
  },
  {
    "id": "15.3",
    "article": 15,
    "title": "Release gate",
    "summary": "Verify evidence, accessibility, information handling and boundaries before operational release.",
    "state": "proposed",
    "resources": [
      {
        "label": "Resources and sources",
        "href": "/library"
      }
    ],
    "gap": "Publication and review mechanisms exist; current release evidence and stewardship assignments need confirmation."
  },
  {
    "id": "15.4",
    "article": 15,
    "title": "Operational review",
    "summary": "Review usefulness, problems and outcomes and make proportionate improvements.",
    "state": "proposed",
    "resources": [
      {
        "label": "Resources and sources",
        "href": "/library"
      }
    ],
    "gap": "Publication and review mechanisms exist; current release evidence and stewardship assignments need confirmation."
  },
  {
    "id": "15.5",
    "article": 15,
    "title": "Exceptions and amendments",
    "summary": "Document exceptions and material changes while preserving binding requirements.",
    "state": "proposed",
    "resources": [
      {
        "label": "Resources and sources",
        "href": "/library"
      }
    ],
    "gap": "Publication and review mechanisms exist; current release evidence and stewardship assignments need confirmation."
  },
  {
    "id": "16.1",
    "article": 16,
    "title": "Conditions for adoption",
    "summary": "Obtain the necessary authorized review before treating the proposed charter as adopted.",
    "state": "proposed",
    "resources": [
      {
        "label": "Program model",
        "href": "/program/model"
      }
    ],
    "gap": "This charter remains proposed. Adoption requirements and operational acceptance are not represented as completed."
  },
  {
    "id": "16.2",
    "article": 16,
    "title": "Foundational implementation priorities",
    "summary": "Strengthen trust, sources, useful work records and learning-to-practice connections before expanding features; intake remains excluded.",
    "state": "proposed",
    "resources": [
      {
        "label": "Program model",
        "href": "/program/model"
      }
    ],
    "gap": "This charter remains proposed. Adoption requirements and operational acceptance are not represented as completed."
  },
  {
    "id": "16.3",
    "article": 16,
    "title": "Constitutional acceptance test",
    "summary": "A significant capability should explain its purpose, decision authority, evidence, access, information use and intended effects.",
    "state": "proposed",
    "resources": [
      {
        "label": "Program model",
        "href": "/program/model"
      }
    ],
    "gap": "This charter remains proposed. Adoption requirements and operational acceptance are not represented as completed."
  }
];
export const foundationResponsibilities: { title: string; output: string; currentPosition: string }[] = [
  {
    "title": "Advise leadership and staff on People, Access and Culture work",
    "output": "Decision brief identifying the issue, evidence, options, recommendation, owner, and next step",
    "currentPosition": "Consultation intake, triage and queue are explicitly deferred under current direction; advisory resources and proactive consultant work remain"
  },
  {
    "title": "Guide policy development, implementation, and compliance",
    "output": "Proposed revisions, rationale, implementation implications, and unresolved questions",
    "currentPosition": "Review tools and learning exist; who handles each review and how current each source is need confirmation"
  },
  {
    "title": "Lead work groups and organizational culture change",
    "output": "Charter, decision record, named action owners, and review dates",
    "currentPosition": "Selections saved by a team in this browser do not create a shared charter or a record of agreed actions."
  },
  {
    "title": "Establish benchmarks and targets",
    "output": "Approved baseline, measure definition, target, data owner, and reporting schedule",
    "currentPosition": "The measurement worksheet does not establish an approved set of measures, who maintains them or who approved their use."
  },
  {
    "title": "Build staff and manager capacity",
    "output": "Applied work product or documented next action",
    "currentPosition": "Courses and practice tools are available. Review each topic for depth and whether people can use the learning in their work."
  },
  {
    "title": "Support DHS Equity Policy implementation",
    "output": "Traceable evidence for authorized staff; no automatic compliance certification",
    "currentPosition": "Adapted historical materials do not show whether each current policy requirement is covered. Check them against current official sources."
  },
  {
    "title": "Promote inclusive recruitment and succession",
    "output": "Process recommendations reviewed with hiring managers and HR",
    "currentPosition": "Workforce pathways are available. The app does not establish HR approval or assign responsibility for putting recommendations into practice."
  },
  {
    "title": "Coordinate external expertise",
    "output": "Defined need, deliverables, owner, access needs, and evaluation criteria",
    "currentPosition": "A directory identifies possible resources. It does not establish an agreement with an expert about the work, responsibilities or expected results."
  },
  {
    "title": "Integrate CLAS and culturally responsive services",
    "output": "Applicability analysis and proposed language-access/cultural-responsiveness actions",
    "currentPosition": "Resources and practice questions are available. Confirm which current requirements apply to the grant or waiver being considered."
  },
  {
    "title": "Support legislative equity analysis",
    "output": "Draft analysis, evidence limitations, review questions, and submission route",
    "currentPosition": "The twelve-course curriculum supports learning. Confirm the workspace and official submission route before using it for an actual bill analysis."
  },
  {
    "title": "Build internal accountability",
    "output": "Commitment record, progress status, blockers, and evidence of results",
    "currentPosition": "Plans saved in this browser do not create a shared record of actions, a route for unresolved issues or an approved report."
  },
  {
    "title": "Collaborate with DSD data staff and FARM",
    "output": "Validated analysis and interpretation with limitations",
    "currentPosition": "The proposed charter names collaboration with FARM. Its current responsibilities and the process for requesting its work still need confirmation."
  },
  {
    "title": "Embed equity across contracts and grants",
    "output": "Requirements, scoring considerations, monitoring measures, and corrective actions",
    "currentPosition": "The procurement pathway is available. Confirm how reviews connect across stages and who monitors results and addresses problems."
  },
  {
    "title": "Support engagement and representation",
    "output": "Participation plan and “what we heard / what changed / what could not change” record",
    "currentPosition": "Resources support engagement preparation. Evidence is still needed that participation and follow-up records are maintained and briefs are reviewed."
  }
];
