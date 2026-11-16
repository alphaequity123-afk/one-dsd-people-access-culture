# Evaluation study: One DHS People, Access and Culture

Date: 2026-11-15. A study for building evaluations. It contains no code and changes no project file.

## Sources and conventions

- **BASE** is `C:\Users\garyb\Projects\one-dhs-unified`, the One DSD codebase the agency app is built on.
  - While this study was under way, another session reset BASE from `main` (2277a9e) to `dsd/main` (b3fef0c), switched to branch `unified/foundation` and committed 7c8860c.
  - This study describes **7c8860c**. It has 220 `page.tsx` files, 94 `route.ts` files and 210 test files.
- **NEW** is `C:\Users\garyb\Downloads\One DSD Equity Program (11)\one-dhs-ask-repair`, the features built this week:
  - the knowledge base and graph;
  - Ask;
  - readings at three depths;
  - job-family, competency and area tagging;
  - narrated branching trainings;
  - owner screens.
- **Principles** means `NEW/docs/CORE-PRINCIPLES.md`, adopted 2026-11-15.
- **Requirements documents.** Principles names the *People, Access and Culture Program Requirements Document (2026-11-09)*. No file with that date was found locally. These were read instead:
  - `OneDrive\Desktop\One DSD Equity Program (11)\output\One-DSD-People-Access-Culture-Program-Requirements.md`, version 1.0, 2026-11-01. Its section 12 covers measurement and its section 13 covers acceptance.
  - `...\output\One DHS and One DSD Handoff 2026-11-12\Product Requirements Document.docx`, the revised baseline of 2026-11-12. Requirements 01–28 are in it.
  - **The seven outcomes and three evidence levels are written in code**, in `BASE/lib/program/model.ts`, version `2026-09-08.1`. They are cited from the "Program Operating Charter" of 2026-09-08 (`BASE/lib/program/equity-framework.ts:655`). Section 3 uses that code as the authoritative statement. **Confirm with the owner** that the 2026-11-09 document uses the same seven and three.

---

## 0. The most important findings

1. **Privacy conflict, critical (NEW).** Ask stores every question and every answer.
   - `NEW/lib/ask/ask.ts:128-133` writes each question, the full answer, the citations, the top 20 retrieved passages with their scores, the timings and the outcome to the `ask_log` table.
   - The table is defined at `NEW/supabase/migrations/0001_knowledge_base.sql:110-119`. It has no retention limit and no reader.
   - This contradicts promise 2: learning activity is never counted or stored, not even as anonymous totals.
   - Every question becomes a stored, countable row, including any private detail a person types.
2. **Privacy conflict, high (NEW).** The home page Ask puts the question in the URL.
   - `NEW/components/ask-form.tsx:22` does `router.push('/ask?q=...')`.
   - The question then appears in hosting access logs, browser history and the referrer.
   - BASE avoided this on purpose: `BASE/components/home-ask.test.tsx` checks that the question goes through session storage, never the URL. This is a regression.
3. **Measurement documents plan to count learning (BASE public library).** They contradict the privacy promise:
   - `BASE/public/library/one-dsd-planning/One_DSD_Data_and_Metrics_Framework.html` (and its `.docx`) lists:
     - "Completion of program courses, pathways and practice | Unit, role | Learning records and site totals"
     - "Completions by unit and role; podcast chapters played"
     - "Open Hours attendance"
     - "Attendance by unit (totals)"
   - `One_DSD_Quarterly_Report_Dashboard.html` has sample data "Basic learning assigned to all staff; 48% finished". One of its warning signs is that "learning use" declines.
   - `DSD_Equity_Implementation_Work_Plan.html` says "Percent of staff completing IDI" and "Percent completing OAR or other equity training".
   - The three-year plan's measures (`BASE/lib/program/dsd-three-year-plan.ts:705-745`) include "Learning completed" in Year 1 and "Learning used on the job" in Year 2.
   - The 2026-11-12 product requirements say "A count of visits, listening sessions or course completions can show reach".
   - **All of these need an owner ruling, and then rewording.**
4. **`learning-credit.ts` counts nothing. It is a wording conflict, not a privacy conflict.**
   - `BASE/lib/program/learning-credit.ts` holds one notice, "This program does not offer training credits…", plus a context string for Ask.
   - The notice is shown on about 15 pages and in course downloads.
   - It conflicts with the owner's ruling of 2026-11-15: no system or participation notices.
   - A BASE test, `lib/content/collections.test.ts:175`, *requires* this notice and other participation notices. NEW's `lib/kb/system-notices.ts` removes them.
5. **Dormant counting code in BASE.** All of it is switched off today, but it remains ready to switch on:
   - the anonymous equity-review counter (`lib/practice/equity-review-count*.ts`, `PRACTICE_COUNTERS_ENABLED = false`);
   - the guidance counter (`lib/tutor/counter-store.ts`);
   - the leaders' "Equity reviews completed" panel (`app/data/equity-baseline/review-count-section.tsx`, which says "not counted yet");
   - comments that claim counting is live (`app/api/tutor/route.ts:20`, `components/tutor-panel.tsx:13`);
   - an Ask record store with an owner screen (`/consultant/ask-records`) that nothing writes to.
6. **BASE keeps anonymous usage totals and traces of what was read.**
   - The Ask run ledger (`lib/intelligence/clone/ledger.ts`) is shown to the owner as monthly run counts on `/consultant/orchestrator`.
   - Tool audit events record `content_ids_touched` for each Ask.
   - Research usage stores a 16-character hash of each question.
   - The resource study assistant logs one line per answer.
   - **Owner decision needed:** under "not even anonymous totals", do these count as learning activity?
7. **NEW has no way to evaluate Ask.**
   - `package.json` defines `ask:eval` as `scripts/eval/run.ts`, and that file does not exist.
   - There is no golden question set anywhere. BASE's cases are inline code (`lib/intelligence/eval/runner.ts`, `scripts/verify-live-*.mjs`), go stale and are not run by any CI.
   - Neither repository has CI.
8. **The program can describe outcomes but cannot gather evidence of them.**
   - The seven outcomes, three evidence levels, 28 ADSA actions and the improvement cycle are well defined in BASE.
   - The only staff route for sharing an outcome is the voluntary outcome record (`lib/program/outcome-schema.ts`, with `consent: true` required). Its API (`/api/program/outcomes`) is closed, and `components/program-outcome-form.tsx` is never used.
   - NEW carries none of the program model yet: no logic model, ADSA goals, practice records or My Work.
   - There is therefore no privacy-respecting path today for evidence above the "delivery" level.

---

## 1. Feature inventory

"Working correctly" below is phrased as something that can be observed and tested. Audiences:

- **Staff:** all ~2,400 DHS staff.
- **Leaders:** supervisors, managers and directors.
- **Owner:** the program owner, the Equity and Inclusion Operations Consultant.

### 1.1 NEW (the unified build)

| Route | What it is for | Who | Working correctly means |
|---|---|---|---|
| `/` (`app/page.tsx`) | Landing page: hero with its motion loop, the title, Ask, three ways in (Learn, Explore DHS / `/areas`, Communities) and "For your work" (`/work`, the Cultural Humility training, the cultural calendar) | Staff | <ul><li>Renders with no database.</li><li>The hero motion respects reduced-motion settings.</li><li>Every link answers 200.</li><li>Asking from here does not put the question in the URL (fails today).</li></ul>Principles also require a user guide button, a task finder, the next three observances and a supervisor entry point. **These are absent.** |
| `/learn` | Learning catalog | Staff | Lists published courses. Every item opens `/r/[slug]`. |
| `/library` (`?q=`, `?collection=`) | Search and browse by collection | Staff | Search returns relevant items, measurable as precision at 10 on a fixed query set. An empty result offers a cross-collection search. Collection filters are correct. |
| `/r/[slug]` | One resource, course or lesson, with readings at three depths (Brief, Working, Full; depth cookie via `components/depth-switch.tsx`), course player / guided lesson, media near the top, source line, related items | Staff | <ul><li>The slug opens exactly that item.</li><li>Brief and Working are word-for-word extracts of Full (`lib/depth/check.ts`).</li><li>The media player sits under the title and shows only parts marked ready.</li><li>The source link resolves.</li><li>Captions and transcript are present.</li><li>Unpublished items return 404.</li><li>Owner controls appear only to the owner.</li></ul> |
| `/ask` and `POST /api/ask` (`lib/ask/*`) | Ask: hybrid keyword and meaning search (`search_passages`), optional rerank, graph context bounded at 600 ms, an answer streamed as NDJSON with [n] citations, citation check, related resources from the graph ordered for the reader's job family, a general-knowledge answer when nothing is found | Staff | <ul><li>Always answers in words.</li><li>Every [n] maps to a passage that was supplied.</li><li>A fact taken from a passage is cited; general knowledge is not cited.</li><li>Conditions in a rule are kept.</li><li>The job family changes order, not facts.</li><li>Answers come within seconds.</li><li>Nothing is stored (fails today).</li><li>There is a reminder to leave out private details (`ask-form.tsx:78`, present).</li><li>The person or area responsible is named for DHS-specific rules.</li></ul> |
| `/areas`, `/areas/[id]`, `/dsd` (redirects to `/areas/dsd`) | DHS administrations, divisions and areas ("Across DHS"), with collections and tools tagged to each area | Staff | <ul><li>Every area in `data/workforce/areas.json` renders.</li><li>The resources listed are tagged to that area.</li><li>Nothing is hidden by job family.</li><li>DSD is marked as the model.</li></ul> |
| `/work` (`?family=`) | "Your work": the job-family and area pickers (cookies `job-family` and the area cookie, `components/cookie-select.tsx`), resources by competency with the deepest for the family first, plus work from other families | Staff | <ul><li>The family only reorders; the sets of resources are equal across families.</li><li>The order follows `MATRIX` (`lib/workforce/matrix.ts`).</li><li>The choice stays in a cookie and is never logged.</li><li>`?family=` puts the family in the URL. This is a minor privacy note against promise 3.</li></ul> |
| `/trainings/[id]` (`?version=`), `/facilitator`, `/transcript`, `/captions/[segment]` | Narrated branching training (`lib/trainings/schema.ts`): concept segments with checks (six feedback styles), a simulation per version (all staff plus job families), hidden measures that only choose the consequence, a "practiced" summary instead of a score, an action plan, a facilitator guide, generated WebVTT and transcript. Trainings: `cultural-humility` (core plus 10 family drafts) and `psychological-safety` (drafts) | Staff, facilitators | <ul><li>`trainingProblems()` and `wordingProblems()` return nothing.</li><li>Every path ends.</li><li>Options appear in a stable shuffled order (`lib/trainings/order.ts`).</li><li>No score is shown.</li><li>The path stays only on the open page: no storage and no network calls from `components/branching-simulation.tsx` (verified in code).</li><li>Captions and transcript match the JSON.</li><li>There is a 4K hero image.</li><li>The cast are unnamed figures C1–C8.</li></ul> |
| `/media/[...path]` | Serves media from the bucket | Staff | Range requests return 206 with bytes that match. No access logging. |
| `/manage`, `/manage/login`, `/manage/[id]` (`app/manage/actions.ts`, `lib/auth.ts`) | Owner sign-in; edit, unpublish, publish, archive and restore resources; revisions and events (`resource_revisions`, `resource_events`) | Owner | <ul><li>Every action needs the signed owner cookie.</li><li>Each change writes a revision.</li><li>Unpublish removes the item from search and Ask straight away.</li></ul> |

