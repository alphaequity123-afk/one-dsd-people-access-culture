# Brief: narrated branching trainings, built from the corpus

Owner-approved plan (2026-11-15). Read this whole file before writing anything.

## What a training is

A video course where a facilitator is the on-screen narrator. The learner moves through short concept segments,
then a workplace simulation where choices change what happens next. There are no scores. Each choice carries
three hidden measures (openness to learning, relationship trust, team engagement: low/medium/high) that are never
shown; they only decide which consequence the learner sees. Weaker choices get a second chance (a recovery
decision) rather than a dead end.

Every topic has **one all-staff version** and **job-family versions**. The concept segments, reflection, action
plan and facilitator material are shared. Each version has its own simulation set in that family's real work.

Format: `lib/trainings/schema.ts` (read it; every field is checked). Captions, transcript and decision map are
generated from the file, so do not write them.

Check every file you write and fix every problem until it prints ok:

    node scripts/trainings/check.ts data/trainings/<file>.json
    node scripts/trainings/check.ts --simulation data/trainings/drafts/<file>.json

## Coaching feedback: the six styles

- `affirm-extend`: name what the strong choice did well and what to build on.
- `compare-coach`: set the choice beside a stronger one and say what differs.
- `normalize-reframe`: say the reaction is common and why, then reframe it.
- `reflective-prompt`: one question that turns the learner to their own practice.
- `feed-forward`: one concrete thing to try next time, often with example words.
- `another-perspective`: how the same moment looks to someone else in the scene.

Every choice gets two to four of these. Every main decision has one strong choice (learning "high") with
`affirm-extend`. Write it as coaching, colleague to colleague, never as grading ("correct", "wrong", "score").

## Source rule: the corpus only

The subject matter comes only from the source readings for the topic (for Cultural Humility:
`data/trainings/sources/cultural-humility.json`, 29 records from 7 readings). Definitions, models, distinctions,
research and examples must be ones those readings contain; name the reading's slug in `sources` for each segment
and simulation. Do not bring in models from elsewhere (for example "Listen, Explore, Validate, Adapt" is not in
the corpus; do not use it unless a reading has it). The course design above is the only thing taken from outside.

**MMB's Leading with DEIA (also written DEAI) is held aside**: the owner is reviewing it first. Do not use, quote,
cite or paraphrase it, including the MMB Leadership Learning Hub page on cultural awareness, competence and humility.

## Job families (the versions)

From `data/workforce/dhs-workforce-and-job-competencies.txt`, sections 4 and 6. Each family's simulation must be
set in that family's real work at DHS, not a renamed generic meeting:

| id | Family | Typical roles | Work a scenario can be set in |
|---|---|---|---|
| executive | Executive leadership | Commissioner, deputies, assistant commissioners, inspector general | Setting direction, a budget or legislative proposal, consultation with Tribal Nations, public accountability |
| managers | Managers and directors | Human Services Manager 1 to 5, division directors | Running a statewide program, turning legislative requirements into services, staffing and budget choices |
| supervisors | Supervisors | Human Services Supervisor, program supervisors | One-to-ones, team meetings, feedback, assigning work, a team member's concern |
| policy-program | Policy and program professionals | Program Representative, Specialist, Consultant | Drafting a policy or bulletin, a stakeholder workgroup, county and lead-agency guidance |
| licensing-integrity | Licensing, investigations, program integrity | Licensors, investigators, auditors, background studies | A licensing visit, an interview, a correction order, a provider's or family's account |
| eligibility-public | Eligibility and direct public service | Eligibility operations, medical review, call lines | A call or an application, notices, a person who needs language help, a denial |
| data-research | Data, research and evaluation | Management Analyst, research and evaluation | Choosing categories, reporting disaggregated data, interpreting results with communities |
| finance-contracts | Finance, contracts and grants | Budget, accounting, contract and grant managers | A grant solicitation, scoring proposals, contract requirements for small community organizations |
| enterprise-services | Enterprise professional services | Legal, appeals, HR, equity, communications, training | An appeal hearing, an HR investigation or hiring panel, a public message, a training design |
| admin-support | Administrative and technical support | Office and Administrative Specialist, Customer Service Specialist | Front desk and phone contact, scheduling, arranging interpreters and accommodations, records |

