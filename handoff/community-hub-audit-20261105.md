# Community hub audit: knowledge graph and community content (2026-11-05)

This is a read-only audit of `C:\Users\garyb\Projects\one-dsd-community-hub-20261105` at HEAD `445669d`, run before the community outreach and engagement hub is built.

While the audit ran, another session was editing the working copy. Those uncommitted changes were: `knowledge-graph.ts` (it now adds `organization:` nodes and `serves_community` edges), `program-resources.ts`, `staff-surface-registry.ts`, and new files under `app/community-outreach/`, `components/hub/`, `lib/content/hub/` and `lib/intelligence/retrieval/organization-docs.ts`. The graph numbers below include those edits. Where a finding comes only from the in-progress hub work, it is labelled "(hub WIP)".

Scratch scripts and raw output are in `C:\Users\garyb\AppData\Local\Temp\claude\44e295221371186a\eeae6535-9ca8-486a-815f-e8ce54b96b0d\scratchpad\audit\`:
- `graph.audit.ts`, with output in `graph-out2.json`
- `content.py`, with output in `content-out.json`
- `figures.py`, with output in `figures-out.json`

## Test runs (read-only)

| Run | Config | Result |
|---|---|---|
| `scripts/corpus/knowledge-graph-check.maintenance.ts` | `scripts/testing/vitest.maintenance.config.mts` (run from the scratch folder as working directory, so the report it writes to `evidence/` stayed out of the worktree) | **PASS** (1/1). Isolated nodes 0, readingsWithoutWork 0, booksWithoutUse 0, resourcesWithoutBook 0, reading-link targets with no node 0. |
| `lib/intelligence/retrieval/brain.test.ts`, `dynamic-public-route-docs.test.ts`, `public-learning-docs.test.ts`, `search-supervisor-links.test.ts`, `lib/content/research-markdown.test.ts`, `lib/content/collections.test.ts`, `components/community-research-sections.test.tsx` | Temporary config in the scratch folder: root = worktree, `@` alias to the worktree, `server-only` alias to the stub | **PASS**: 7 files, 55 tests |
| Custom graph audit (`graph.audit.ts`) | Same temporary config | Completed. Results are below. |

There was one caveat. `brain-content.ts` finds the research and profile folders through `process.cwd()`. When the run starts from any folder other than the worktree root, Ask silently indexes 0 research and 0 profile documents. My first run hit this. Production is unaffected, but the brain test would wrongly report a pass-or-fail for the wrong reason if it is started from elsewhere.

Graph totals (`knowledgeGraph()`):
- **Nodes:** 1,230. That is 8 themes, 3 levels, 6 series, 812 resources, 304 readings, 13 paths, 42 briefs and 42 organizations (hub WIP).
- **Edges:** none dropped. I re-derived every intended edge from the source JSON, because `addEdge` silently drops an edge whose end node is missing. All targets exist.

`contentGraphForDocs` (DSD scope, run from the worktree):
- 10,148 documents, including 3,485 community-research or profile documents across 39 communities.
- Every research document has its `about_community` edge.
- 0 lesson documents are missing their parent.

---

## Must fix (errors a user would see)

1. **Graph nodes with links that 404: 5 resource nodes.** In `lib/content/knowledge-graph.ts:34`, `resourceHref()` sends every non-course id to `/library/<id>`. These 5 ids are in `resource-organization-data.json`, but `getPublishedStaffContent` has no item for them, so `app/resources/[id]/page.tsx:61` returns notFound:
   - `practice-guide-inclusive-meetings`: the real page is `/practice-guides/inclusive-meetings` (see `decision-workspace.ts:97`).
   - `practice-guide-clearer-processes`: the real page is `/practice-guides/clearer-processes`.
   - `practice-guide-review-a-change`: the real page is `/practice-guides/review-a-change`.
   - `podcast.equity-toolkit`: the real link is `/learn/equity-toolkit#podcast-equity-toolkit` (see `podcasts.ts:8`).
   - `podcast.anti-racism-public-service`: the real link is the equivalent podcast anchor.

   They carry theme edges (access, partnership, policy, evidence, identity). `relatedItems()` can therefore surface them as "Shares the theme …" links that lead to a 404.

   **Fix:** map the `practice-guide-*` and `podcast.*` ids in `resourceHref`.

   I checked this against the static catalog only. If the live Postgres catalog has published these 5 ids, the links resolve in production. Confirm before changing anything.

   The other 72 non-resolving ids are `self-directed-*`. Those are fine, because `resources/[id]` redirects them (line 52).