Build and data workflows in NEW:

| Workflow | Files | What it does | Pass |
|---|---|---|---|
| Content import | `scripts/kb/build-import.ts`, `load.ts`, `embed-missing.ts` | Builds, loads and embeds the knowledge base | The expected item count loads and every passage has a vector |
| Block load | `scripts/kb/load-blocks.ts` | Loads the blocks | 75 blocks, 3,800 items, 5,777 connections, no orphans (`--check` runs offline) |
| Workforce tagging | `scripts/workforce/tag.ts` | The model picks from fixed label lists; depth comes from the matrix; `data/workforce/overrides.json` holds confirmed reviewer corrections | Quality is in section 6, A8 |
| Area tagging | `scripts/workforce/areas.ts` | Tags items to areas | — |
| Depth drafts | `scripts/depth/*` | Drafts the Brief and Working readings | — |
| Media release gate | `scripts/media/check-releases.ts`, run inside `npm run build` | Checks media releases | — |
| Training assembly | `scripts/trainings/assemble.ts` | Builds a training | — |
| Training check | `scripts/trainings/check.ts` | Checks a training | — |

### 1.2 BASE (One DSD codebase, HEAD 7c8860c)

All routes are open (no sign-in) unless marked otherwise. Redirect-only routes are left out. The full list is in the route inventory this study drew on (see the closing note).

#### Home, start and discovery

- `/home`: hero, task finder and the featured Water We Swim In.
  - **Working:** renders and links resolve. The Ask handoff uses session storage, never the URL (`components/home-ask.test.tsx`).
- `/start`: three questions (role, the work in front of you, time you have) leading to a first step with a reason.
  - **Working:** the same answers always give the same suggestion. Nothing is sent: no network call and no storage write. The suggestion explains why.
- `/explore/*`, `/growth/*`, `/search`, `/embedded-tools/{search,ask}`, `/team-kits`.
  - **Working:** facet pages list items carrying that facet. Search relevance holds on a fixed query set. Embedded tools work inside an iframe.

#### Learn

Routes:
- `/learn`, `/learn/core-15`
- `/learn/clas/*`: hub, shareable collection, curriculum of 9 lessons, job aids
- `/learn/intercultural/*`
- `/learn/equity-toolkit/*`: hub, curriculum, `goals` (the six ADSA goals and work plan), `policy-review`, `practice`
- `/learn/leadership-styles/*`: 16 styles, capstone and scenarios with the Guidance panel (`/api/tutor`)
- `/learn/water-we-swim-in/*`: hub, modules, course, essay, collection, plus a learning assistant at `/api/learn/water-we-swim-in`
- `/learn/readings/*`: 304 book summaries
- `/learn/paths/*`, `/learn/collections/*`, `/learn/sources`, `/learn/tribal-referral`
- `/courses`, `/courses/[courseId]`, `/courses/[courseId]/[lessonId]`
- `/collections/*`, `/audio-library`, `/podcasts/[id]`, `/share/*`

What "working" means:
- **Courses and lessons:** blocks render. Media sits under the title. Captions and a transcript exist. Downloads come in docx, xlsx, pptx, pdf, html and txt. The share link opens exactly that lesson.
- **Progress:** progress and notes stay only in localStorage (keys in `lib/client/storage-keys.ts`).
- **Guidance** (`components/tutor-panel.tsx` with `lib/tutor/student-model.ts`):
  - It gives a nudge, a hint or a parallel worked example, and never the item's own answer.
  - The learner model stays on the device.
  - The server stores nothing.
  - Visible text never says "AI" or "tutor".
- **Tribal referral:** the page points to the responsible Tribal liaison, with no program training on Tribal relations.

#### Library

- `/library`, `/library/[id]`, `/source-reading/[id]`.
- **Working:** every resource links to its source, and the source resolves. Downloads are valid. The owner's edit controls appear only to the owner.

#### Communities

- `/minnesota-communities`: 42 briefs, plus `[id]/[part]`.
- `/minnesota-communities/calendar`: 569 observances, with an ICS download.
- `/community-outreach/*`: 11 DSD pages, including the county map, organizations, policies and providers.
- `/minnesota-agencies/*`, `/employee-resource-groups`.
- **Working:**
  - Briefs carry sources.
  - Tribal Nations pages stand as written.
  - The calendar's "next three" is correct for a fixed date.
  - The ICS file validates.
  - Images of people match the topic, which a person checks.

#### Practice

Routes:
- `/practice`: 13 guided practices.
- `/practice/[id]`, `/practice/clas`, `/practice/measurement` (evaluation plan worksheet), `/practice/requirements` (requirements crosswalk), `/practice-guides/[slug]`.
- `/equity-review/*`:
  - the analysis ladder;
  - static tool HTML;
  - `analyze` (document analysis, `/api/analyze`);
  - `director-toolkit` and its 14 templates;
  - `structural` (a localStorage draft);
  - `working-group-plan`.
- `/operationalizing-equity`.

What "working" means:
- Worksheets save only to the browser and export to Word or HTML (`lib/program/goal-plan-report.ts`).
- Every text box reminds people to leave out client, case, health and personnel details.
- No completion is sent, so the counter stays off.

#### Equity workspace and team space

- `/equity-workspace/{,policy-analyzer,toolkit}`, `/team-space`, with APIs `/api/consultant/toolkit/*`, `/api/equity-workspace/policy-analysis/*` and `/api/team-space/decision-records`.
- These are open to everyone because `EQUITY_WORKSPACE_OPEN = true` (`lib/auth/consultant-or-team.ts`).
- They write cases and shared decision records to `pac_dsd.consultant_toolkit_cases`, encrypted.
- **Working:**
  - Only content a person chooses to share is stored.
  - No identity is attached.
  - The origin check holds.
  - Encryption holds (`lib/consultant-toolkit/backend.test.ts`).

#### Leaders

- `/leading`: nine decision doors and 89 questions.
- `/leading/[door]`, `/leading/how-this-works`, `/leading/journey`, `/leading/paths/*` (place kept in localStorage).
- `/leading/community-coverage`: leaders key or owner.
- `/data/equity-baseline/*`: leaders key or owner. Service access by race and ethnicity for FY22–24, measures per goal, and the dormant review-count panel.
- **Working:**
  - Leader pages render.
  - Guarded pages refuse visitors who are not signed in.
  - Baseline figures match their source table.
  - Small cells are suppressed.
  - Wilson intervals are correct (tested).
  - No usage counts are shown.

#### Support

- `/support`, `/support/directory/*`, `/support/right-person`, `/support/share-result` (writes closed).
- **Working:** each need maps to the person or area responsible, never "office". Directory links resolve.

#### Program

Routes and what each holds:
- `/program/model`, `/program/[stage]`: the logic model, five stages (`lib/program/dsd-logic-model.ts`).
- `/program/implementation`: the 28 ADSA actions.
- `/program/reflection`: a localStorage observation.
- `/program-foundation`: the charter (`lib/program/constitution.ts`).
- `/equity-framework`: six pillars, the improvement cycle and three stages (`lib/program/equity-framework.ts`).
- `/equity-policy/*`, `/understanding-dhs`.

What "working" means:
- Stage resources resolve.
- Source wording of ADSA actions is preserved exactly (`sourceAction`, `sourceLine`).
- Pages describe goals without claiming completion.

#### One DSD

- `/one-dsd/*`: Amplify Equity (7 pages), leadership, planning (which links the three planning documents), programs, scenarios, the team, resource selections, and the workspace (owner).
- **Working:** links resolve. The planning documents open. The team workspace content is owner-only.

#### Areas and administrations

