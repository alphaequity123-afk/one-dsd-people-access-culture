/** Adapted from the owner-supplied structural analysis tool; original preserved in evidence. */
export type StructuralStepId = 'pattern'|'points'|'fixed'|'power'|'intersect'|'history'|'evidence'|'decision';
export type StructuralField = {k:string;t:'text'|'date'|'area'|'chips'|'radio';l:string;h?:string;opts?:string[]|[string,string][];optional?:boolean};
export type StructuralColumn = {k:string;l:string;t:'text'|'area'|'sel';w?:string;opts?:string[]};
export type StructuralTable = {k:string;start:number;label:string;blank:Record<string,string>;cols:StructuralColumn[]};
export type StructuralStep = {id:StructuralStepId;title:string;short:string;lead:string;example:string;fields:StructuralField[];table?:StructuralTable};
export type StructuralGuidance = {why:string;do:string[];flag?:string};

export const STRUCTURAL_STEPS: StructuralStep[] = [
  {
    "id": "pattern",
    "title": "Name the pattern",
    "short": "What is happening, to whom, where",
    "lead": "Start with a pattern in a process or decision, not with a person. Say what is happening, which groups it reaches, and where in DHS it lives.",
    "example": "A made-up example: Applications for a waiver service from one metro county take about twice as long to reach a decision when the applicant uses a language other than English. The pattern shows up at the eligibility review stage. The process owner is the unit lead for that intake team.",
    "fields": [
      {
        "k": "process",
        "t": "text",
        "l": "The process, decision or service you are looking at",
        "h": "Name it the way staff name it. One process at a time."
      },
      {
        "k": "owner",
        "t": "text",
        "l": "Who owns this process or decision",
        "h": "The role or office that can change it. The Equity and Inclusion Operations Consultant leads this program and provides guidance; the process owner decides the change."
      },
      {
        "k": "what",
        "t": "area",
        "l": "What is happening",
        "h": "Describe the pattern in plain words. Who is delayed, denied, missing, or treated differently, and at what point."
      },
      {
        "k": "groups",
        "t": "chips",
        "l": "Which groups the pattern reaches",
        "h": "Pick what the evidence actually shows, not what you suspect.",
        "opts": [
          "Community or race",
          "Language",
          "Disability",
          "Place or region",
          "Age",
          "Tribal citizens or Native American communities",
          "Income or benefits status",
          "Not yet known"
        ]
      },
      {
        "k": "scope",
        "t": "radio",
        "l": "Is this a pattern or a single situation?",
        "opts": [
          [
            "pattern",
            "A pattern: it shows up more than once, across people, across time, or across similar cases"
          ],
          [
            "single",
            "A single situation involving one person's conduct"
          ],
          [
            "unsure",
            "Not sure yet"
          ]
        ]
      }
    ]
  },
  {
    "id": "points",
    "title": "Map the decision points",
    "short": "Where people are delayed, denied or missing",
    "lead": "Break the process into its stages. At each one, ask who gets delayed, who gets denied, and who never appears at all.",
    "example": "Made-up stages for an intake process: 1 First contact, 2 Forms and documents, 3 Eligibility review, 4 Assessment, 5 Decision and notice, 6 Appeal. The pattern from Step 1 lands at stage 3, where staff wait for translated documents that the applicant was never told were needed.",
    "table": {
      "k": "stages",
      "cols": [
        {
          "k": "stage",
          "l": "Stage",
          "t": "text",
          "w": "15%"
        },
        {
          "k": "who",
          "l": "Who decides here",
          "t": "text",
          "w": "15%"
        },
        {
          "k": "delayed",
          "l": "Who is delayed",
          "t": "area"
        },
        {
          "k": "denied",
          "l": "Who is denied or screened out",
          "t": "area"
        },
        {
          "k": "missing",
          "l": "Who is missing or never reaches this stage",
          "t": "area"
        }
      ],
      "blank": {
        "stage": "",
        "who": "",
        "delayed": "",
        "denied": "",
        "missing": ""
      },
      "start": 3,
      "label": "Add a stage"
    },
    "fields": [
      {
        "k": "hotspot",
        "t": "text",
        "l": "The stage where the pattern is strongest",
        "h": "If more than one, name the one you will look at first."
      }
    ]
  },
  {
    "id": "fixed",
    "title": "Question what is treated as fixed",
    "short": "Rules, bottlenecks and data someone chose",
    "lead": "Much of what feels immovable is a choice someone made and can remake. List what is being treated as fixed at the stage you chose and ask who set it.",
    "example": "Made-up: The eligibility review requires a notarized identity document. That rule was added in a 2014 form update after a single audit finding. No statute requires notarization. It can be changed by the forms owner with policy sign-off. This practice example does not establish what current law or policy requires.",
    "fields": [
      {
        "k": "kinds",
        "t": "chips",
        "l": "What is being treated as fixed here",
        "opts": [
          "An approval bottleneck",
          "Diffuse decision rights (no one clearly decides)",
          "A credential or document requirement",
          "A form or notice",
          "A timeline or deadline",
          "Data built for billing, not for people",
          "A funding or contract rule",
          "A technology limit",
          "Who gets the visible work",
          "Something else"
        ]
      }
    ],
    "table": {
      "k": "fixed",
      "cols": [
        {
          "k": "item",
          "l": "The rule, step, requirement or data item",
          "t": "text",
          "w": "21%"
        },
        {
          "k": "setby",
          "l": "Who set it, and when (if known)",
          "t": "text",
          "w": "17%"
        },
        {
          "k": "required",
          "l": "Is it required by law or policy?",
          "t": "sel",
          "opts": [
            "Not sure",
            "Yes, by statute or rule",
            "Yes, by DHS policy",
            "No, local practice"
          ],
          "w": "14%"
        },
        {
          "k": "remake",
          "l": "Who could change it",
          "t": "text",
          "w": "16%"
        },
        {
          "k": "effect",
          "l": "What it does to the groups in Step 1",
          "t": "area",
          "w": "26%"
        }
      ],
      "blank": {
        "item": "",
        "setby": "",
        "required": "Not sure",
        "remake": "",
        "effect": ""
      },
      "start": 2,
      "label": "Add an item"
    }
  },
  {
    "id": "power",
    "title": "Look at positional power",
    "short": "Who decides, who is affected, who is absent",
    "lead": "Decisions carry the position of the people who make them. Name who holds decision rights at this stage, who is affected, and who is never in the room.",
    "example": "Made-up: Three roles can delay the review but only one can approve it. Applicants and their families have no way to ask about status. County contacts can escalate; community partners cannot. People with lived experience have never seen this stage.",
    "fields": [
      {
        "k": "decides",
        "t": "area",
        "l": "Who holds the decision at this stage",
        "h": "Roles, not names. Include anyone who can stop or slow the process even if they cannot approve it."
      },
      {
        "k": "affected",
        "t": "area",
        "l": "Who is affected and what power they have in the process",
        "h": "Can they ask about status, add information, challenge a result, or choose a different route?"
      },
      {
        "k": "absent",
        "t": "area",
        "l": "Who is absent from the decision",
        "h": "Staff with lived experience, community partners, Tribal partners, front-line staff, people who use the service."
      },
      {
        "k": "diffuse",
        "t": "radio",
        "l": "Are decision rights clear?",
        "opts": [
          [
            "clear",
            "Clear: one role decides and others know it"
          ],
          [
            "diffuse",
            "Diffuse: several roles can delay and no one clearly owns the outcome"
          ],
          [
            "hidden",
            "Hidden: the real decision happens somewhere not written down"
          ]
        ]
      }
    ]
  },
  {
    "id": "intersect",
    "title": "Trace how experiences compound",
    "short": "Intersectionality at this stage",
    "lead": "People are not one group at a time. Look at how identities and circumstances stack at this stage, and name the small groups whose numbers you must protect.",
    "example": "Made-up: Applicants who are both Deaf and use a language other than English wait longest, because interpreter booking and translation run as two separate queues that do not talk to each other. Fewer than ten people a year are in this group, so the record reports the pattern without numbers.",
    "fields": [
      {
        "k": "combo",
        "t": "area",
        "l": "Which combinations of identity or circumstance meet the hardest wall here",
        "h": "Describe the combinations in words. Do not identify individuals."
      },
      {
        "k": "why",
        "t": "area",
        "l": "Why the effects compound",
        "h": "Two separate queues, two sets of documents, two offices, one person expected to manage both."
      },
      {
        "k": "small",
        "t": "area",
        "l": "Small groups to protect in any reporting",
        "h": "Name the groups whose counts are low enough that reporting a number could identify someone. Report them as a pattern, not a count."
      }
    ]
  },
  {
    "id": "history",
    "title": "Learn the institutional history",
    "short": "How this came to be",
    "lead": "Most patterns have a story. Find out how the stage came to work this way, what has been tried before, and what that history explains.",
    "example": "Made-up: The notarization rule followed an audit. Two earlier attempts to drop it stalled because no one owned the forms. A 2021 staff listening session raised the delay, and staff heard nothing back, which is why they stopped raising it.",
    "fields": [
      {
        "k": "origin",
        "t": "area",
        "l": "How did this stage come to work this way",
        "h": "Audits, reorganizations, funding changes, a past incident, a system migration, a legacy form."
      },
      {
        "k": "tried",
        "t": "area",
        "l": "What has been tried before, and what happened",
        "h": "Include attempts that stalled and why. Include what staff or communities were told afterward."
      },
      {
        "k": "explains",
        "t": "area",
        "l": "What the history explains about the pattern today",
        "h": "One or two sentences."
      },
      {
        "k": "sources",
        "t": "area",
        "l": "Where this history came from",
        "h": "Documents, conversations with roles, listening sessions. Sources, not names of individuals."
      }
    ]
  },
  {
    "id": "evidence",
    "title": "Check the evidence",
    "short": "What the data shows and does not show",
    "lead": "Follow the data by community, language, disability and place, with denominators and baselines. Be just as clear about what the data cannot show. Never invent a target.",
    "example": "Made-up: We have decision times for 1,400 applications over 12 months, with language recorded for 92% of them. We do not have disability recorded, so we cannot say anything about disability from this data. Baseline median: 31 days English, 58 days other languages.",
    "fields": [
      {
        "k": "have",
        "t": "area",
        "l": "What data you have",
        "h": "Source, time period, how many records, and the denominator (all applications, all hires, all notices)."
      },
      {
        "k": "shows",
        "t": "area",
        "l": "What it shows",
        "h": "Describe differences in plain words. Report rates or medians, not raw counts for small groups."
      },
      {
        "k": "not",
        "t": "area",
        "l": "What it does not show",
        "h": "Missing fields, unrecorded groups, gaps in time, differences the data cannot explain."
      },
      {
        "k": "baseline",
        "t": "text",
        "l": "The baseline you will measure change against",
        "h": "A period and a measure. If there is no baseline yet, say so."
      },
      {
        "k": "checks",
        "t": "chips",
        "l": "Evidence checks done",
        "opts": [
          "Denominator stated",
          "Baseline period stated",
          "Small groups protected",
          "Missing data named",
          "No target invented",
          "Someone else has looked at the numbers"
        ]
      }
    ]
  },
  {
    "id": "decision",
    "title": "Tie it to a decision with an owner",
    "short": "The change, who owns it, when it is reviewed",
    "lead": "Every structural insight ends here: a specific change to a specific decision, with a named owner, a review date, and a way for staff and communities to hear what happened.",
    "example": "Made-up: Change: drop the notarization requirement and accept the same identity documents used at first contact. Owner: forms and policy lead for the intake unit. Review: 90 days after the form update, comparing median decision time by language against the baseline. Report back: the One DSD Team summary and the intake staff meeting.",
    "fields": [
      {
        "k": "route",
        "t": "radio",
        "l": "Where this belongs",
        "opts": [
          [
            "equity",
            "A systemic pattern: it belongs in the equity practice with a process owner"
          ],
          [
            "hr",
            "Individual conduct: it belongs in a confidential HR channel, not in this record"
          ],
          [
            "tribal",
            "Tribal government relationship: it goes through the government-to-government route, not this tool"
          ],
          [
            "both",
            "A pattern with an individual element: the pattern stays here; the individual element goes to HR separately"
          ]
        ]
      },
      {
        "k": "finding",
        "t": "area",
        "l": "The finding, in one or two sentences",
        "h": "Pattern, stage, what is treated as fixed, and what the evidence supports."
      },
      {
        "k": "change",
        "t": "area",
        "l": "The change to the decision or process",
        "h": "Something a person can do, in the form, document or process the program already uses: a form, the notice, the review step, the position description, the contract."
      },
      {
        "k": "ownerRole",
        "t": "text",
        "l": "Owner (role, not name)",
        "h": "The role responsible for putting the change into practice. The Equity and Inclusion Operations Consultant provides guidance and feedback."
      },
      {
        "k": "review",
        "t": "date",
        "l": "Review date"
      },
      {
        "k": "measure",
        "t": "text",
        "l": "What you will look at on the review date",
        "h": "The same measure as the baseline in Step 7."
      },
      {
        "k": "engage",
        "t": "area",
        "l": "Who was consulted before the decision was fixed",
        "h": "Staff, community partners, people who use the service. Say whether they were informed, consulted or involved in the design, and whether participants were compensated."
      },
      {
        "k": "reportback",
        "t": "area",
        "l": "How staff and communities will hear what changed, and what could not change and why"
      },
      {
        "k": "support",
        "t": "text",
        "l": "Support requested from the Equity and Inclusion Operations Consultant",
        "h": "Optional. Coaching, data help, a facilitated conversation, a connection to another office.",
        "optional": true
      }
    ]
  }
];