2. **13 of 14 briefs are marked `under_review` / `representationReview: "pending"`, yet the live community page shows their content.** The 13 are the lines `status: "under_review"` at `lib/content/briefs.ts` 69, 151, 218, 250, 283, 347, 380, 406, 432, 458, 484, 510 and 536.
   - `communityDesignEnabled()` returns true, so `/minnesota-communities/[id]` renders `CommunityDesignPage`. That page shows `level0`, the practice considerations, sources and observances for any brief. It never calls `briefVisible()`.
   - Search, Ask and the CI agent all filter briefs through `briefVisibleToStaff` (`search.ts:129,180`, `ci.ts:76,85,107`).
   - The result: the same text is public on the page but excluded from search and Ask. `brief-visibility.ts` says held drafts are "never" shown to staff.

   **Fix:** decide which is true. Either set the reviewed briefs to `approved`, or gate the practice section on `briefVisible`.

3. **Draft headings visible on community pages** (`lib/content/community-design-data.json`):
   - **`native-american` (all 9 chapters):** the headings are numbered drafting labels, for example "0. How to use this — who this is, who this is not", "9. Other considerations — unvarnished", "15. How it hits DHS gates — the 40%" and "16. What you will not conclude". `chapterTitle()` (`components/community-design-page.tsx:44`) and `community-reading-surface.ts:42` rewrite only headings that *start* with "How it hits DHS gates". The "15." prefix gets past that rewrite.
   - **`somali` chapter 27:** the heading "Numbers — date them" is shown as a chapter title.

   The live surface may have stored values that differ from the JSON. Check the live page.

4. **Ask indexes the hub's organization pages as isolated documents (hub WIP).** 23 documents have no graph edge, for example `document:/community-outreach` and `document:/community-outreach/organizations/the-arc-minnesota`. The cause is that `nodeIdForHref` (`knowledge-graph.ts:113`) has no rule for `/community-outreach/organizations/<slug>` → `organization:<slug>`. Graph expansion in Ask cannot reach them.

   Also, only 28 `serves_community` edges exist for 42 organizations, so several organizations attach to no community page.

---

## Should fix (stale or unclear content)

### Status and review dates
- **Briefs (14):** every `reviewDate` is `2027-01-15` (the `REVIEW` constant in `briefs.ts:53`), so none has passed. 13 are `under_review` (see Must fix 2). `tribal-nations` is `gated` but still `representationReview: "pending"`. No brief has `representationReview: "reviewed"`.
- **Community research (39 files):** `about.lastChecked` is 2026-10-30 in all files. 1,016 entries have `checked` 2026-10-30 and 4 have 2026-10-29. All are current, but none has a review or expiry date.
- **Community profiles (`community-360`, 39 files):** these have **no date field at all**: no checked date, no lastChecked, no reviewDate. 468 of their 1,138 businesses are marked "could not confirm open" and 28 are "closed".
- **Recovered readings (`community-design-data.json`, 41 entries):** no review date.
- **Communities without a brief:** 28 of the 42 communities have no `BRIEFS` entry, for example ukrainian, mexican and chinese. Their pages therefore have no "Practice considerations", no "Sources" section and no related guided practices in "Continue the connection".

### Sources without a link, or with a link that is not https
- **`briefs.ts`, no link:**
  - "Program guidance" at lines 137, 241 (karen), 423 (khmer), 449 (lao), 475 (russian-speaking) and 501 (arabic-speaking).
  - MDH 2014 Somali autism study (line 136) and MDH 2014 Hmong autism study (line 207). Both have a note saying "verify the current citation". The research files cite this report at `https://www.leg.mn.gov/docs/2014/mandated/140404.pdf`.
  - The Minnesota African American Family Preservation and Child Welfare Disproportionality Act (line 335).