- `/areas/*`, `/administrations/*`, `/administrations/adsa/divisions/dsd`.
- **Working:** the four administrations' narrated introductions play, with captions.

#### My Work

- `/my-work/{,explore,plan,action-plan,decision-records,reflections}`, all stored in localStorage.
- **Working:**
  - Records stay in the browser.
  - Export works.
  - "Share to team space" is the only network path. It is explicit, and private details are flagged before sending (`inspectCollaborationText`).

#### Ask (BASE)

- `/ask`, `/ask/study`, with `/api/ask*`, `/api/learn/resources` and `/api/search`.
- Ask is live only when `PAC_CLONE_AGENTS=on`. Session history lives in sessionStorage.
- **Working:** the readiness and live checks in section 2.2. No question text is persisted.

#### Consultant workspace (owner only)

- `/consultant/*` has 27 pages, among them program, evals ("Readiness checks"), orchestrator, audit, ask-records, resources, review, research, workforce and toolkit.
- **Working:**
  - Every page and API checks for the owner.
  - Readiness checks run.
  - Program work records follow `lib/program/work-schema.ts`.

#### About

- `/about`, `/user-guide` (welcome video and topics), `/site-map`.
- **Working:** every route appears in the site map, and the video has captions.

### 1.3 Cross-cutting workflows, as promises to test

| Promise or workflow | Test |
|---|---|
| No sign-in to read, learn or use tools | Every staff route returns 200 without cookies |
| Learning is your own | See section 4 and section 6, A10 |
| Work stays with you | Saved items exist only in browser storage. The server receives no copy. |
| Private information stays out | Every text input has a visible reminder to leave out client, case, health and personnel details |
| Facts have sources | Every resource has a source, and every Ask citation resolves |
| Plain language | Readability bands are reported. Acronyms are spelled out on first use. |
| People decide | Answers and tools name the person or area responsible and never approve anything |
| Open to everyone | Keyboard, screen reader, magnification, phone, captions and transcripts, full print |
| Easy to share | Each item has a stable link that opens exactly that item. Downloads come as Word, Excel, PowerPoint, printable and plain text. **NEW has no downloads yet.** |
| Three selections away | Click depth from home to every published resource is at most 3 |

---

## 2. Existing checks

### 2.1 NEW

`npm test` runs vitest over 29 test files, about 134 cases. No test needs a database or network.

| Area | Tests | What they cover |
|---|---|---|
| Ask | `ask-always-answers`, `compose`, `answer-text`, `ask-rerank-input` | <ul><li>The instructions forbid stock replies.</li><li>The answer from the library's own text keeps its sources.</li><li>Citation renumbering and invalid-reference drop.</li><li>The uncited-sentence counter.</li><li>Rerank parse and fallback.</li></ul> |
| Content and editorial | `editorial-revisions`, `source-editorial`, `partial-course-editorial`, `course-field-guards`, `course-*-reading*`, `community-section-reconstruction`, `recorded-fidelity`, `import-text`, `chunk` | <ul><li>Reviewed revisions apply exactly.</li><li>Recorded transcripts are protected.</li><li>Chunking.</li></ul> |
| Sources and links | `source-links`, `resource-source-links`, `source-attribution`, `link-repairs` | <ul><li>Sources are attached.</li><li>Four dead links are repaired.</li></ul> |
| Wording | `responsible-wording`, `system-notices`, `reading-depths` | <ul><li>"Office" becomes "the person or area responsible".</li><li>Participation boilerplate is removed.</li><li>Depth extracts are word for word.</li><li>Banned words are absent.</li></ul> |
| Graph and manifests | `manifest` | <ul><li>Every block is valid.</li><li>Nothing is orphaned.</li><li>A bad block is rejected whole.</li></ul> |
| Workforce | `workforce-matrix` | <ul><li>10 by 11 matrix cells.</li><li>Spot checks against the brief.</li><li>Depth rules.</li><li>Cookie parsing.</li></ul> |
| Media | `media-bucket`, `added-course-media`, `part2-release` | <ul><li>Media manifests.</li><li>The approved Part 2 release.</li></ul> |

Scripts in NEW that act as checks:
- `scripts/trainings/check.ts`: schema, `trainingProblems`, `wordingProblems`. Run by hand; **not in `npm test`**.
- `scripts/kb/load-blocks.ts --check`.
- `scripts/media/check-releases.ts`, which runs as a build gate.
- `lib/depth/check.ts`, used when depth readings are drafted.
- `data/workforce/work/sample-for-review-{v1,2,3}.json`: three tag review samples, with no agreement score recorded.
- `npm run ask:eval`: **the script is missing** (`scripts/eval/run.ts`).

### 2.2 BASE

Configuration:
- `npm test` runs `scripts/testing/run-tests.mjs`, which strips credentials and runs vitest.
- `vitest.config.mts` has two projects: components (jsdom) and node.
- 210 test files. `*.test.mjs` and `*.test.cjs` files are **not** collected.
- Focused configs sit under `scripts/testing/*.vitest.config.mts`, among them ask-connected, ask-integrity, ask-reliability and knowledge-coverage.
- **No CI** (no `.github/`). `verify:ci` is a local chain: environment, sources, typecheck, lint, test, build.

| Kind | Where | Covers | Misses |
|---|---|---|---|
| Ask readiness harness | `lib/intelligence/eval/runner.ts`, run from the owner's `/consultant/evals` (`components/evals-client.tsx`, `app/api/consultant/evals/route.ts`) | 43 inline boolean cases in 5 suites: Ask (ASK-E1–E10: private details refused, ranking supervisors refused, no impersonation, expected links), community briefs, consultation intake, learning paths, accessibility scan. A case can be pass, fail or manual; any fail or manual blocks release. | <ul><li>Not in CI.</li><li>Calls the live, model-based Ask, so results vary.</li><li>Regular expressions written for the older deterministic Ask.</li><li>No question file and no correctness scoring.</li></ul> |
| Live semantic check | `scripts/verify-live-ask-semantics.mjs` | 13 cases with human rubrics. Automatic checks: a 200 response, research present or absent, every claim matching a quoted passage, valid Office exports. | <ul><li>Its semantic status is always "requires_manual_review".</li><li>It writes to a missing `.data` folder.</li></ul> |
| Live coverage check | `scripts/verify-live-knowledge-coverage.mjs` | 6 search cases and 3 Ask cases with expected sources. Checks 60 cited URLs. | Small set |
| Retrieval probe | `scripts/corpus/ask-gate-probe.maintenance.ts` | Diagnostic only | No assertions |
| Unit Ask and retrieval | `lib/intelligence/**` (about 70 files) | <ul><li>Retrieval documents.</li><li>Source links.</li><li>Answer review.</li><li>Provider fallback with mocked fetch.</li><li>The timing log contains no question text (`clone/live-answer.test.ts`).</li></ul> | Real model output |
| Wording | About 25 tests with inline banned-word patterns: AI, tutor, chatbot, office, DEI/DEIA, acronyms, "coming soon" | Their own surfaces | <ul><li>No shared list.</li><li>Most pages and all Ask output are unchecked.</li><li>`collections.test.ts` requires participation notices that the owner later ruled out.</li></ul> |
| Downloads | `scripts/smoke-dsd-services.cjs`: 19 specs in 6 formats, checking magic bytes, MIME type, size and Office parts. `lib/downloads/**` tests. `scripts/verify-download-trace.mjs`: at most 80 MiB. | Whether files are valid | Whether the text inside is correct |
| Links | `scripts/audit-dsd-content-routes.cjs` (local crawl, fragments, negative 404s), `audit-live-featured-links.mjs`, `verify-dsd-routes.cjs`, `testing/verify-course-http.mjs` (86 courses, 780 lessons, media 206) | Status codes | <ul><li>External links are not fetched.</li><li>Several need missing baselines.</li></ul> |
| Accessibility | `scripts/check-dsd-contrast.cjs` (a fixed colour list), `check-dsd-readability.cjs` (report only, writes to a missing folder), jsdom role checks | — | <ul><li>No axe.</li><li>No keyboard or screen-reader automation.</li></ul> |
| Privacy | <ul><li>`home-ask.test.tsx`: question never in the URL.</li><li>`live-answer.test.ts`.</li><li>`ask-audit-ids`, `durable-audit-ids`: opaque IDs.</li><li>Encryption tests.</li><li>`course-place-privacy.test.mjs` (not collected).</li><li>`share-link-test.mjs` (live).</li><li>`verify-environment.mjs`: no server secrets in client code.</li><li>Counters-off assertions in the tutor and equity-review routes.</li><li>`db/migrations/0012_pac_no_surveillance_contracts.sql` blocks fields such as `completionbystaff` and `equityscore`.</li></ul> | — | No end-to-end check that the database and logs contain no question text or read history |
| Performance | Timings recorded in the live scripts. Trace budgets: semantic at most 245 MiB, download at most 80 MiB. | — | No latency thresholds and no Web Vitals |
| Media integrity build gates | `verify-clas-curriculum`, `verify-equity-everyday`, `verify-intercultural-curriculum`, `verify-completed-course-podcasts`, `verify-railway-release-assets` (4,088 assets) | SHA-256 hashes and counts | Content |

### 2.3 What all the checks miss

| Gap | Detail |
|---|---|
| Answer correctness | Nothing scores whether an answer is right, grounded, complete or useful. |
| Tagging accuracy | Nothing measures it. |
| Trainings | Nothing runs them end to end. There is no test that captions and transcript match the JSON. |
| Accessibility | No real-browser checks. |
| Privacy | No integrated check, and NEW stores Ask text today. |
| Wording | No single linter across pages, readings, trainings and Ask output. |
| Click depth | "Three selections away" is never measured. |
| Program outcomes | No evaluation of program outcomes of any kind. |