export const STRUCTURAL_GUIDANCE: Record<StructuralStepId,StructuralGuidance> = {
  "pattern": {
    "why": "Begin with a pattern in a process or decision. Describe how the process works before considering explanations.",
    "do": [
      "Name the process the way staff do.",
      "Write what happens, not why you think it happens.",
      "Pick groups only if the evidence shows them. 'Not yet known' is a fine answer here."
    ],
    "flag": "If the concern is about one person’s conduct, use the appropriate confidential HR channel. Keep personnel, client, case and complaint details out of this working record."
  },
  "points": {
    "why": "Patterns live at specific stages. Mapping the stages shows where to look instead of arguing about the whole process.",
    "do": [
      "Three to seven stages is usually enough.",
      "'Missing' matters most: people who never reach a stage are invisible in the stage's data.",
      "If you do not know who decides at a stage, write that down. It is a finding."
    ]
  },
  "fixed": {
    "why": "Approval bottlenecks, diffuse decision rights, credential gatekeeping and data built for billing are choices someone made. Naming who made them shows who can remake them.",
    "do": [
      "Separate what law requires from what local practice added.",
      "'Not sure' is honest. Find out before Step 8.",
      "Ask what each item does to the groups from Step 1, not whether it is reasonable in general."
    ]
  },
  "power": {
    "why": "Positional power is about roles, not personalities. Who can stop a process, who can only wait, and who is never asked.",
    "do": [
      "List roles, never names.",
      "Include roles that can delay but not approve. They shape outcomes too.",
      "Diffuse decision rights are one of the most common structural causes of delay."
    ]
  },
  "intersect": {
    "why": "Two queues that each work fine can still fail the person who needs both. Intersectionality means looking at those meeting points.",
    "do": [
      "Describe combinations in words.",
      "Protect small groups: report a pattern, not a count, when numbers are low.",
      "Do not guess at identities the data does not record."
    ]
  },
  "history": {
    "why": "Knowing why a rule exists prevents repeating an old fight and shows what a change has to answer.",
    "do": [
      "Stalled attempts are evidence, not failures.",
      "Note what staff and communities were told after past attempts. Silence is part of the history.",
      "Cite documents and roles, not individuals."
    ]
  },
  "evidence": {
    "why": "Disaggregated data with denominators and baselines turns an impression into a finding. Saying what the data cannot show keeps the finding honest.",
    "do": [
      "Rates and medians, not raw counts for small groups.",
      "Name missing fields. 'Disability is not recorded' is a finding about the system.",
      "Never invent a target. The review date compares against the baseline, not a number someone wished for."
    ],
    "flag": "If you cannot state a denominator, the finding is a hypothesis. Say so in Step 8."
  },
  "decision": {
    "why": "An insight without an owner and a date is a slogan. This step turns the analysis into something the organization can be held to.",
    "do": [
      "Build the change into a form, notice, policy or process the program already uses.",
      "The process owner decides and carries out the change. The Equity and Inclusion Operations Consultant leads the program and provides guidance, knowledge and feedback.",
      "Close the loop: say how people will hear what changed, and what could not change and why."
    ],
    "flag": "Tribal consultation is a separate government-to-government route. Do not route it through this record."
  }
};