- **`briefs.ts`, generic links:** six "Minnesota Compass … profile" sources link to the site root `https://www.mncompass.org/` (lines 135, 206, 274, 336, 371, 397, 553). The research files already use the specific profile URLs, for example `https://www.mncompass.org/topics/demographics/cultural-communities/somali`.
- **`community-research/*.json`:** none. Every source and organization has an https link.
- **`community-360/*.json`, http rather than https:**
  - `african-american.json`: 9 business links on visitsaintpaul.com and minneapolis.org, and 2 source lines.
  - `indian.json`: businesses[14] and 3 sources (mngujaratisamaj.org, kannadamn.org, localfiles.com).
  - `mexican.json`: businesses[18–19] and 1 source.
  - `ethiopian.json`: 1 source (minnesotaselassie.org).
  - `vietnamese.json`: 1 source (stadalbertchurch.org).
- **`community-360/vietnamese.json`, sources with no URL:** items 27, 29, 31 and 33, for example "33. Business pages in the accompanying business list."

### Visible verification notes and editorial instructions
- **Brief text shown to staff:**
  - `briefs.ts:524`, deaf brief, "Who to involve": "Minnesota's Deaf, DeafBlind, and Hard of Hearing State Services Division as a resource (verify current contact)". The division exists under that name in 2026 (Minn. Stat. 256C.233), so the caveat can be removed.
  - The source notes at lines 136, 207 and 335 say "verify"; the page does not show notes.
- **`community-design-data.json`:** 57 instances of "date the number you cite / use" and 7 of "date them". Examples:
  - hmong chapter 14: "…31 percent speak English less than 'very well,' so date the number."
  - somali chapter 15: "Poverty rates are high in Compass figures, so date them."

  The text tells the reader to date a figure rather than giving its year.

### Figures stated without a year
My scan looked at sentences that contain a count or percentage and no four-digit year. It found 1,830 such sentences. Many are dated by a neighbouring sentence or a linked ACS table, so treat the count as an upper bound. The undated ones that matter most are in the recovered readings, which carry no data vintage:
- `community-design-data.json` somali chapter 27: "Median household income is about $49,554, 30.9% are below poverty, 84.4% rent, and average household size is about 4.07." The text says only "in that vintage".
- `community-design-data.json` somali chapter 0: "about 77.3% live in the Twin Cities; 45.7% are age 17 or younger …".
- `community-design-data.json` hmong chapter 0: "About 38 percent are age 17 or younger, and about 32 percent are foreign-born".
- `community-design-data.json` hmong chapter 4: "Compass puts the average household size at about 4.3."
- `community-design-data.json` african-american chapter 0: "It numbers about 42.9 million people nationwide".
- `community-design-data.json` minnesota chapter 8: "Alongside are Catholic (18 percent; …".
- `community-360/somali.json` section 0: "In the Compass pool, 77.3 percent live in the Twin Cities". The Compass link is there, but the year is not.
- `community-360/hmong.json` section 1: "Median household income is $92,644, give or take $6,476." No year is given.
- `community-360/rural.json` section 0: "comes to about 29.7 percent of Minnesotans, or 1.69 million people" and "Greater Minnesota had about 2,570,000 people." The ACS 2024 5-year table is linked later in the paragraph, not in the sentence.
- `community-research/somali.json` organizations.entries[17]: "Its own site estimates about 40,000 Somali speakers in that range."
- `community-research/hmong.json` disability.context[1]: "31 percent were single-parent households". This comes from the 2014 MDH study, but the year is not in the sentence.

Full per-file list: `figures-out.json` in the scratch folder. The counts are highest for community-design-data (365), latino-360 (72), mexican-360 (54) and rural-360 (50).