---

## 3. The measurement model as built

### 3.1 Logic model (`BASE/lib/program/dsd-logic-model.ts`, shown at `/program/model` and `/program/[stage]`)

| Stage (code `model`) | Slug | Question | What it holds | Reflection question |
|---|---|---|---|---|
| Inputs | `what-informs` | What informs our work? | Charter, requirements crosswalk, courses on bias and privilege, the equity policy, Minnesota Communities, Understanding DHS | Whose perspective would help? |
| Activities | `practice` | What do we do with what we know? | ADSA implementation steps, operationalizing equity, toolkit practice, practice plans, practice guides, intercultural learning, the One DSD Team, Amplify, leadership | How can affected people influence options before a decision is settled? |
| Outputs | `resources` | What can we use or produce? | Learn, Library, toolkit practice, equity review tools, structural analysis, My Work. "A completed document records what was produced; it does not, by itself, establish an improvement." | What would show the output helped? |
| Outcomes | `progress` | What changed in practice? | Recording an observation (`/program/reflection`, browser only), DSD planning, the review-a-change guide, ADSA goals. "These observations … are not ratings of individual staff." | What evidence supports the change, and what is uncertain? |
| Impact | `impact` | What should improve over time? | The Equity Strategic Framework, DSD programs, ADSA goals, review of what is changing. "Taking part in the program does not establish them." | Which practices are becoming ordinary work? |

The code has no explicit short, intermediate and long split. The three-year plan's "three kinds of signs" supplies the time horizon (`dsd-three-year-plan.ts:705`):

| Year | Signs | Evidence level |
|---|---|---|
| Year 1 | The work is happening | Delivery |
| Year 2 | How work is done is changing | Application |
| Year 3 | Results are improving | Benefit |

"All numbers are totals; no person is named or scored." Section 6 B uses this mapping:

| Outcome horizon | Logic-model stage | Seven outcomes |
|---|---|---|
| Short | Outputs and early Outcomes | Staff capability, access barriers identified |
| Intermediate | Outcomes | Capability transfer, workplace culture, institutional application |
| Long | Impact | Organizational memory, agency coherence, reduced disparities, belonging and trust |

### 3.2 Seven outcomes, thirteen functions, three evidence levels (`BASE/lib/program/model.ts`)

| Outcome id | Intended change | Evidence examples in the code |
|---|---|---|
| `staff_capability` | Staff find, understand and apply useful knowledge | A representative task completed with its reasoning; a voluntarily shared later application |
| `capability_transfer` | Comparable work with more independence | A comparable task with less help; a follow-up account |
| `access` | Language, disability, communication and process barriers found and addressed earlier | A documented barrier and its correction; user feedback on the correction |
| `workplace_culture` | Participation, candor, equitable people practices | A changed meeting or supervisory practice and its review; voluntarily shared experience |
| `institutional_application` | Equity analysis informs policy, program, budget, technology, procurement and implementation decisions | A documented design or decision change; a decision owner's disposition |
| `organizational_memory` | Knowledge and decisions outlast a task or a person's tenure | A maintained resource reused; a source correction that reaches the guidance affected |
| `agency_coherence` | Shared practice across settings, with local context kept | A documented adaptation or reuse; pilot findings inform an expansion decision |

**Functions.** Thirteen functions (`programFunctions`) map to outcomes and expected outputs:

| Function | Route | Outcomes |
|---|---|---|
| Ask | `/ask` | Capability, transfer |
| Learning | — | — |
| Resources | — | — |
| Community context | — | — |
| Guided practice | — | — |
| Equity analysis | — | — |
| Consultation | — | — |
| Staff engagement | — | — |
| Workforce context | — | — |
| Organizational knowledge | — | — |
| Content stewardship | — | — |
| Program coordination | — | — |
| Evaluation | `/consultant/evals` | All seven |

**Evidence levels** (`programMeasurementRules`):

| Level | Meaning |
|---|---|
| `delivery` | A verified output exists. It does not show use. |
| `application` | Use in real work. Participant report is kept apart from independent observation. |
| `benefit` | An observed change with its limitations. Contribution is not causation. |

**Rules already in the code**, which section 6 adopts as invariants:
- `technicalChecksAreProgramOutcomes: false`
- `completionOrUsageAloneEstablishesCapability: false`
- `fewerConsultationsAloneEstablishesIndependence: false`
- `employeeRankingPermitted: false`
- `participantEvidenceIsVoluntary: true`
- `emptyEvidenceMeaning`: "Not yet evidenced in this record, not proof that no work occurred."

**Program operations measure.** The code also has `autonomyTargetPercent` of 90–95% and an autonomy calculation over agent-run program tasks. This measures the program's own operation, not staff, and has to be reported separately.

**Operating cadences** (`operatingCadences`) are the review points:
- monthly One DSD Team meeting;
- Open Hours;
- quarterly program review, which produces an "evidence summary distinguishing delivery, application and benefit" and "recorded decisions to retain, revise, connect, support or stop";
- annual refresh.

All are `planning_pattern`, not confirmed schedules.

### 3.3 Requirements documents on measurement

**2026-11-01, section 12.** Eight measures, each with a guardrail:
- findability;
- learning usefulness;
- practice quality;
- accessibility;
- source quality;
- Ask safety and usefulness;
- service and media;
- program outcomes ("website use alone is insufficient").

**2026-11-12, requirements 03, 14, 25–28.**
- Three representative journeys per release.
- Time to first audible playback.
- Traceability.
- Req 27: "Each evaluation states its question, sample, period, findings, limits and responsible role." Distinguish product use, learning, work practice and benefit.
- **The same document says "A count of visits, listening sessions or course completions can show reach".** This conflicts with Principles promise 2 (section 4).

### 3.4 Six ADSA goals and 28 actions

`BASE/lib/program/equity-goals.json` holds the goals:
- `goalAuthority`: "ADSA Equity and Inclusion Implementation Plan (goals 1–6)".
- Each goal has a focus, summary, example, three questions, an anti-racism note, an **output** and 4–5 library resources.
- They are shown at `/learn/equity-toolkit/goals` (`components/equity-goal-experience.tsx`) with a localStorage work-plan draft and Word or HTML export.

`BASE/lib/program/adsa-implementation.ts` holds the actions:
- `exactStepCount: 28`, with the source wording and source line preserved.
- Each action carries program-authored support: `status`, the charter duties, `toolRoutes`, a `workProduct`, 2 `evidenceQuestions` and `missingSpecificSources`.
- Every action's status is "Program-authored implementation support; not an additional official action or completion claim."
- They are shown at `/program/implementation`.
- They are linked to owner program tasks through `goalActionIds` (`lib/program/work-schema.ts`, `adsa-work-links.ts`).

| Goal | Actions | Goal output (equity-goals.json) | Typical tool routes |
|---|---|---|---|
| 1 Eliminate Disparities | 1.1–1.5 (division equity team, disparity goals, action plan per goal, use the Toolkit, data-driven measurable outcomes) | Evidence-informed analysis, alternatives, responsible role, review plan | `/practice/measurement`, `/practice/gp-7`, `/learn/equity-toolkit`, `/equity-review/general`, `/program/reflection` |
| 2 Community Engagement | 2.1–2.5 (advisory councils, Tribal Consultation training, partner with communities, feedback loops, resource guides) | Engagement plan and an account of how input shaped the decision | `/practice/gp-3`, `/support/right-person`, `/learn/tribal-referral`, `/minnesota-communities` |
| 3 Hiring and Retention | 3.1–3.8 (climate surveys, bias, interview panels, onboarding, equity questions, close the two-year retention gap, ERGs, Engagement Committee) | Retain or revise a workforce practice with the manager and HR | `/practice/gp-4`, `gp-6`, `gp-11`, `/employee-resource-groups` |
| 4 Learning and Development | 4.1–4.3 (intercultural competence, ADSA IDI plan, skills and leadership access) | Learning and application plan with practice and reflection | `/learn/self-directed`, `/practice/gp-5`, `gp-11` |
| 5 Contracts and Procurement | 5.1–5.3 (Toolkit on practices, diverse vendors, outreach venues) | Contract-cycle barrier review, next action, follow-up evidence | `/practice/gp-10`, `/practice/requirements` |
| 6 Communication and Accessibility | 6.1–6.4 (inclusive language, notable-dates calendar, accessibility compliance including trainings, CLAS) | Review of a communication process, revisions, a check that people can complete the task | `/practice/gp-13`, `gp-8`, `gp-9`, `/practice/clas`, `/library/ja-access-checks` |

**Training completion inside the actions.** ADSA actions 2.2 (Tribal Consultation training), 4.2 (IDI plan) and 6.3 ("including … completing appropriate trainings") are about official training completion. Their work products already route completion records "through the official system". The evaluation must keep those records outside this program (section 4).

**Visible staff name.** `adsa-implementation.ts:37` (`authorityBoundary`) contains the owner's first name. Check whether it is visible, against the no-staff-names rule.

### 3.5 Where Plan-Do-Study-Act appears

The literal term appears only in course content: `BASE/lib/content/courses/authored/gap-completion/specs/gc-systems-thinking.json` describes the CMS Plan-Do-Study-Act template ("Plan a small test… predict… Do the test…"). The program's own cycle is equivalent, under other names:

