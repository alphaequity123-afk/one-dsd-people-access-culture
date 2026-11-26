# One DSD v2: content recommendations for your sign-off

Prepared November 26, 2026, from the v2-rebuild branch and the live One DSD site (one-dhs-pac, branch dsd/approved-20261121).

**Bottom line: I recommend removing nothing.** The Gemini plan's cuts were round targets. When I checked the actual content, there are almost no true duplicates. One change needs your yes: showing each calendar observance once instead of once per community. Nothing has been removed or merged yet.

## 1. Courses: keep all

- This app publishes **677 course packs** plus the **72 self-directed courses** (Gemini counted 633).
- Only one pair shares a title: *Positive Supports and Reducing Restrictive Practices* (dsd-positive-supports, about 48 minutes, focused on plan review and reporting duties) and *Positive supports and reducing restrictive practices* (dc-l18, about 60 minutes, for staff). They cover different ground. **Keep both** and list them side by side.
- Close pairs that are deliberate levels, not duplicates. **Keep all** and show them as pairs in Knowledge:
  - *Working with an Interpreter* (35 to 45 minutes) and *Working with interpreters* (about 60 minutes)
  - *Culturally responsive person-centered planning* and its *in depth* follow-on
  - *The Respectful Workplace Policy for staff* and *Respectful Workplace Policy in team life*
  - *Intercultural development for staff*, *for leaders*, and *Your intercultural development plan*
- Gemini's "keep 40 to 60" is not recommended: it would hide most of the catalog from menus, search and Ask.

## 2. Culture Calendar: one change for your yes

- **569 entries**, but only **427 distinct observances**. 45 observances are entered once per community (187 entries in all). Easter and Christmas each appear 20 times.
- Each copy has its own community note (for example, Easter for African American, Colombian and Karen communities each say something different), so nothing should be deleted.
- **Recommendation: show each observance once on its date, with every community's note under it.** The calendar would go from 569 rows to 427, and every note stays. **Should I make this change?**

| Observance | Entries now | Communities |
|---|---|---|
| Christmas | 20 | african-american, american, colombian, cuban, ecuadorian, european-american, filipino, french, guatemalan, karen, kenyan, korean, latino, lebanese, liberian, mexican, minnesota, nigerian, puerto-rican, salvadoran |
| Easter | 20 | african-american, american, colombian, cuban, ecuadorian, european-american, filipino, french, guatemalan, karen, kenyan, korean, latino, lebanese, liberian, mexican, minnesota, nigerian, puerto-rican, salvadoran |
| Good Friday | 12 | colombian, ecuadorian, european-american, filipino, guatemalan, kenyan, latino, liberian, mexican, nigerian, puerto-rican, salvadoran |
| Eid al-Adha | 10 | african-american, arabic-speaking, ethiopian, indian, kenyan, lebanese, liberian, nigerian, oromo, somali |
| Eid al-Fitr | 10 | african-american, arabic-speaking, ethiopian, indian, kenyan, lebanese, liberian, nigerian, oromo, somali |
| Start of Ramadan | 10 | african-american, arabic-speaking, bosnian, ethiopian, indian, kenyan, lebanese, nigerian, oromo, somali |
| Hispanic Heritage Month (begins) | 7 | colombian, cuban, ecuadorian, guatemalan, latino, puerto-rican, salvadoran |
| Islamic New Year | 7 | arabic-speaking, bosnian, indian, kenyan, lebanese, oromo, somali |
| Ash Wednesday | 6 | european-american, filipino, guatemalan, latino, mexican, salvadoran |
| Día de los Reyes | 6 | cuban, ecuadorian, guatemalan, latino, mexican, puerto-rican |
| Mawlid an-Nabi | 4 | arabic-speaking, ethiopian, oromo, somali |
| Ramadan night prayers and community iftars | 4 | arabic-speaking, bosnian, oromo, somali |
| Ashura | 3 | arabic-speaking, indian, lebanese |
| Juneteenth | 3 | african-american, american, minnesota |
| Las Posadas (first night) | 3 | guatemalan, latino, mexican |
| Martin Luther King Jr. Day | 3 | african-american, american, minnesota |
| Minnesota State Fair | 3 | american, minnesota, rural |
| Adwa Victory Day | 2 | amharic, ethiopian |
| Asanha Bucha and start of Buddhist Lent | 2 | lao, thai |
| Black History Month (begins) | 2 | african-american, american |
| Central American Independence Day | 2 | latino, salvadoran |
| Día de la Virgen de Guadalupe | 2 | latino, mexican |
| Día de los Muertos | 2 | latino, mexican |
| Enkutatash | 2 | amharic, ethiopian |
| Farmworkers Day | 2 | latino, mexican |
| Fasika | 2 | amharic, ethiopian |
| Genna | 2 | amharic, ethiopian |
| George Floyd remembrance | 2 | african-american, minnesota |
| Governor's Fishing Opener | 2 | minnesota, rural |
| Independence Day (United States) | 2 | american, minnesota |
| Kolacky Days | 2 | european-american, rural |
| Lebanese Independence Day | 2 | arabic-speaking, lebanese |
| Makha Bucha | 2 | lao, thai |
| Meskel | 2 | amharic, ethiopian |
| Mexican Independence Day | 2 | latino, mexican |
| Orthodox Easter (Pascha) | 2 | russian-speaking, ukrainian |
| Rondo Days | 2 | african-american, minnesota |
| St. Maron Lebanese Festival | 2 | arabic-speaking, lebanese |
| St. Patrick's Day | 2 | american, european-american |
| Syttende Mai | 2 | european-american, minnesota |
| Thanksgiving | 2 | american, minnesota |
| Timkat | 2 | amharic, ethiopian |
| Visakha Bucha | 2 | lao, thai |
| Worthington Hispanic Heritage Community Fiesta | 2 | guatemalan, latino |
| Worthington International Festival | 2 | guatemalan, latino |

## 3. Community organizations: keep all 926

- The **926-organization directory** lives on the live site (data/blocks/ref-community-organizations.json, served from its database). This app has its own **42 detailed organization profiles**.
- Gemini proposed replacing the directory with 25 to 40 profiles. **Not recommended.** Keep the 42 profiles up front and the full 926 searchable behind them.
- Still to do: the directory and the live site's other database-backed readers (/r/...) still open on the live site. Bringing them into v2 needs the live site's resource database, so that is the next migration step.

## 4. Readings: keep all 304

- **304 readings**, no duplicate titles. 106 have researched summaries and 198 have supplied summaries.
- Gemini proposed retiring the collection as a catalog. **Not recommended.** Keep it inside Knowledge with search and filters; the supplied summaries can be reviewed over time.

## 5. Community briefs: keep all 42

- The app has **42 briefs** (Gemini said 46; the requirements document also says 42). Keep all.

## What changes only how things are organized (already approved, nothing lost)

- Home plus four pillars: Practice, Leadership, Communities and Knowledge.
- About, How to use this site, Support and the Program charter on one page (About and help). The old addresses still open.
- One Knowledge hub in place of the separate Learn menus; Audio inside Knowledge.