### Claims checked on the web (13 checks)
| Organization or office | Content says | Finding |
|---|---|---|
| **Women Organizing Women Network** (`community-research/somali.json:1113`, organizations) | An active women's civic leadership group | **Out of date name.** The group rebranded as **Ayada Leads**: its site says "formerly known as the Women Organizing Women (WOW) Network". Rename the entry and keep WOW Network as an alias. |
| WellShare International (somali) | Active | No closure found. Current filings show it operating. |
| HACER (latino) | Active | Active (St. Paul and a Mankato office). |
| Nasha Shkola Charter School (russian-speaking) | Active. The text places it in Minnetonka "at that time" (2016). | Active: 2024–25 enrollment, Brooklyn Park campus. The text could give the current location. |
| Theatre Novi Most (russian-speaking) | Active | Active. No 2026 season found. |
| Celtic Junction Arts Center (european-american) | Active | Active. Capital campaign reported in Oct 2025. |
| Voices for Racial Justice (guatemalan) | Active | No closure found. |
| Hmong National Development (hmong) | 20th conference held in Minneapolis in 2025 | Confirmed (April 2025, Hilton Minneapolis). |
| Asian American Press (filipino, vietnamese) | No longer publishing | Consistent with its own site ("1982–2020s"). No closure date found. |
| China Insight (chinese) | Could not confirm recent issues | Consistent. The latest evidence is from 2023. |
| Arc Greater Twin Cities (`community-research/minnesota.json`) | Mentioned only as history | Correct. It merged into The Arc Minnesota. |
| Yalla Count MENA In! (lebanese) | A coalition page using 2013–2017 estimates | This was a 2020 Census campaign, and the page's data is old. Present it as historical. |
| DHS Deaf, DeafBlind and Hard of Hearing State Services Division (deaf brief) | "verify current contact" | The division exists under this name (statute 256C.233, regional offices updated in 2026). |

### Duplicate entities
- **36 brief/course pairs with the same title.** Each `brief:X` has a course `course-cultural-intelligence-X` with an identical title, for example "Somali Minnesotans" and "Hmong Minnesotans". Both appear in related-item and search lists with no way to tell them apart. Give one of each pair a distinguishing title or kind label.
- **4 resource duplicates:**
  - `course-dhs-equity-analysis-toolkit` and `ext-dhs-equity-toolkit`
  - `course-div-f01-white-privilege` and `self-directed-F06`
  - `course-dc-l95-plain-language-as-an-equity-practice` and `self-directed-F16`
  - `course-dsd-positive-supports` and `course-dc-l18-positive-supports-and-reducing-restrictive-pract`

### Suggested readings and related guided practices: spot-check
I spot-checked somali, hmong, karen, african-american, deaf, rural, latino, oromo, ukrainian and the three Native pages. The book choices fit their communities. All 84 suggested-reading ids resolve, and every `relatedPathIds` entry resolves.

Possible mismatches:
- **`tribal-nations`** has related guided practices gp-3 ("Community engagement or shared design effort") and gp-1. On a deference page that refers people to government-to-government consultation, gp-3 points to the program's own engagement process. Consider removing it.
- **The three Native deference pages** each show two suggested books, from `community-reading-suggestions.json`. See Native deference below.
- **african-american and minnesota** share reading-160, *A Good Time for the Truth*. This is acceptable but noted.
- **ukrainian** and the other 27 communities without a brief show no guided-practice links at all. That is a coverage gap, not a mismatch.

### Native deference
The rule is met for research, profile and community-360 content:
- No `community-research/` or `community-360/` file exists for `native-american`, `tribal-nations` or `alaska-native`.
- `loadCommunityResearch` and `publishedCommunityProfile` both return null for `RESEARCH_EXCLUDED_COMMUNITY_IDS`.
- `CommunityCollectionAddition` returns null for these pages.
- The new hub graph code skips Native communities.
- In Ask's index, all 3,485 research and profile documents belong to the 39 other communities. The only Native documents are the 3 page documents themselves, plus the two `cultural-intelligence-*` courses.
- `cultural-calendar.json` has no entries for these ids.

Gaps to decide on:
1. **Ask indexing relies on the files being absent.** `brain-content.ts` (`communityResearchDocs`, `communityProfileDocs`, `culturalCalendarDocs`) does not check `RESEARCH_EXCLUDED_COMMUNITY_IDS`. If someone adds `community-research/native-american.json`, Ask would index it even though the page would not show it. Add the exclusion there.
2. **The deference pages still show program-written community content.** This is recovered reading content, not research:
   - `tribal-nations`: 30 chapters, about 29,000 characters
   - `alaska-native`: 30 chapters, about 15,000 characters
   - `native-american`: 9 chapters, with the draft headings described in Must fix 3

   Each page also shows two suggested books. In addition, `/courses/cultural-intelligence-native-american` (6 lessons) and `/courses/cultural-intelligence-alaska-native` (13 lessons) are published and indexed. The notice on these pages says the program "does not complete or expand this content on its own". The owner should confirm that this recovered material is meant to remain.