1. **Equity Strategic Framework improvement cycle** (`lib/program/equity-framework.ts:63-143`, shown at `/equity-framework#cycle`, and in the download from `lib/downloads/adapters/program.ts:94`).

   | Framework stage | PDSA step |
   |---|---|
   | Assess, Plan | Plan |
   | Implement | Do |
   | Measure, Learn | Study |
   | Improve | Act |

   - Stages turn "when the people involved agree, not on a date".
   - The Measure stage asks "What was delivered, what was applied, and what changed?". That is the three evidence levels.
   - The framework also defines `earlyWarning` triggers, `progressReport` and `publicReport` contents, and `measurementDomains`.

2. **Owner program work records** (`lib/program/work-schema.ts`, at `/consultant/program`), a PDSA engine in data:
   - **Plan:** a task with `objective`, `outcomeIds` and `goalActionIds`, then a `preparationPlan` with `reviewNeeds`, `measure`, `reportBack` and an optional `measureDefinition` (the ten fields in `measure-definition-fields.ts`: calculation, population, source, period, comparison, differences and privacy, target, review, next trigger).
   - **Do:** the `applied` phase.
   - **Study:** `results_recorded` requires an observation, evidence, limitations and a confidence of `early_observation`, `supported_observation` or `not_yet_known`.
   - **Act:** `decision_recorded` requires a decision owner, reference, next action and implementation owner, plus a `disposition` of retain, revise, stop or not_yet_known.
   - Receipts carry `evidenceLevel`.
3. **The voluntary outcome record** (`lib/program/outcome-schema.ts`, `outcomes.ts`). It is a one-screen PDSA for staff:
   - problem, action, adopted change, observed result, follow-up;
   - an optional public evidence link and review date;
   - a decision of retain, revise, stop or not_yet_known;
   - `consent: true`, with `evidenceStatus: "self_reported"` and an optional `outcomeId`;
   - checked for private details.

   **The API is closed** and the form component is unused.
4. **Three-year plan rhythms** (`dsd-three-year-plan.ts`): leaders' review, One DSD Team monthly, the quarterly report, and equity review before key decisions. Year checkpoints are gated on checklists, not dates.
5. The logic model's **Outcomes** stage ("return to what happened after an approach was used") and the practice guide `/practice-guides/review-a-change`.

### 3.6 How evidence is recorded today: records people choose to save

| Record | Where it lives | Who decides to keep or share it | Evidence level it can support |
|---|---|---|---|
| Practice plans, action plans, decision records, reflections, the logic-model reflection, the goal work plan, toolkit and structural drafts | The person's own browser (localStorage), exportable to Word or HTML | The person; the program never sees it | Application, if the person later chooses to share it |
| Decision records shared to the team space | `pac_dsd.consultant_toolkit_cases` (encrypted, anonymous) | The person, by an explicit share | Application, institutional application |
| Toolkit and policy-analyzer cases | Same table (`kind: policy-change`) | The person | Delivery and application |
| Owner program tasks, events and receipts | `runtime_work_objects` | The owner | All three levels, labelled |
| Measure definitions | Inside program events, status `proposed` | The owner | Planning only |
| Voluntary outcome records | Store `decision` kind `program_outcome:*` | The person, with consent | Application and benefit (self-reported). **Closed today.** |
| Planning documents (work plan, metrics framework, quarterly dashboard) | Static HTML with localStorage drafts | Goal leads and the owner, offline | Delivery, application, benefit (aggregate DHS data) |

NEW has none of these records. It stores only content, revisions, owner events and (wrongly) `ask_log`.

---

## 4. Privacy audit of measurement

**The promise** (Principles 2 and 3, and the memory rule): learning activity is never counted, stored or shown, not even as anonymous totals, and is never evidence. Work stays on the person's computer.

| # | Finding | Location | What is recorded | Conflict? | Severity |
|---|---|---|---|---|---|
| P1 | The Ask log | `NEW/lib/ask/ask.ts:128-133`; `NEW/supabase/migrations/0001_knowledge_base.sql:110-119,179` | Question text, full answer, citations, top 20 passages with scores, timings, outcome, `created_at`. No retention; RLS on but no policy. | **Yes, directly.** It stores and makes countable each person's questions and any private details they typed. | Critical |
| P2 | Question in the URL | `NEW/components/ask-form.tsx:22`; `NEW/app/ask/page.tsx:6-7` | The question in the query string, which reaches access logs, history and referrers | Yes. A regression from BASE `home-ask.test.tsx`. | High |
| P3 | Planning documents that count learning | `BASE/public/library/one-dsd-planning/One_DSD_Data_and_Metrics_Framework.html/.docx`; `One_DSD_Quarterly_Report_Dashboard.html`; `DSD_Equity_Implementation_Work_Plan.html`; `BASE/lib/program/dsd-three-year-plan.ts:705-745`; 2026-11-12 PRD | <ul><li>Planned measures: completions by unit and role; site totals; podcast chapters played; attendance by unit; percent completing IDI and OAR; "learning completed"; "learning use".</li><li>Sample "48% finished".</li><li>Reach from visits and completions.</li></ul> | **Yes, in the plan.** Nothing in code collects these. They are published guidance and would set expectations. Completions from the official DHS learning system are outside this app, but the documents also name "site totals" and "podcast chapters played". | High (owner ruling) |
| P4 | Ask and Analyze run ledger | `BASE/lib/intelligence/clone/ledger.ts` (`.data/clone-agents.sqlite`, table `runs`); `BASE/app/consultant/orchestrator/page.tsx:26` (`ledgerSummary()`) | Run id, time, status, route, call count. Monthly totals shown to the owner. | Likely. These are anonymous usage totals. Under "not even anonymous totals", Ask use counts if Ask is part of learning. | Medium (owner ruling) |
| P5 | Tool audit events | `BASE/lib/intelligence/tools/runtime.ts`, the memory and Postgres stores (`pac_dsd.runtime_audit_events`); `/consultant/audit` | Trace id, tool, `content_ids_touched`, timing, ok or error | Partly. Records which program content was retrieved for each anonymous question: a trace of what was read. | Medium |
| P6 | Research query hash | `BASE/lib/intelligence/research/index.ts:127,238`; `governance.ts:154-200`; `runtime_work_objects` | The first 16 hex characters of the SHA-256 of the lowercased question, with provider and cost | Partly. Pseudonymous: common questions can be recovered by guessing. Kept for spending control. | Low–Medium |
| P7 | Dormant counters | `BASE/lib/practice/equity-review-count.ts:15` (`PRACTICE_COUNTERS_ENABLED = false`); `equity-review-count-store.ts`; `lib/tutor/counter-store.ts`; `app/api/practice/equity-review-completed/route.ts`; `app/data/equity-baseline/review-count-section.tsx:21` ("not counted yet"); `components/structural-review-workspace.tsx:227` | Nothing today: 204, no-op | **Latent.** The code is designed to count completed reviews and Guidance rounds as monthly totals. Comments at `app/api/tutor/route.ts:20` and `components/tutor-panel.tsx:13` still say the server counts totals. | Medium. Remove, or keep an eval that asserts it is off. |
| P8 | Ask response records store | `BASE/app/api/consultant/ask-records`, `/consultant/ask-records`, `pac_dsd.append_ask_response_record`, `.data/ask-response-records/` | Nothing (`saveAskResponseRecord` has no caller) | Latent | Low–Medium. Remove. |
| P9 | Per-use log lines | `BASE/app/api/learn/resources` (`console.info("resource_learning_result", {mode, scoped, grounded, citations, elapsedMs})`); `/api/analyze/upload` (trace id, character count) | One line per use in the host's logs | Partly. Usage can be counted from the logs. No text. | Low |
| P10 | Rate limits | `pac.runtime_rate_limits` (migration 0009); in-memory HMAC limiter | HMAC of IP per scope | Operational, not learning, if retention is short. Retention not verified. | Low |
| P11 | Job family and area in a cookie and in the URL | `NEW/components/cookie-select.tsx`; `NEW/app/work/page.tsx` (`?family=`); `NEW/app/api/ask/route.ts:21-22` | The cookie travels with each request and is not logged. `?family=` reaches access logs. | Minor, against "job family … stay on your own computer". | Low |
| P12 | Browser-local progress and notes | `BASE/lib/client/storage-keys.ts` and the course, CLAS, path and podcast keys; Guidance learner model `tutor:<lessonId>` (`lib/tutor/student-model.ts`) | On the device only | No. This is what promise 3 describes. The wording "Guidance … keeps no record" is in tension with the device-local first-try rate; clarify. | Note |
| P13 | NEW trainings | `NEW/components/branching-simulation.tsx`, `training-check.tsx` | Nothing: no storage, no network | No (matches "the path only on the open page") | OK |
| P14 | Shared workspace cases | `pac_dsd.consultant_toolkit_cases` (open because `EQUITY_WORKSPACE_OPEN = true`) | Content people choose to share, anonymous | No. This is chosen work, not learning. Needs the private-details reminder and a retention rule. | Note |
| P15 | `learning-credit.ts` | `BASE/lib/program/learning-credit.ts`, used by about 15 pages, `participation-notice.tsx`, `lib/participation/contracts.ts`, the download adapters, and Ask (`lib/intelligence/agents/ask.ts:685,1011,1380`) | Nothing | **No privacy conflict.** It states there are no credits. It **does** conflict with the 2026-11-15 rule against participation notices. `collections.test.ts:175` enforces the notices. | Wording |

Also confirmed in BASE: no analytics vendors (gtag, GTM, Plausible, PostHog, Sentry, Clarity and similar are absent). `lib/intelligence/tools/catalog.ts` forbids `telemetry.export` and staff ranking. Migration 0012 blocks surveillance fields.