Earlier DSD work names what each kind of role does (One DSD `lib/content/work-learning.ts`), for example
policy: "Examine who benefits from a rule, where it creates burden, and what evidence could support a better
alternative." Use these as grounding for what each family's work involves.

The all-staff version is `foundational`. Family versions are `intermediate` unless the source depth calls for advanced.

## The owner's wording rules (the checker enforces most)

- Never "AI" or "tutor".
- The narrator speaks to the learner as "you". No program voice: no "we", "us", "our" outside quoted dialogue.
- "the person or area responsible", never "the appropriate office" or similar.
- No notices about the system or about taking part: nothing about voluntary, optional, self-paced, saved, credit.
  Readers are colleagues; minimal instruction.
- Use People, Access and Culture wording; no DEI, DEIA or DEAI.
- No real staff names and no character names: people are described by role and played by the cast (see below).
- Never infer a person's beliefs, needs, communication style or ability from a group they belong to. Scenarios
  model asking the person, not assuming. A community member raising a concern is never a stereotype.
- Disability: person-centered practice and informed choice, as the corpus frames them.
- Plain, warm, professional. Grade 9 to 11 for narration. Short sentences for speaking aloud.
- Not compliance training. People come to learn, grow and apply equity in their own work.

## Length

All-staff course about 45 to 60 minutes: shared segments about 30 to 35 minutes of narration (about 130 words a
minute when spoken), simulation about 15 minutes. Each family simulation about 12 to 15 minutes: three main
decisions with four choices each, at least one recovery decision, distinct consequences per choice.

## The recurring cast (owner decision 2026-11-15)

Eight people appear as standalone full-body figures on white slides, in the style of The Water We Swim In video
(white background, small caps "PEOPLE, ACCESS AND CULTURE" label, dark blue title, one to three short points on
the left, one figure standing on the right). Portraits: `public/images/learning-guides/C1.png` to `C8.png`.

| id | Figure |
|---|---|
| C1 | man, sage shirt, glasses |
| C2 | woman, coral blouse, locs |
| C3 | woman, white blouse, curly hair |
| C4 | man, navy polo |
| C5 | woman, royal blue blouse |
| C6 | man, maroon polo |
| C7 | man, olive shirt, hair tied back |
| C8 | woman, mauve hijab |

**The cast plays everyone**: the two hosts, the coaching voice, and every person in the scenarios.

**No character names, anywhere** (narration, dialogue, consequences, feedback, facilitator material, and the
readings' own practice stories). Describe each person by role: "a newer team member", "the caller", "her son",
"the provider", "your supervisor", "a county representative", "the panel's second reviewer". In dialogue, people
address each other without names. The checker rejects names used in earlier drafts.

**Hosts for Cultural Humility: C8 and C6.** Every segment scene has a `figure`: the host presenting it (alternate
C8 and C6 by segment), or the cast member playing a person the scene describes.

**Version introductions** (`intro_by`, assigned for an even rotation; do not change):
all-staff C8 · executive C2 · managers C5 · supervisors C7 · policy-program C3 · licensing-integrity C1 ·
eligibility-public C4 · data-research C6 · finance-contracts C8 · enterprise-services C1 · admin-support C5.
`intro` is two to four spoken sentences from that cast member, in the first person singular, connecting the
version to the family's work ("If you supervise a team, ...").

**Casting the scenario roles (`cast`)**: list everyone in the scenario with a role id, the label the text uses,
and a portrait. Rules:
- Never cast a role whose trait matches a common stereotype of how the cast member looks. In particular: a quiet
  or reserved person is not C5; a person who needs an interpreter or speaks with an accent is not C5, C6 or C8;
  an angry, defensive or "difficult" person is not C1 or C2; a person who voices a stereotype is not always the
  same kind of figure across versions.
- Spread authority: decision-makers, supervisors and executives are cast across all eight, not mostly C4 or C3.
- In each scenario, a member of the public or community partner, and the colleague who errs, are played by
  different kinds of figures across the eleven versions.
- The learner ("you") is not cast.