### Smaller items
- `community-360/hmong.json` section 2 and `lebanese.json` section 4 tell readers that an organization's website "was only a placeholder" (the Hmong chamber and the St. Maron parish). This is accurate, but the claim needs re-checking over time.
- `brain-content.ts` uses `process.cwd()` to find its folders (see the test caveat above).

---

## Inventory

### Community ids by source
Columns:
- **B** = `BRIEFS` (14)
- **D** = `community-design-data.json` (41)
- **R** = `community-research/*.json` (39, plus `_minnesota-access.json`)
- **P** = `community-360/*.json` (39)
- **S** = `community-reading-suggestions.json` (42)
- **A** = `community-collection-additions.json`
- **C** = `cultural-calendar.json` communities and titles

All file names match their `communityId`, and no id is spelled differently between sources. The knowledge graph has 42 `brief:` nodes, the union of B and D.

| id | B | D | R | P | S | A | C |
|---|---|---|---|---|---|---|---|
| african-american, arabic-speaking, hmong, karen, khmer, lao, latino, oromo, rural, russian-speaking, somali, vietnamese | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| deaf-deafblind-hard-of-hearing | ✓ | – | ✓ | ✓ | ✓ | ✓ | ✓ |
| american, amharic, bosnian, burmese, chinese, colombian, cuban, ecuadorian, ethiopian, european-american, filipino, french, guatemalan, indian, japanese, kenyan, korean, lebanese, liberian, mexican, minnesota, nigerian, puerto-rican, salvadoran, thai, ukrainian (26) | – | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| tribal-nations | ✓ (gated) | ✓ | – | – | ✓ | – | – |
| native-american, alaska-native | – | ✓ | – | – | ✓ | – | – |

### Organizations
Counts: 928 research `organizations.entries`, 171 research `institutions`, 83 `disability.communityRoutes` and 1,138 community-360 `businesses`. The full list, with community, source section, link and checked date, is in `content-out.json` → `orgs`. The research organization names for each community are in the audit transcript. Examples: somali has 33 (Confederation of Somali Community in Minnesota … SBS Somali), and rural has 39.

**Matches with the 42 partner explainers** (`dsd-partner-explainers-20261105/data/*.json`), name or alias:

| Explainer | Found in community content (community, section) | Spelling or variant note |
|---|---|---|
| Advocating Change Together, Inc. (ACT) | minnesota: institutions, disability routes | "Advocating Change Together" (no "Inc.") |
| Autism Society of Minnesota (AuSM) | oromo: research text; oromo-360 | Prose mentions only, no entry |
| Centro Tyrone Guzman (Centro) | colombian, latino, puerto-rican: organizations; mexican: institutions; disability routes in colombian, mexican, puerto-rican | Also shortened to "Centro" in several 360 files |
| Korean Service Center | korean: organizations, disability routes | Same spelling |
| Metropolitan Center for Independent Living (MCIL) | hmong and minnesota research text; american-360 and minnesota-360 | Prose only |
| Minnesota Association of County Social Service Administrators (MACSSA) | rural-360 | Acronym only |
| Minnesota Council on Disability (MCD) | minnesota: organizations, plus prose in 8 files | Same spelling |
| Minnesota Deaf Muslim Community (MDMC) | deaf research and 360; somali-360 | Same spelling |
| Minnesota Disability Law Center (part of Mid-Minnesota Legal Aid) | minnesota: organizations, plus prose in deaf, oromo, thai and `_minnesota-access` | Variants "Minnesota Disability Law Center" and "Mid-Minnesota Legal Aid" |
| Multicultural Autism Action Network (MAAN) | amharic: disability routes; oromo: institutions and routes | Same spelling |
| Sewa Asian Indian Family Wellness (SEWA-AIFW) | indian: institutions, routes, businesses | **Variants:** "SEWA–Asian Indian Family Wellness" (en dash), "SEWA-AIFW", "SEWA-AIFW SAPNA", "SEWA-AIFW crisis line and services" |
| Somali Community Resettlement Services (SCRS) | somali: organizations, routes | Same spelling |
| Somali Parents Autism Network (SPAN) | somali: institutions, routes; "SPAN" also appears in latino-360 | Same spelling |
| Southeastern Minnesota Center for Independent Living (SEMCIL) | rural: organizations; latino: routes; salvadoran-360 | Explainer adds "Inc." |
| The Arc Minnesota | european-american and minnesota: institutions and routes | **Variants:** "Arc Minnesota", and "Arc Greater Twin Cities" (historical predecessor) |
| Institute on Community Integration, University of Minnesota (ICI) | american and somali: institutions, plus prose in 17 files | Variant "Institute on Community Integration" without the university |
| Maangaar Global | somali research and 360 mention the "Maangaar Summit" | Possibly the same organization, named here only by its event. Confirm. |