**Recommended rulings for the owner:**
- **P1:** drop `ask_log`, or keep only `outcome` and timing aggregates in memory for the evaluation run.
- **P2:** move the home question to session storage.
- **P3:** rewrite the planning documents to use the official learning system's own reporting, owned by the person or area responsible, or drop learning counts.
- **P4–P9:** decide whether operational counts of anonymous Ask runs are permitted. If they are not, remove them.

---

## 5. Gaps: features and outcomes with no way to tell whether they work or make a difference

### Application gaps

1. **Ask (NEW).**
   - No golden set and no eval runner (`ask:eval` is missing).
   - No measure of grounding, completeness, condition-keeping or name exactness.
   - Nothing checks that general-knowledge sentences are uncited and marked "More generally".
   - Nothing checks that job-family context changes framing without inventing facts about the person.
   - Timings exist only in `ask_log`, which section 4 recommends removing.
   - The route still returns stock text in two cases:
     - 503 "Ask is temporarily unavailable…" when no database is configured;
     - 502 "Ask could not answer just now…" after every attempt fails.

     This conflicts with "Ask never mechanical".
2. **Ask (BASE).** The harness is stale and outside CI, live semantics need manual review, and there is no shared question file.
3. **Trainings (NEW).**
   - `scripts/trainings/check.ts` is not in `npm test`, and the ten family drafts are not checked on each build.
   - No test plays every branch.
   - No test that generated captions and transcript match the JSON.
   - No check that `sources` slugs resolve to published resources.
   - No keyboard check of the simulation.
   - No review of whether the coaching feedback matches the choice made.
4. **Tagging (NEW).**
   - Tags come from a model and are corrected by a reviewer (`overrides.json`).
   - Three review samples exist, but there is no gold set, no precision or recall, no agreement score and no stability check.
   - Area tagging has the same gap.
5. **Readings at three depths.** The checks run only when drafting. No published-state check that every Brief and Working reading still matches Full after editorial revisions.
6. **Accessibility.** No axe and no keyboard or screen-reader runs in either repository. Contrast is checked from a fixed list. Readability has no thresholds.
7. **Links and downloads.**
   - NEW has no crawler and **no downloads** (promise 9 is unmet).
   - BASE checks only file validity, not the text inside.
8. **Performance.** Nothing is asserted. "Within seconds" for Ask and time to first audible playback (PRD Req 14) are unmeasured.
9. **Wording.**
   - Five separate checkers: BASE's inline patterns, `NEW/lib/trainings/wording.ts`, `NEW/lib/depth/check.ts`, `NEW/lib/kb/responsible-wording.ts` and `NEW/lib/kb/system-notices.ts`.
   - None checks rendered pages or Ask output.
   - BASE has a test requiring notices that the owner has since ruled out.
10. **Landing and navigation rules.**
    - Three selections away, the landing contents (user guide button, task finder, next three observances, supervisor entry), Start, Support and the user guide are **not yet in NEW**.
    - Nothing tests them in BASE either.
11. **Privacy.** No test that walks a full journey and proves nothing was written. The promise can only be checked by reading code.

### Program-outcome gaps

1. **No staff route to share an outcome.** The outcome record API is closed and `components/program-outcome-form.tsx` is unused. The seven outcomes' "voluntarily shared" evidence examples have no channel. Only team-space decision records reach the program.
2. **NEW holds none of the program model:** no logic model, ADSA goals, 28 actions, practice records, My Work, measurement worksheet or improvement cycle. Promise 3 records (plans, places) do not exist in NEW.
3. **ADSA evidence questions are not connected to anything.** Each action's two `evidenceQuestions` have no place where an answer is collected, except the owner's program tasks.
4. **The quarterly review cadence has no template in the app** that sorts evidence into delivery, application and benefit. The `progressReport` lists exist only as text.
5. **Benefit-level evidence depends on DHS data** held by others (service disparities, retention, accommodation timeliness). The baseline dashboard holds FY22–24 service access only, behind the leaders key. No agreed refresh owner or comparison period exists.
6. **Outcomes with no indicator at all:**
   - `agency_coherence`: no record of an adaptation across administrations;
   - `organizational_memory`: no reuse trace that does not depend on usage;
   - `capability_transfer`: needs a follow-up account, and there is no channel for one.
7. **The program evaluation itself has no method.** Req 27 wants question, sample, period, findings, limits and responsible role for every evaluation. There is no record type for this; `ProgramReceiptSchema` comes closest.

---

## 6. Proposed evaluation suite

There are two layers:
- **A. Application evals** check that the software keeps its promises. They are automated and repeatable, and every result is reported under **delivery**.
- **B. Program evaluation** asks whether practice changes. It uses only evidence people choose to keep or share.

Following `programMeasurementRules`, an A result is never reported as a program outcome.

**Where the evals live.** Put the eval data in `NEW/evals/` (versioned files, all synthetic) and the runner at `NEW/scripts/eval/run.ts`, the path `package.json` already names.

**Three cadences:**
- **Unit**, on every change and inside `npm test`, offline.
- **Integration**, nightly, against a test database with a seeded corpus.
- **Live**, on release, against staging, within a spending cap.

No eval uses real staff questions or real case details.

### A. Application evals

#### A1. Ask: answer quality and sources

**Measures.** For each question in a golden set:

| Measure | What it checks | Pass |
|---|---|---|
| (a) Citation validity | No reference to a passage that was not supplied; every citation resolves to a published `/r/[slug]` | 100% |
| (b) Support | Each cited sentence is entailed by its passage | At least 95% of cited sentences |
| (c) Uncited factual sentences | Long factual sentences with no citation (counter in `checkCitations`) | Mean at most 0.5 per answer; 0 for questions marked library-covered |
| (d) Expected-source recall | At least one of the expected sources is cited | At least 85% of library-covered questions |
| (e) Condition kept | Rules with "only if" or "unless" keep the condition (checklist) | 100% of condition items |
| (f) Names exact | Same-name confusions such as PACER Center versus federal PACER are kept apart | 100% |
| (g) General knowledge labelled | General-knowledge content carries no citations and is marked as general | At least 95% |
| (h) No DHS rule invented | DHS-specific rules not in the evidence are never presented as DHS policy, and the person or area responsible is named | 100% on the "unknown local rule" items |
| (i) Usefulness rubric | 1–5 scale for answer first, reasoning, application and length about 220 words | Median at least 4 from two reviewers on a rotating sample of 30 per release; inter-rater weighted kappa at least 0.6 |

**How.**
- Entailment and the rubric use a model grader with a fixed prompt and pinned model, calibrated against 50 items scored by people. Keep the grader if it agrees with people at least 85% of the time.
- Every release, a person audits 10% of items.
- Reuse BASE's quote-window check (`verify-live-ask-semantics.mjs`).

**Data.** About 150 synthetic questions in `evals/ask/golden.jsonl`. Each item has id, question, an optional earlier exchange, job family and area, class, expected source slugs, required facts, conditions to keep and forbidden claims. Classes:

| Count | Class |
|---|---|
| 60 | Covered by the library |
| 25 | Partly covered |
| 15 | Not in the library (general answer) |
| 15 | DSD as the model, applied across DHS |
| 10 | Same name, different thing |
| 10 | Decision questions where people decide |
| 10 | Tribal matters, which go to the responsible Tribal liaison |
| 5 | Follow-ups |

Seed the set from BASE's 13 live and 43 readiness cases, rewritten as data. Add rubric anchors.

#### A2. Ask always answers in words

**Measures.**
- Share of answers with `outcome = answered` and at least 40 words.
- Zero matches against a stock-reply list: "cannot answer", "try again", "nothing was found", "temporarily unavailable", "I'm not able", "as an AI", "please consult" with no content, and similar.
- The same holds under injected faults:
  - search throws;
  - embeddings fail;
  - the rerank budget is exceeded;
  - the writer fails once, then on every attempt;
  - the graph times out;
  - the database is unconfigured.

**How.** Unit tests with mocked `respondStream`, `retrieve` and `sql`, plus a nightly integration run.

**Pass.** 100%. The database-unconfigured and all-attempts-fail paths currently return stock text and **fail**. The owner needs to choose a non-stock fallback, for example a library-text answer from a static index.

**Data.** Fault matrix and stock-reply list in `evals/ask/stock-replies.json`.

#### A3. Ask speed

**Measures.**
- Time to first streamed text (client side).
- Total time (`timings.total_ms`, returned to the caller, not stored).
- `search_ms`, `graph_ms` (bounded at 600 ms) and `related_ms` (bounded at 800 ms).

**How.** The live runner reads timings from the response and computes percentiles over the golden set at fixed concurrency (1 and 5).

**Pass.**
- First text: p50 at most 2.5 s, p95 at most 5 s.
- Total: p95 at most 12 s.
- No answer over 45 s.

Set the baseline in the first run, then tighten the thresholds.

**Data.** The golden set.

#### A4. Ask follows the job family and reasons across the graph

**Measures.**
- The same question with no family and with each of the 10 families gives the same set of required facts (no family-specific invented facts).
- Related resources differ only in order.
- When the matrix says deep, the family's top related item is deep for that family.
- No answer infers anything about the person ("assume nothing else about them").
- Answers that cite a DSD resource say it comes from DSD.

**How.** Paired runs and a model grader check for invented facts or a profile of the person.

**Pass.**
- Fact sets equal on at least 95% of items.
- Related sets equal (as sets) at 100%.
- Zero profiling statements.

**Data.** 20 questions × 11 family settings.

#### A5. Content accuracy and wording rules (one shared linter)

**What it covers.** Every published resource body, Brief and Working reading, training string, rendered page text and Ask answer from A1.

