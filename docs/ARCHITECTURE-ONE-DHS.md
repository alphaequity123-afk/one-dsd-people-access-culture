# One DHS People, Access and Culture: program architecture

Owner direction, November 26, 2026 (Gary Banks): One DHS People, Access and Culture is the superstructure. One DSD
People, Access and Culture sits inside it as the fully built model that other DHS equity directors can follow. The
program is multi-year and cyclical, roughly a third built, and may grow to 1,500 courses. Depth stays; volume is
handled with a calm front door over a full, indexed back stack. Nothing is removed without the owner's
item-by-item approval.

The refactor is a clone. The live applications stay exactly as they are; the refactor deploys on its own branch and
its own Railway service, and nothing here is merged into `main` or pointed at the live services.

## Where things run today

| Application | Repository and branch | Railway |
|---|---|---|
| One DSD People, Access and Culture (the large program app, live) | `one-dsd-people-access-culture`, `main` | project `one-dsd-people-access-culture`, service `one-dsd-people-access-culture` |
| One DSD v2 refactor (preview) | `one-dsd-people-access-culture`, `v2-rebuild` | same project, service `one-dsd-pac-v2` |
| One DSD front door (live landing) | `one-dhs-pac`, `dsd/approved-20261121`, `PAC_UNIT=dsd` | project `one-dhs-pac`, service `dsd-web` |
| One DHS People, Access and Culture (live) | `one-dhs-pac`, `main` | project `one-dhs-pac`, service `web` |

`one-dhs-pac` keeps its resource library in its own Postgres (`pgvector` service). Its resource pages (`/r/...`) and
926-organization directory are not reachable from the v2 workspace yet, so v2 links to them on the live site.

## One shared core, scoped layers

The v2 codebase is the shared core. It already reads content in two program scopes (`PAC_STAFF_SCOPE=dsd` and
`one-dhs`), so One DHS and One DSD are one codebase with two views rather than two codebases to merge later.

- **Shared core:** navigation (Home plus Practice, Leadership, Communities, Knowledge), Ask and Search on every page,
  the Equity Analysis Toolkit, courses, community briefs, the Culture Calendar, the leadership program, the program
  charter and the safety gates.
- **DSD layer:** the One DSD Home, DSD programs and scenarios, Disability services in practice, the ADSA goals planner
  and DSD-specific courses, tagged `dsd` in the catalog.
- **Room for other areas:** other administrations add their own resources under their own scope tag. One DHS stays
  light on resources by design.

## Engines

Every item in the program catalog (`lib/program/catalog.ts`) belongs to one engine, so new modules plug in without new
navigation:

1. **Practice:** applied tools, the Equity Analysis Toolkit, guided practices, policies.
2. **Learning:** courses, lessons, readings, the library and audio. Built to grow to 1,500 or more courses.
3. **Leadership:** the six-stage program, the sixteen styles, simulations and leadership courses.
4. **People and Growth:** mentoring, sponsorship, career growth, coaching and team development (`/people-and-growth`).
   This is the next major build wave; today it gathers what already exists.
5. **Communities:** community briefs, organizations, public agencies and the Culture Calendar.

## Tags on every item

- **Scope:** `dsd`, `adsa`, `dhs-wide`, `office-of-employee-culture`. An item can carry more than one.
- **Suggested tier:** `start`, `apply`, `lead`, for progressive disclosure only. Nothing is ever locked behind a tier.
- **Governance:** owner, steward, review cycle and last verified. Role-level defaults live in
  `config/program-governance.json`; an item's own recorded owner and review date come first, and `lastVerified`
  stays empty until someone verifies the item. The program inventory (`/program/inventory`) shows the counts and
  what is due for review.

## Calm front door, deep back stack

- Each pillar page shows a short set of starting points; the full collection stays one step behind it and in Search
  and Ask.
- A quiet role choice under the menu suggests where to begin for the reader's role. It never hides anything, and
  the choice stays in the browser.
- Learning is voluntary and non-credit. Required training stays in the agency's own system.

## Guardrails kept from the owner's earlier decisions

- The live look and feel (cards, colors, fonts) and the warm Home voice. No system or procedural language.
- No icons except the paperclip on upload buttons. Voice buttons are words.
- Source documents, policy wording and citations stay word for word.
- Compliance handoffs: Tribal matters to the Office of Indian Policy or a Tribal liaison, complaints and personnel
  matters to Human Resources or the civil-rights channel, private details kept out of Ask.

## Facts checked against the repository

The Gemini plan's figures were checked rather than copied. This app has 677 published course packs plus 72
self-directed courses (not 633), 42 community briefs (not 46), 304 readings and 569 calendar entries (now shown as
438 observances with every community's note kept). The repository's role list has nine role families, not eleven,
and the DHS Equity Analysis Toolkit in the app uses eight questions; a separate four-question companion is not
built until the policy's own wording is in the repository. The 2023 employee engagement survey with Sarah Shepard
is not in either repository.

## What is next

1. Give the One DHS view its own branch and Railway service, built from this core with `PAC_STAFF_SCOPE=one-dhs`.
2. Bring the live front door's resource library and organization directory in, once its database can be read.
3. Build the People and Growth engine out: mentoring guides and cadences, career ladders and reclassification
   guidance, team chartering.
4. Add the 2023 employee engagement survey findings as the program's evidence base, once the owner shares them.
5. Let Ask carry the page a person is on, so "Ask about this" answers from the resource in front of them.