**No match in community content (25):** Adaptive Wilderness Within Reach, Aging Options, ARRM, Capital Health Services, Epilepsy Foundation of Minnesota, Kaposia, Lifeworks, Lighthouse Center for Vital Living, Lincoln PTO (Hibbing), LiveLife Therapy Solutions, MacPhail Center for Music, Minnesota First Community Solutions, MN-NEAT, PHASE, Pluto Noodle, Quillo, Residential Services of Northeastern Minnesota, Rise Inc., Shakir Consulting Services, St. David's Center, Strengths at Work, Touchstone Mental Health, Udac, United Care Services and Upstream Arts.

**The same organization under different spellings within the community research lists.** These should be normalized before the hub builds an organization index:
- CLUES / "Comunidades Latinas Unidas En Servicio" / "Comunidades Latinas Unidas en Servicio (CLUES)" / "CLUES (Comunidades Latinas Unidas En Servicio)": cuban, guatemalan, mexican, puerto-rican, salvadoran
- "El Rey 94.9 FM" / "94.9 El Rey" / "Radio Rey"
- "Univision Minnesota" / "(WUMN)" / "(WUMN-LD)"
- "Telemundo Minnesota" / "Telemundo Minnesota (KJNK-LD)"
- "Latino Economic Development Center" / "… (LEDC)"
- "Latino Chamber of Commerce of Minnesota" / "Latino Chamber of Commerce Minnesota"
- "Minnesota Council on Latino Affairs" / "… (MCLA)"
- "La Prensa de Minnesota" / "… (LCN Media)"
- "Radio Jornalera" / "Radio Jornalera Minnesota"
- "COPAL" / "COPAL (Comunidades Organizando …)"
- "Church of the Incarnation" / "Incarnation-Sagrado Corazón de Jesús" / "Sagrado Corazón de Jesús (Minneapolis)"
- "Our Lady of Guadalupe Catholic Church" / "… (St. Paul)" / "…, St. Paul"
- "Our Redeemer Oromo Evangelical Church" / "… of Minnesota"
- "SEARAC" / "Southeast Asia Resource Action Center"
- "LULAC" / "League of United Latin American Citizens"
- "MALDEF" / "MALDEF (…)"
- "Muslim American Society" / "Muslim American Society of Minnesota". The second is a chapter, so keep both but link them.
- "CAIR-Minnesota" / "Council on American-Islamic Relations". Again a chapter and its national body.
- "KSTP" / "KSTP (5 Eyewitness News)"
- "Post Bulletin" / "Rochester Post Bulletin"
- "RFA Burmese" / "Radio Free Asia Burmese"
- "Minnesota Farm & Rural Helpline" / "Minnesota Farm and Rural Helpline"
- "Wat Lao Minnesota" / "Wat Lao Buddhavas"
- "Kidist Selassie Cathedral" / "Re'ese Adbarat Tserha Aryam Kidist Selassie Cathedral"
- "Deaf Mentor Family Services" / "… (Lutheran Social Service of Minnesota)"
- "Twin Cities JACL on Facebook" / "Twin Cities Japanese American Citizens League"
- "Watt Munisotaram" / "Watt Munisotaram on Facebook"