**Rules.** Merge the five existing checkers into one:

| Rule | Detail |
|---|---|
| Banned words | "AI", "artificial intelligence", "tutor", "chatbot", "bot" in visible text |
| Responsible party | "office" for the responsible party (pattern from `lib/trainings/wording.ts`) |
| Retired terms | DEI, DEIA, DEAI outside official names; MMB "Leading with DEIA" held aside |
| System and participation language | "voluntary", "optional", "self-paced", "training credit", "is saved", "is recorded", "completion certificate" |
| Program voice | "we", "us", "our" outside quotations |
| Names | Staff names; character names in trainings |
| Labels | Program and status labels such as "Project recommendation" or "Existing DHS resource"; "coming soon", "TBD", "draft" |
| Acronyms | Not spelled out on first use |

**Also checked:**
- Every resource has a source name or URL, and sources are dated where the reading gives a figure.
- Brief and Working are word for word against Full (`isVerbatim`).
- Recorded transcripts are unchanged from their release hash (`recorded-fidelity`).

**Pass.** Zero violations, with an allowlist of official names and direct quotes. 100% of resources have a source. 100% verbatim.

**Data.** The allowlist file and the published corpus export (`data/kb/resources.jsonl` plus depth data).

**Fix first.** Retire the BASE test `lib/content/collections.test.ts:175`, which requires notices.

#### A6. Trainings

**Measures:**
- Schema check, `trainingProblems()` and `wordingProblems()` are empty for every training and every family draft.
- An all-staff version exists. Count the job-family versions against the owner's intended list.
- **Every path is walked** by exhaustive traversal: each path ends, each decision is reachable, and recovery decisions are reachable only after weaker choices.
- Each main decision has a strong choice with affirm-and-extend feedback.
- Options run 20–35 words, and the strong option is never the only longest.
- The shuffle is stable on server and page.
- Generated captions and transcript equal a fresh generation from the JSON (hash compare).
- The hero image exists and is at least 3840 px wide.
- Cast are C1–C8 only, with no names.
- `sources` slugs resolve to published resources.
- A browser run plays a full path by keyboard only, and the console and network show no writes (see A10).
- People check whether feedback fits the choice: two reviewers, 20 sampled choices per training, each rated "fits" or "doesn't".

**Pass.** All automated checks at 100%. Feedback fit at least 90%.

**Data.** `data/trainings/*.json`, `drafts/*`, `built/*`.

#### A7. Tagging quality (competency, job family, area)

**Measures:**
- A **gold set** of 250 items, stratified by block and kind. Two reviewers code each item independently, then settle disagreements.
- Competency top-1 accuracy, and top-3 precision and recall.
- `written_for` precision and recall.
- Area precision and recall.
- Human–human Cohen's kappa as the ceiling.
- Stability: re-tag 100 items with the same model; Jaccard similarity of the tag sets.
- Coverage: every family has at least one deep resource for each competency the matrix marks deep for it.
- No orphans (as `load-blocks` checks).
- Tribal items are tagged `tribes-community` and do not offer program training on Tribal relations.

**Pass.**
- Competency top-1 at least 85%.
- `written_for` precision at least 0.90.
- Area precision at least 0.90.
- Stability at least 0.90.
- Coverage 100%.
- Orphans 0.
- Model–human agreement at least 0.9 × human–human kappa.

**Data.**
- `evals/tagging/gold.jsonl`, started from the three existing `sample-for-review-*.json` files and `overrides.json`.
- `data/workforce/tags.json` and `area-tags.jsonl`.

#### A8. Accessibility

**Measures:**
- axe-core in a real browser on the top 40 routes in both apps. Include Ask with an answer shown, a training mid-simulation, a reading at each depth and the media player.
- Six keyboard-only journeys from PRD Req 03 and Principles:
  1. new colleague finds orientation;
  2. preparing a meeting;
  3. supervisor finds a resource and the person or area responsible;
  4. complete a training path;
  5. ask a question and open a source;
  6. switch depth.
- Focus is visible and the order is logical.
- Reflow at 320 CSS px with no horizontal scroll.
- 200% zoom.
- `prefers-reduced-motion` stops the hero loop.
- Every ready media part has captions and a transcript.
- Print preview contains the full text.
- Contrast is computed from rendered styles.
- Readability bands are reported against the Ask target (grade 11–13 explanation, 8–10 instructions) but do not gate the release.

**Pass.**
- 0 serious or critical axe violations.
- All six journeys complete.
- 100% media alternatives.
- Contrast at least 4.5:1 for text and 3:1 for non-text.

Automated checks do not establish conformance: each quarter, a person tests with a screen reader on the same journeys, and the findings are recorded.

**Data.** A route list and journey scripts. Playwright with `@axe-core/playwright` is new tooling to add.

#### A9. Privacy: nothing records learning

**Static checks (unit):**
- No SQL `insert`, `update` or `copy` reachable from a staff request path except an allowlist: owner `manage` actions, and user-shared records once they exist.
- No table named like `*log*`, `*event*` or `*view*` that is written from staff routes.
- `ask_log` is absent from migrations, or a migration drops it.
- No `console.*` call in a staff route logs request body fields.
- No analytics or beacon code.
- No form or `router.push` puts typed text in a URL.
- The cookie inventory equals the allowlist: job family, area, depth and owner session.
- `PRACTICE_COUNTERS_ENABLED` is false, or the counter code is removed.
- No component renders usage counts.
- No visible text claims counting.

**Dynamic checks (integration):**
- Run the A8 journeys plus 20 Ask questions against a test database with `log_statement = 'mod'`.
- Capture server stdout and stderr and all outgoing network requests.
- **Pass:**
  - zero data-changing statements outside the allowlist;
  - zero occurrences of any question text, typed text or visited slug in logs or the database;
  - the browser makes requests only to its own origin and the approved model provider (server side only);
  - browser storage changes only under the allowlisted keys, and only on the device.

**Data.** Sentinel strings, for example `ZQX-SENTINEL-1234`, put into every text box and question and searched for afterwards.

**Pass overall.** Zero, on every release.

#### A10. Links, sharing and downloads

**Measures:**
- A crawl of all published routes in both apps: internal links and fragments with 0 broken; external links with at most 2% broken (weekly, with retries for bot challenges).
- Every Ask citation and related link resolves.
- Each share link opens exactly its item, carries no hidden query state, and does not show other items (reuse BASE `share-link-test.mjs` without `SEND`).
- Downloads for each course and resource in Word, Excel, PowerPoint, printable and plain text are valid files (reuse BASE `smoke-dsd-services.cjs`). **The text inside contains the item's title, first heading and source line.**
- Click depth from the home page: every published resource within 3 selections.

**Pass.**
- 0 broken internal links.
- Downloads 100% valid and 100% content-matched.
- Click depth at most 3 for at least 95%, with a list of exceptions.

NEW fails until downloads exist.

**Data.** The route list from the sitemap and corpus.

#### A11. Performance

**Measures.** For the landing page, Learn, Library, `/r/[slug]` (long and short), a training and Ask, on a throttled mid-tier laptop profile:
- time to first byte;
- largest contentful paint;
- interaction to next paint;
- transferred bytes.

Also:
- media start time (206 first byte);
- time from Listen to first audible playback (PRD Req 14), where Listen exists;
- build trace budgets from BASE.

**Pass** (75th percentile):
- largest contentful paint at most 2.5 s;
- interaction to next paint at most 200 ms;
- time to first byte at most 800 ms;
- media first byte at most 1 s;
- first audible playback at most 3 s.

Set baselines first, then tighten.

#### A12. Findability tasks (automated part)

**Measures.** For 30 representative tasks, for example "prepare an accessible meeting" or "language access checklist":
- does Library search return the expected item in its top 5;
- does Ask cite it;
- is it reachable by navigation within 3 selections.

**Pass.** At least 90% on each of the three.

**Data.** `evals/findability/tasks.jsonl`.

(The part done with people is section B, outcome `staff_capability`.)

#### A13. People decide; private details stay out

**Measures.**
- For the 10 decision questions in A1 and 10 prompts carrying private details: answers never approve, decide eligibility or rank people, and they name the person or area responsible.
- Prompts with private details get a real answer to the general question, without repeating the details.
- Every text input shows the reminder.

**Pass.** 100%.

### B. Program evaluation

#### Ground rules, from the code and Principles

1. **Allowed evidence:**
   - records people choose to keep or share;
   - plans and reviews;
   - before-and-after artifacts;
   - voluntary feedback with no identity;
   - DHS administrative data owned by the person or area responsible, in aggregate with small cells suppressed.

   **Never allowed:**
   - page views;
   - completions;
   - time spent;
   - check answers;
   - Ask counts;
   - attendance tied to learning;
   - any count of learning activity, including anonymous totals.
2. **Responses are evaluated; people never are.** No scores, ranking or individual records (`employeeRankingPermitted: false`).
3. **Every finding is labelled.**
   - Its level: **delivery**, **application** or **benefit** (`programMeasurementRules`).
   - Its source: participant report or independent observation.
   - Its limits.
   - Empty evidence means "not yet evidenced", not "no change".
4. **Every evaluation states** its question, sample, period, findings, limits and responsible role (PRD Req 27).

#### B1. Evidence sources to build or reopen (all privacy-respecting)

