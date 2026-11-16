export type PlanWorkArea = { code: string; title: string; summary: string; owner: string; goals: number[]; resource: { href: string; label: string } };
export type PlanQuarter = { number: number; title: string; items: { area: string; action: string; owner: string; evidence: string }[] };
export type PlanPhase = { year: number; title: string; summary: string; quarters: PlanQuarter[]; consultantSupport: string[]; checkpoint: string[] };
export type DsdThreeYearPlan = {
  title: string; version: string; sourceTitle: string; sourceHref: string; downloadHref: string;
  purpose: string; timeline: string; ownership: string;
  roles: { role: string; responsibility: string }[]; success: string[]; groundRules: string[];
  rhythms: { title: string; participants: string; purpose: string }[];
  workAreas: PlanWorkArea[]; phases: PlanPhase[]; measurementIntroduction: string;
  measurements: { area: string; year1: string; year2: string; year3: string }[];
  needs: { need: string; year1: string; year2: string; year3: string }[];
  risks: { risk: string; response: string }[]; approvalDecisions: string[]; sourceBasis: string[];
};

/** Program presentation adapted from the supplied plan; original wording remains in the download. */
export const dsdThreeYearPlan: DsdThreeYearPlan = {
  "title": "Three-year plan",
  "version": "1.1",
  "sourceTitle": "Three-year plan, in plain language",
  "sourceHref": "/one-dsd/evidence/source/three-year-plan",
  "downloadHref": "/documents/program-evidence/one-dsd-three-year-plan.txt",
  "purpose": "This plan explains how the Disability Services Division will make fairness, access and belonging part of everyday work over the next three years. It uses the One DHS and One DSD People, Access and Culture program, the Department of Human Services (DHS) Equity Policy, the six equity goals of the Aging and Disability Services Administration (ADSA), and the equity review tools DSD already has.",
  "timeline": "There are no calendar dates in this plan. \"Year 1, Quarter 1\" means the first three months after leaders approve the plan. Each year ends with a checkpoint. We move on to the next year when the checklist for that checkpoint is done and leaders agree, not because a date has passed. If something takes longer, we say so in the quarterly report.",
  "ownership": "The Equity and Inclusion Operations Consultant leads the program and guides its development. Leaders, goal leads, units, and named contacts carry out the decisions and services they own. The consultant advises, coaches, and connects people with resources and with each other.",
  "roles": [
    {
      "role": "DSD leaders (the Division Director, the Manager and unit leads)",
      "responsibility": "Support implementation. Name an owner for every goal and area of work, give owners time to do it, make decisions, review the quarterly report, and use checkpoint reviews to set priorities."
    },
    {
      "role": "Goal leads (one for each of the six ADSA goals)",
      "responsibility": "Own the work for their goal. Set the steps, do the work with their colleagues, report progress each quarter and raise problems."
    },
    {
      "role": "Unit leads and the people who write decisions",
      "responsibility": "Do the equity review for the decisions, policies and services they own, and carry out what the review recommends."
    },
    {
      "role": "Named contacts (upkeep, support, accessibility, records, data)",
      "responsibility": "Keep the program accurate and easy to use, answer help requests, keep records and provide the numbers for the quarterly report."
    },
    {
      "role": "One DSD Team (the staff volunteer equity group)",
      "responsibility": "Bring staff voices in, review certain decisions before they are final, run Open Hours, and write their own section of every quarterly report."
    },
    {
      "role": "Equity and Inclusion Operations Consultant",
      "responsibility": "Leads the program. Advises and coaches, helps people use the program and the equity review tools, connects people to the right resources and offices, shares what is working across units, and helps pull the quarterly report together from what owners send."
    }
  ],
  "success": [
    "Every decision with lasting effects gets an equity review by the people who own it, and the people affected were heard before the decision was made.",
    "The One DSD Team is a normal part of how decisions are made, not a side project.",
    "Every goal and area of work has an owner who does it as part of their job.",
    "We report our progress every quarter, and at least one important gap between groups has gotten smaller.",
    "The program has named people and a budget to keep it going.",
    "We have shared a public summary of what we did, what worked and what did not."
  ],
  "groundRules": [
    "The consultant leads the program. Owners carry out the work for their goals, decisions, and services. Leaders address gaps in implementation responsibility and make sure owners have the support they need.",
    "Checkpoint reviews guide priorities for the next phase. Delays are reported in the quarterly report.",
    "No counts of learning or use. Evidence is what people choose to record or share: decisions, plans, reviews and before-and-after work. No one is rated, scored or tracked, and the program keeps no personnel records.",
    "Using the program is a choice. The Equity Policy is not. Staff choose whether to use the program's resources. The DHS rule that certain decisions get an equity review first applies to everyone.",
    "Start small. Get the basic tools working well before adding new ones.",
    "Write it down. Changes only last if they are written into roles, routines, job expectations and contracts.",
    "Stay in step with DHS. DHS is still reviewing its own equity work. When it shares results, we adjust at the next checkpoint instead of stopping."
  ],
  "rhythms": [
    {
      "title": "Leaders' review (monthly in Year 1, then at least every three months)",
      "participants": "DSD leaders and goal leads; the consultant attends to advise",
      "purpose": "Make decisions, solve problems, check progress, reassign work that has no owner."
    },
    {
      "title": "One DSD Team meeting (monthly) and Open Hours (at least monthly)",
      "participants": "The Team and any staff who want to join; the consultant supports when asked",
      "purpose": "Review decisions, work on Team projects, answer staff questions."
    },
    {
      "title": "Quarterly report",
      "participants": "Each goal lead and named contact sends their update and numbers; the Team writes its section; the consultant helps put it together; leaders review and sign",
      "purpose": "One place to see all of DSD's equity work. It also goes to the ADSA Equity Director."
    },
    {
      "title": "Equity review before key decisions",
      "participants": "The people who own the decision do the review; the consultant coaches if asked",
      "purpose": "Applies to new or changed policies, larger contracts, hiring plans for supervisors and above, changes to how the public reaches us, and changes to waivers, guidance, rates, licensing rules, assessments and county or Tribal agency processes."
    },
    {
      "title": "End-of-year checkpoint",
      "participants": "DSD leaders, with goal leads and the Team present",
      "purpose": "Confirm the year's work is done and agree on the next year's priorities."
    }
  ],
  "workAreas": [
    {
      "code": "A",
      "title": "Keeping the program running",
      "summary": "Making sure the program's pages, links, downloads and learning are accurate and easy for everyone to use, including people using assistive technology.",
      "owner": "Named upkeep, support, accessibility and records contacts",
      "goals": [
        4,
        6
      ],
      "resource": {
        "href": "/library",
        "label": "Learning and resources"
      }
    },
    {
      "code": "B",
      "title": "Leadership and the One DSD Team",
      "summary": "The leaders' group, the Team, who decides what, the equity review rule, and a single list of all DSD equity work.",
      "owner": "DSD leaders, with the Team",
      "goals": [
        1,
        2
      ],
      "resource": {
        "href": "/one-dsd/team",
        "label": "One DSD Team"
      }
    },
    {
      "code": "C",
      "title": "Equity reviews",
      "summary": "Using the two DSD equity review tools on real decisions, practice sessions, and a record of every review done.",
      "owner": "Goal 1 lead, and each unit for its own decisions",
      "goals": [
        1,
        5
      ],
      "resource": {
        "href": "/learn/equity-toolkit",
        "label": "Equity Analysis Toolkit"
      }
    },
    {
      "code": "D",
      "title": "Learning",
      "summary": "Basic learning for everyone, hands-on learning for supervisors and teams, and deeper learning for leaders.",
      "owner": "Goal 4 lead, with supervisors",
      "goals": [
        4
      ],
      "resource": {
        "href": "/learn",
        "label": "Explore learning"
      }
    },
    {
      "code": "E",
      "title": "Hiring and keeping staff",
      "summary": "Fair job descriptions and hiring, conversations with staff about why they stay, mentoring and clear paths to move up.",
      "owner": "Goal 3 lead, with Human Resources",
      "goals": [
        3
      ],
      "resource": {
        "href": "/one-dsd/leadership",
        "label": "Leadership development"
      }
    },
    {
      "code": "F",
      "title": "Workplace culture",
      "summary": "Staff surveys, listening sessions, a clear way to raise concerns, and Amplify Equity gatherings.",
      "owner": "One DSD Team, with Human Resources and unit leads",
      "goals": [
        3,
        4
      ],
      "resource": {
        "href": "/one-dsd/amplify",
        "label": "Amplify Equity"
      }
    },
    {
      "code": "G",
      "title": "Access and fair services",
      "summary": "Fixing barriers in our materials and processes, plain language, interpreters and translation, and watching for gaps in who our services reach.",
      "owner": "Goal 6 lead, with the accessibility contact and program owners",
      "goals": [
        6,
        1
      ],
      "resource": {
        "href": "/practice-guides/clearer-processes",
        "label": "Make a process easier to use"
      }
    },
    {
      "code": "H",
      "title": "Working with communities",
      "summary": "A standard for when and how we ask people for input, paying people for their time, working with Tribal Nations, telling people what we did with their input, and equity in contracts.",
      "owner": "Goal 2 lead; Goal 5 lead for contracts",
      "goals": [
        2,
        5
      ],
      "resource": {
        "href": "/minnesota-communities",
        "label": "Minnesota Communities"
      }
    },
    {
      "code": "I",
      "title": "Measuring and reporting",
      "summary": "The quarterly report, starting numbers, fixing what is off track and a public summary.",
      "owner": "DSD leaders, with the data contact",
      "goals": [
        1
      ],
      "resource": {
        "href": "/program/progress",
        "label": "Review what is changing"
      }
    }
  ],
  "phases": [
    {
      "year": 1,
      "title": "Build the base",
      "summary": "Year 1 is about getting set up: naming owners, making key decisions, forming the Team, making sure the program works, starting equity reviews, getting starting numbers, offering basic learning and delivering the first full quarterly report. Leaders name implementation owners for every goal and area of work, with clear responsibilities and support.",
      "quarters": [
        {
          "number": 1,
          "title": "Name owners and get started",
          "items": [
            {
              "area": "B",
              "action": "Leaders name a lead for each of the six goals and an owner for each area of work, with time set aside. Leaders' group formed.",
              "owner": "Leaders",
              "evidence": "Owners named"
            },
            {
              "area": "B",
              "action": "Leaders settle four open questions: how help requests are answered and covered, how long records are kept, who maintains and supports the program, and who owns the communication plan.",
              "owner": "Leaders",
              "evidence": "Decisions made"
            },
            {
              "area": "B",
              "action": "Staff are told the Team's purpose and goals before being surveyed. The Team is formed, including members with lived experience of disability.",
              "owner": "Leaders and the Team",
              "evidence": "Team formed"
            },
            {
              "area": "A",
              "action": "The core parts of the program are checked: every page, link and download works.",
              "owner": "Upkeep and accessibility contacts",
              "evidence": "Program checks passed"
            },
            {
              "area": "C",
              "action": "Both equity review tools put into use. A record of reviews started. The review rule drafted.",
              "owner": "Goal 1 lead and leaders",
              "evidence": "Reviews started"
            },
            {
              "area": "D",
              "action": "Basic learning offered to all staff.",
              "owner": "Goal 4 lead and supervisors",
              "evidence": "Learning offered; plans for applying it"
            },
            {
              "area": "I",
              "action": "The quarterly report's layout and measures agreed. First requests for numbers sent to the ADSA Equity Director.",
              "owner": "Leaders and data contact",
              "evidence": "Number requests sent"
            }
          ]
        },
        {
          "number": 2,
          "title": "Start the review rule",
          "items": [
            {
              "area": "B",
              "action": "The rule that key decisions get an equity review first takes effect. The Team reviews these decisions too.",
              "owner": "Leaders",
              "evidence": "Share of decisions with a review"
            },
            {
              "area": "C",
              "action": "Monthly practice sessions using real DSD decisions, run by goal leads. The units that own the decisions record their first ten reviews in the decision log.",
              "owner": "Goal 1 lead and unit leads",
              "evidence": "Reviews recorded in the decision log"
            },
            {
              "area": "B",
              "action": "A single list of all DSD equity work started, with an owner for each item.",
              "owner": "Leaders and the Team",
              "evidence": "Items on the list"
            },
            {
              "area": "E",
              "action": "Review of job descriptions and hiring steps begins.",
              "owner": "Goal 3 lead and Human Resources",
              "evidence": "Job descriptions reviewed"
            },
            {
              "area": "G",
              "action": "Check of DSD's public materials and the program for barriers. A list of fixes started, each with an owner.",
              "owner": "Goal 6 lead and accessibility contact",
              "evidence": "Barriers found and fixed"
            },
            {
              "area": "H",
              "action": "A standard for asking people for input drafted, including paying them. Tribal consultation steps confirmed with the DHS Tribal Liaison.",
              "owner": "Goal 2 lead",
              "evidence": "Standard approved"
            },
            {
              "area": "I",
              "action": "Starting numbers gathered. Missing numbers listed, each with someone responsible.",
              "owner": "Data contact",
              "evidence": "Starting numbers in place"
            }
          ]
        },
        {
          "number": 3,
          "title": "Listen and report",
          "items": [
            {
              "area": "I",
              "action": "First full quarterly report delivered to leaders and the ADSA Equity Director, built from each owner's update, with the Team's section.",
              "owner": "Leaders, goal leads and the Team",
              "evidence": "Report on time"
            },
            {
              "area": "F",
              "action": "Staff survey designed. Listening sessions held. A clear way to raise concerns about bias, exclusion or access agreed.",
              "owner": "The Team and Human Resources",
              "evidence": "Themes shared back with staff"
            },
            {
              "area": "D",
              "action": "Learning group for supervisors and hiring managers begins.",
              "owner": "Goal 4 lead",
              "evidence": "Plans for applying it, shared by the group"
            },
            {
              "area": "H",
              "action": "First \"you said, we did\" summary shared with staff. Input standard approved.",
              "owner": "The Team and Goal 2 lead",
              "evidence": "Summaries shared"
            },
            {
              "area": "G",
              "action": "Plain-language and interpreter standards approved for DSD public materials.",
              "owner": "Goal 6 lead",
              "evidence": "Materials meeting the standard"
            },
            {
              "area": "C",
              "action": "The disability services review tool used on at least one waiver change, guidance document or rate change before it goes public.",
              "owner": "Waiver policy lead",
              "evidence": "Reviews recorded in the decision log"
            }
          ]
        },
        {
          "number": 4,
          "title": "Checkpoint",
          "items": [
            {
              "area": "F",
              "action": "Survey results shared (totals only). Priorities set.",
              "owner": "The Team and Human Resources",
              "evidence": "Belonging and trust results"
            },
            {
              "area": "I",
              "action": "Review the DSD equity action plan, with owners and check-in points.",
              "owner": "Leaders",
              "evidence": "Plan reviewed"
            },
            {
              "area": "B",
              "action": "Equity expectations drafted for leaders' and managers' performance plans.",
              "owner": "Leaders and Human Resources",
              "evidence": "Leaders with expectations"
            },
            {
              "area": "A",
              "action": "Regular upkeep of the program in place: checks every quarter, records kept, help requests tracked.",
              "owner": "Upkeep, support and records contacts",
              "evidence": "Checks done"
            },
            {
              "area": "I",
              "action": "End-of-year checkpoint review. Adjust to any new DHS results.",
              "owner": "Leaders, goal leads and the Team",
              "evidence": "Checklist items done"
            }
          ]
        }
      ],
      "consultantSupport": [
        "Helps leaders think through who should own each goal and area, and what time each owner needs.",
        "Coaches goal leads as they plan their first steps, and helps them use the program's resources.",
        "Shows people how to use the equity review tools, and sits in on early practice sessions when invited.",
        "Connects owners with the people or areas responsible (Human Resources, the Tribal Liaison, accessibility, legal, contracts).",
        "Helps the One DSD Team get started when asked.",
        "Helps pull the first quarterly report together from what owners send."
      ],
      "checkpoint": [
        "Every goal and area of work has a named implementation owner.",
        "The leaders' group and the Team are formed and meeting.",
        "The list of all DSD equity work is complete.",
        "Starting numbers on equity and access are in place.",
        "Basic learning is available to all staff.",
        "The quarterly report is in use, and at least one full report has been delivered.",
        "The communication plan is working.",
        "The DSD action plan has been reviewed with owners.",
        "The equity review rule is in effect, with a record of reviews done by the units that own the decisions."
      ]
    },
    {
      "year": 2,
      "title": "Make it part of normal work",
      "summary": "Year 2 builds equity into how DSD already works: performance plans, leadership growth, hands-on learning, better numbers, working with communities and the steps we follow for contracts and policy. Owners need less coaching as they gain experience, and more people across DSD can help their colleagues.",
      "quarters": [
        {
          "number": 1,
          "title": "Into everyday processes",
          "items": [
            {
              "area": "B",
              "action": "Equity expectations added to leaders' and managers' performance plans. A clear process for fixing goals that are off track or gaps that get worse.",
              "owner": "Leaders and Human Resources",
              "evidence": "Leaders with expectations; fixes made"
            },
            {
              "area": "C",
              "action": "Every unit does its own equity reviews routinely. A few experienced staff in each unit help their colleagues.",
              "owner": "Goal 1 lead and unit leads",
              "evidence": "Reviews done by the owning unit"
            },
            {
              "area": "H",
              "action": "Equity and access checks and contract wording added to DSD contract and grant templates, after checking with ADSA contracts staff and legal.",
              "owner": "Goal 5 lead",
              "evidence": "Contracts with equity terms"
            },
            {
              "area": "D",
              "action": "Learning about working across cultures and hands-on courses offered and applied to real work.",
              "owner": "Goal 4 lead",
              "evidence": "Learning put into practice"
            },
            {
              "area": "I",
              "action": "Quarterly report expanded to cover staff, access, services, community and workplace culture, broken down by group where possible.",
              "owner": "Leaders and data contact",
              "evidence": "New measures in use"
            }
          ]
        },
        {
          "number": 2,
          "title": "Staff and voice",
          "items": [
            {
              "area": "E",
              "action": "Amplify Equity mentoring running. Conversations with staff about why they stay, shared as totals. Paths to move up written down.",
              "owner": "Goal 3 lead and the Team",
              "evidence": "Paths written down; staff staying"
            },
            {
              "area": "F",
              "action": "Second staff survey or short check-in. Concern process tested. Amplify Equity gatherings on a regular schedule.",
              "owner": "The Team and Human Resources",
              "evidence": "Change since last survey"
            },
            {
              "area": "G",
              "action": "A way to see gaps in who DSD services reach, with warning signs agreed by leaders.",
              "owner": "Goal 6 lead and data contact",
              "evidence": "Warning signs set"
            },
            {
              "area": "H",
              "action": "A way to pay community members who advise.",
              "owner": "Goal 2 lead",
              "evidence": "People paid for their time"
            }
          ]
        },
        {
          "number": 3,
          "title": "Deeper partnerships",
          "items": [
            {
              "area": "H",
              "action": "An advisory group with people who use DSD services, families and community and disability organizations. Formal Tribal consultation used on at least one decision.",
              "owner": "Goal 2 lead",
              "evidence": "Advisory members; input acted on"
            },
            {
              "area": "C",
              "action": "The disability services review tool used through a full waiver change, with the review sent to the federal government along with the change.",
              "owner": "Waiver policy lead",
              "evidence": "Reviews attached"
            },
            {
              "area": "G",
              "action": "Most fixes to DSD public materials done. Interpreter and translation steps used routinely, with timeliness tracked.",
              "owner": "Goal 6 lead",
              "evidence": "Fixes done; timeliness"
            },
            {
              "area": "D",
              "action": "Learning group for division and unit leaders: fair decision-making, handling conflict, reading equity numbers.",
              "owner": "Goal 4 lead",
              "evidence": "Before-and-after decisions shared by leaders"
            },
            {
              "area": "A",
              "action": "Review of the program: what is offered, what people applied in their work and what helped. Results used to improve it.",
              "owner": "Upkeep contacts, with the Team",
              "evidence": "Improvements made"
            }
          ]
        },
        {
          "number": 4,
          "title": "Checkpoint",
          "items": [
            {
              "area": "I",
              "action": "Year-two report shared with staff and partners in accessible formats.",
              "owner": "Leaders, goal leads and the Team",
              "evidence": "Report shared"
            },
            {
              "area": "B",
              "action": "List of all equity work updated; repeated or stalled work stopped.",
              "owner": "Leaders and the Team",
              "evidence": "List up to date"
            },
            {
              "area": "I",
              "action": "End-of-year checkpoint review. Year 3 priorities set.",
              "owner": "Leaders, goal leads and the Team",
              "evidence": "Checklist items done"
            }
          ]
        }
      ],
      "consultantSupport": [
        "Coaches owners on harder questions, rather than routine ones.",
        "Helps experienced staff in each unit become the people their colleagues turn to.",
        "Helps leaders read the expanded numbers and decide what to do about them.",
        "Shares what is working in one unit with others.",
        "Connects goal leads with ADSA and DHS partners."
      ],
      "checkpoint": [
        "Equity expectations are in performance plans where adopted.",
        "Mentoring and leadership learning are running.",
        "Hands-on learning is available and applied in real work.",
        "The expanded quarterly report and warning signs are working.",
        "The advisory group and the way to pay community members are in place.",
        "Equity and access checks are part of contracts, policy, communications and planning.",
        "Every unit does its own equity reviews as a normal part of its work."
      ]
    },
    {
      "year": 3,
      "title": "Make it last",
      "summary": "Year 3 makes the work permanent and shows results. Leaders name the staff, budget and systems needed long term. Equity becomes part of job descriptions and procedures. We check whether community input changed decisions, share a public summary and plan what comes next. By now the work is spread across many people, so it does not depend on any one person or role.",
      "quarters": [
        {
          "number": 1,
          "title": "Make it permanent",
          "items": [
            {
              "area": "B",
              "action": "A long-term plan for staff, leadership, budget, numbers, learning and technology. Funded, or raised with ADSA if not.",
              "owner": "Leaders",
              "evidence": "Plan reviewed; funding"
            },
            {
              "area": "A",
              "action": "Program upkeep, support, accessibility and records written into the job descriptions of the named contacts. Backup owners named for each goal and for Team leadership.",
              "owner": "Leaders",
              "evidence": "Duties assigned"
            },
            {
              "area": "C",
              "action": "Every DSD unit has a current equity action plan. Unit leads check their reviews every quarter.",
              "owner": "Unit leads",
              "evidence": "Units with plans"
            },
            {
              "area": "I",
              "action": "Numbers on services, staff and workplace culture reported over time. Progress on at least one key gap reviewed.",
              "owner": "Leaders and data contact",
              "evidence": "Key gap trend"
            }
          ]
        },
        {
          "number": 2,
          "title": "Community results",
          "items": [
            {
              "area": "H",
              "action": "Check whether community input changed DSD services, policies or spending. Results shared with the communities involved.",
              "owner": "Goal 2 lead and the Team",
              "evidence": "Input acted on; community views"
            },
            {
              "area": "H",
              "action": "People who use services, families, Tribal Nations and community groups help redesign at least one service.",
              "owner": "Goal 2 lead and the program owner",
              "evidence": "Shared design projects"
            },
            {
              "area": "G",
              "action": "A warning sign leads to a fix, and the fix is finished.",
              "owner": "Leaders and the owner of the area",
              "evidence": "Fixes finished"
            },
            {
              "area": "F",
              "action": "A way to recognize teams and leaders who made lasting improvements, without putting extra work or attention on staff from groups that already carry more.",
              "owner": "Leaders and the Team",
              "evidence": "Recognition"
            }
          ]
        },
        {
          "number": 3,
          "title": "Accountability",
          "items": [
            {
              "area": "I",
              "action": "Public summary shared in accessible formats: what we did, what gaps remain, what we learned, what is next.",
              "owner": "Leaders",
              "evidence": "Summary shared"
            },
            {
              "area": "D",
              "action": "Staff learning groups and champions in each unit help their teams.",
              "owner": "Goal 4 lead",
              "evidence": "Champion-led sessions"
            },
            {
              "area": "C",
              "action": "Equity review tools and guides updated based on three years of use. Real DSD examples, written by the units that did them, added to the program.",
              "owner": "Goal 1 lead and upkeep contacts",
              "evidence": "Tools updated"
            },
            {
              "area": "E",
              "action": "Hiring, promotion and retention numbers checked for gaps between groups. Fixes where gaps remain.",
              "owner": "Goal 3 lead and Human Resources",
              "evidence": "Staff trends; fixes"
            }
          ]
        },
        {
          "number": 4,
          "title": "Plan what comes next",
          "items": [
            {
              "area": "I",
              "action": "Full review of what was done, what changed, what was learned and what is still needed. New starting numbers and goals.",
              "owner": "Leaders, goal leads and the Team",
              "evidence": "Review done"
            },
            {
              "area": "B",
              "action": "Next plan agreed with staff, communities, partners and leaders.",
              "owner": "Leaders",
              "evidence": "Next plan agreed"
            },
            {
              "area": "I",
              "action": "Final checkpoint review.",
              "owner": "Leaders and the Team",
              "evidence": "Checklist items done"
            }
          ]
        }
      ],
      "consultantSupport": [
        "Helps leaders shape the long-term plan and the public summary.",
        "Supports the champions and learning groups in each unit.",
        "Helps capture what DSD has learned so it can be shared with other divisions.",
        "Helps leaders and staff think through what the next plan should focus on."
      ],
      "checkpoint": [
        "Equity is part of planning and performance systems.",
        "There is long-term staffing, leadership, data and budget in place, with owners and backups named.",
        "Key numbers on staff, workplace culture, access, services and partnerships have improved, and we can show it.",
        "The public summary has been shared.",
        "The next plan is agreed."
      ]
    }
  ],
  "measurementIntroduction": "The plan looks for three kinds of signs. Early on, signs the work is happening. Then signs that how DSD works is changing. By Year 3, signs that results are improving. Learning and use of the program are never counted; evidence is what people choose to record or share. No person is named or scored.",
  "measurements": [
    {
      "area": "Leadership",
      "year1": "Owners named for every goal and area; decisions made; Team formed; equity reviews done; share of key decisions with a review",
      "year2": "Leaders with equity expectations; reviews done by the owning unit; fixes started",
      "year3": "Problems solved on time; units with current plans; backup owners named"
    },
    {
      "area": "Hiring and keeping staff",
      "year1": "Job descriptions and hiring steps reviewed; hiring panels using the fair-hiring standard",
      "year2": "Development and mentoring opportunities by group (Human Resources data); hiring results by group where available; what staff say about staying",
      "year3": "Who stays and who moves up, by group; how well staff reflect the communities we serve"
    },
    {
      "area": "Workplace culture",
      "year1": "Learning offered; listening sessions held; concern process in place",
      "year2": "Learning applied on the job (before-and-after examples staff share); survey changes; concerns handled on time",
      "year3": "Belonging, safety to speak up, trust and fairness, by group"
    },
    {
      "area": "Access and language",
      "year1": "Barriers found; standard approved",
      "year2": "Materials meeting the standard; interpreters and translation on time; fixes finished",
      "year3": "Fewer access complaints; requests for accommodations met on time"
    },
    {
      "area": "Fair services",
      "year1": "Key measures chosen; starting numbers; missing numbers listed",
      "year2": "Gaps in who services reach can be seen; warning signs acted on",
      "year3": "Key gaps getting smaller, by race, disability, language and where people live"
    },
    {
      "area": "Working with communities",
      "year1": "Input standard approved; events held; \"you said, we did\" shared",
      "year2": "Decisions with community input before they are final; people paid for their time; advisory group members",
      "year3": "Community suggestions acted on; communities feel heard"
    },
    {
      "area": "Reporting and the program",
      "year1": "Quarterly reports on time; program checks passed; help requests answered",
      "year2": "Expanded report in use; program improved; list of equity work up to date",
      "year3": "Public summary shared; long-term plan funded"
    }
  ],
  "needs": [
    {
      "need": "Owners",
      "year1": "A lead for each goal and an owner for each area, with time set aside in their workload.",
      "year2": "Owners' equity work written into their role expectations.",
      "year3": "Written into job descriptions, with backups named."
    },
    {
      "need": "Named contacts",
      "year1": "Contacts for upkeep, support, accessibility, records and data (an open question from the leadership memo).",
      "year2": "Written into role expectations.",
      "year3": "Written into job descriptions."
    },
    {
      "need": "Consultant",
      "year1": "The consultant leads the program, advises, coaches, and connects implementation owners with support.",
      "year2": "Coaching moves to harder questions and to helping unit champions.",
      "year3": "Supports the long-term plan and the next plan."
    },
    {
      "need": "Numbers",
      "year1": "DSD numbers from the ADSA Equity Director; gaps listed.",
      "year2": "Numbers broken down by group; agreements with Tribal agencies where needed.",
      "year3": "Trends over time; rules for sharing the public summary."
    },
    {
      "need": "Money",
      "year1": "Learning, paying community members, translation, fixing access barriers, hosting the program.",
      "year2": "Mentoring, advisory group, paying community members, finishing fixes.",
      "year3": "Ongoing budget in the long-term plan."
    },
    {
      "need": "DHS",
      "year1": "DHS results may change what we measure; adjust at the Year 1 checkpoint.",
      "year2": "Connect with the DHS equity report where possible.",
      "year3": "Line up with the next DHS plan."
    }
  ],
  "risks": [
    {
      "risk": "Work drifts to the consultant because it is easier to hand off",
      "response": "Every implementation task has a responsible owner. The quarterly report lists owners, and leaders address any gaps in responsibility."
    },
    {
      "risk": "Owners do not have time for the equity work",
      "response": "Leaders set aside time when they name owners and check it at every leaders' review. Equity work goes into role expectations in Year 2."
    },
    {
      "risk": "Staff see the Team as for show only",
      "response": "The Team reviews real decisions before they are final, shares what changed, and writes its own section of every report. Leaders attend."
    },
    {
      "risk": "People skip equity reviews because they take time",
      "response": "Clear rules about which decisions need one; practice first; the quarterly report shows any decision that skipped a review; the disability services tool fits around federal and state timelines."
    },
    {
      "risk": "DHS changes what it wants us to measure",
      "response": "Our measures already line up with DHS's. Adjusting is part of every checkpoint, not a restart."
    },
    {
      "risk": "DSD numbers are not available",
      "response": "Gaps listed with someone responsible; use numbers DSD already has in the meantime; raise it with the ADSA Equity Director."
    },
    {
      "risk": "Leaders change or priorities shift",
      "response": "The work is written into roles, routines, performance plans and contracts, based on the DHS Equity Policy, and spread across many owners. The public summary keeps it visible."
    },
    {
      "risk": "Staff worry survey answers are not private",
      "response": "Anonymous options; totals only; limits explained up front; no personnel records kept."
    }
  ],
  "approvalDecisions": [
    "Name a lead for each of the six goals and an owner for each area of work, and set aside time for them.",
    "Name the contacts for upkeep, support, accessibility, records and data.",
    "Recognize the consultant's program leadership and clarify how leaders, goal leads, units, and named contacts carry out the work.",
    "Decide how help requests are answered and covered, and how long records are kept.",
    "Review the charters for the leaders' group and the One DSD Team, including seats for people with lived experience and the Team's role in reviewing decisions.",
    "Set which contracts and hiring plans need an equity review.",
    "Name who owns the communication plan and when it is first reviewed.",
    "Use checkpoint reviews to guide the next phase, and include delays in the quarterly report."
  ],
  "sourceBasis": [
    "The One DSD People, Access and Culture program guide and the program itself, including its Equity Strategic Framework (six areas, three stages, measures and checklists).",
    "The leadership review memo and its four open questions.",
    "The DSD Equity Implementation Work Plan (its first 18 months are built into Years 1 and 2 here, with ownership moved to goal leads, unit leads and named contacts).",
    "The DHS Equity Policy; the State of Minnesota Equity Analysis Toolkit; ADSA's equity work and six goals; the DHS-wide equity review (Equity Outcome Map); the Crossroads continuum on becoming an anti-racist, multicultural organization.",
    "The two DSD equity review tools and their guides."
  ]
};