| Source | Holds | Status | Needed |
|---|---|---|---|
| Shared decision record | Decision, who was affected, evidence, alternatives, responsible owner, review date | Exists in BASE (team space) | Port to NEW. Add optional `goalActionIds` and `outcomeId`. |
| Voluntary outcome story | Problem, action, change, observed result, follow-up, retain/revise/stop | Schema exists, API closed | Reopen as a one-screen form without identity. Keep consent and the private-details check. Store month only, not a timestamp. |
| Before-and-after artifact pair | The notice, form, meeting plan or job posting before and after, with a short note | New | Upload to a shared record by choice. Keep public or de-identified text only. |
| Review record | An equity review of a decision: tool used, findings, disposition | Toolkit and policy cases exist | Link to goal and action. |
| Program work receipt | Owner tasks, preparation plans, results, dispositions | Exists (owner) | Use as the record of each improvement cycle. |
| One-question feedback | "Did this help you do the work? What would make it better?", anonymous, free text plus a 3-point scale, offered on a resource or tool | New | <ul><li>No identity, no IP, no page path finer than the resource.</li><li>Not tied to any session.</li><li>Reviewed as themes.</li><li>Never counted as reach.</li><li>**Owner approval needed**, because a submission count could act as a usage proxy. Report themes, not totals.</li></ul> |
| Representative task sessions | Facilitated, consented sessions on the three PRD journeys | New, quarterly | 5–8 volunteers per round. Record where people hesitate. No names in notes. |
| DHS aggregate data | Service access by race and ethnicity (baseline dashboard), retention and hiring by group, accommodation timeliness, interpreter timeliness, vendor participation | Partly (baseline FY22–24) | Data-sharing agreement with the ADSA Equity Director and HR. Suppression rules. Period. |
| Community "you said, we did" | Input received, what changed, what did not and why | Planned in the three-year plan | A record per engagement, written by the goal lead. |

#### B2. Indicators by logic-model level

| Level | Indicator | Evidence | Evidence level |
|---|---|---|---|
| Inputs | Sources current: share of resources with a dated source checked in the last 12 months; corrections handled within 30 days | Content records, A5 | Delivery |
| Activities | Owners named for each goal and work area; leaders' reviews held with decisions recorded; equity reviews offered before key decisions | Program work records, meeting notes | Delivery |
| Outputs | Published resources meeting the A-layer bars (accessible, sourced, shareable); tools available for each of the 28 actions | A-layer results | Delivery |
| Short-term outcomes | Representative tasks completed with reasoning (B1 sessions); voluntary stories of a first application; documented barriers identified | Task sessions, stories, review records | Application (participant report) |
| Intermediate outcomes | Key decisions with a completed equity review and a recorded disposition; changed meeting or supervisory practices with a review; comparable work done with less help (follow-up account) | Shared decision records, before-and-after pairs, receipts | Application (observed, where a decision owner confirms) |
| Long-term outcomes | Gaps narrowing in priority service measures; two-year retention gap by group; accommodations and interpreters on time; community input acted on; maintained resources reused in later decisions | DHS aggregate data, "you said, we did", decision records citing earlier work | Benefit (contribution, not causation) |

#### B3. Indicators per outcome (the seven)

| Outcome | Indicator (no learning counts) | Source | Reviewer |
|---|---|---|---|
| `staff_capability` | Quarterly task sessions: participants could find a source, prepare an accessible meeting or notice, name who to involve and explain the next step. Themes of where they hesitated. | B1 task sessions | Owner plus one goal lead |
| `capability_transfer` | Follow-up stories where a person did comparable work independently, with what they could and could not do alone | Voluntary stories | Owner |
| `access` | Barriers documented and corrected, each with a check that people can now complete the task; accommodation and interpreter timeliness | Before-and-after pairs, review records, DHS data | Goal 6 lead, accessibility contact |
| `workplace_culture` | Changed practices with a review (meeting formats, onboarding, interview panels); climate survey results by group from HR's own survey | Decision records, HR aggregate | Goal 3 lead, HR partner |
| `institutional_application` | Decisions (policy, budget, technology, procurement) with a review and disposition by the decision owner | Shared decision and policy cases | Decision owners, leaders' review |
| `organizational_memory` | Corrections that reached all affected guidance (traced); decisions that cite an earlier maintained resource or decision | Content revisions, decision records | Owner |
| `agency_coherence` | Adaptations of a DSD practice by another division or administration, each with what changed for local context; pilot findings that led to an expansion decision | Program work records, area records | Owner, administration contacts |

#### B4. Indicators per ADSA goal

The two evidence questions of each action (`adsa-implementation.ts`) become the review prompts. The action's `workProduct` is the artifact sought.

| Goal | Delivery (Year 1) | Application (Year 2) | Benefit (Year 3) | Evidence artifacts |
|---|---|---|---|---|
| 1 Eliminate Disparities | Division equity team chartered (1.1); disparity goals with baselines (1.2); action plan per goal (1.3) | Share of key decisions with a completed Toolkit review and disposition (1.4); measure definitions approved (1.5) | Priority service gaps narrowing by race, disability, language and place | Charter, goal proposals, decision records, baseline dashboard |
| 2 Community Engagement | Engagement plans with accessible participation and payment where policy allows (2.3, 2.5) | Decisions with community input before they are final; "you said, we did" items closed (2.4); advisory council consulted (2.1) | Communities report being heard: their own words, gathered by the goal lead | Engagement plans, feedback accounts. Tribal Consultation training stays in the official system (2.2). |
| 3 Hiring and Retention | Job descriptions and hiring steps reviewed; panel guidance adopted (3.3, 3.5); onboarding plan (3.4) | Panels formed to the guidance; ERG and Engagement Committee support in practice (3.7, 3.8) | Two-year retention gap by group (3.6); climate results by group (3.1, from HR's own survey) | Review records, HR aggregate |
| 4 Learning and Development | Learning and application plans for staff and hiring managers (4.1); skills and leadership opportunities listed (4.3) | Voluntary stories of learning applied, and task sessions. **Never completions from this app.** IDI follows the official ADSA IDI plan, outside this app (4.2). | Capability transfer stories; leaders' accounts of changed practice | Plans, stories, task sessions |
| 5 Contracts and Procurement | Toolkit review of current practices (5.1); outreach plan (5.3) | Solicitations changed after a review; venues added | Vendor participation against verified benchmarks (5.2) | Review records, procurement aggregate |
| 6 Communication and Accessibility | Inclusive-language guide (6.1); CLAS crosswalk (6.4); calendar plan (6.2) | Communications revised after review, with a check that people can complete the task (6.3); remediation closed | Fewer access complaints; requests met on time | Before-and-after pairs, accessibility records |

#### B5. How a PDSA cycle runs

It uses the framework's improvement cycle and the program work record (section 3.5):

1. **Plan** (Assess, Plan).
   - The owner or a goal lead opens a program task with `goalActionIds` and `outcomeIds`.
   - State the question, the change, who is affected, a **prediction** and the measure. Use the ten measure fields; the population and comparison must not involve learning activity.
   - Name the decision owner and the review date.
   - Example: Goal 6, ADSA 6.1 and 6.3. A unit's appointment notice is hard to act on. Prediction: a plain-language rewrite cuts the questions callers ask about the next step.
2. **Do** (Implement). Try it small: one unit, one notice, one month. Keep the before-and-after versions. Record what actually happened (`applied`).
3. **Study** (Measure, Learn).
   - Compare against the prediction, using the measure and people's accounts. In the example: the unit's call-reason tallies, which are an operational record of the service, not of staff learning; feedback from people using the notice; and staff observations.
   - Record observation, evidence, limitations and confidence (`results_recorded`).
   - Label the level (application or benefit) and whether it is participant report or independent observation.
4. **Act** (Improve).
   - The decision owner records retain, revise, stop or not yet known, with the next action and the implementation owner (`decision_recorded`).
   - Report back to the people who contributed ("you said, we did").
   - Carry the learning into the next comparable task. That is organizational memory.

**Cadence.**
- Cycles run when the people involved agree, not on a calendar.
- The quarterly program review reads every closed and open cycle and writes the evidence summary by level.
- The annual refresh revises measures and the logic model.
- **A-layer results inform the program, but are reported apart from the program's outcomes.**

#### B6. Who reviews

| Review | Who | What |
|---|---|---|
| Each cycle | The decision owner, plus the goal lead for that ADSA goal | Prediction against result, disposition |
| Monthly | One DSD Team (the standing volunteer committee) | Open cycles, "you said, we did", themes from voluntary feedback |
| Quarterly program review | Owner, goal leads, leaders' review | Evidence summary by level, A-layer results, decisions to retain, revise, connect, support or stop |
| Data | ADSA Equity Director and HR partners | Aggregate DHS data, suppression, comparison period |
| Community | Goal 2 lead with community partners; the responsible Tribal liaison for Tribal matters | Whether input changed decisions |
| Accessibility | Accessibility contact; users of assistive technology | A8 findings with people |
| Independent check, yearly | A reviewer outside the program, for example a DHS research and evaluation colleague | Method, limits, whether claims match their evidence level, privacy compliance of the evaluation itself |

#### B7. Decisions needed before building

The owner needs to decide:

1. Section 4, P1–P4: drop `ask_log`; whether anonymous Ask run totals are allowed; rewrite of the three planning documents and the three-year plan learning measures; the PRD reach sentence.
2. Reopen voluntary outcome sharing, with or without the one-question feedback.
3. Which job-family training versions are intended, as the A6 baseline.
4. The non-stock fallback when Ask has no database or every attempt fails (A2).
5. Whether the improvement cycle should be named Plan-Do-Study-Act in visible text, or keep its present stage names with the mapping kept internal.

---

*Route and check inventories for BASE were compiled from the working tree at 7c8860c on 2026-11-15. Reconfirm counts if the branch moves.*
