// Links each community page to the statewide equity groups and to the cultural groups in the
// Minnesota State Demographic Center's 2026 reports (figures in ./community-figures.json, built by
// scripts/data/extract-community-figures.py). The note is shown to staff, so it is plain language.
//
// match:
//   "exact"       the report's group is the same community, as the report defines it
//   "approximate" the report's group is close but defined differently; the note says how
//   "none"        the report has no figures for this community
// countedWithin lists the report group that includes the community among others, for context only.
// It must never be shown as the community's own figures.

import figures from "./community-figures.json";

export type EquityGroupId = "american-indian" | "asian-pacific-islander" | "black" | "hispanic" | "multiracial" | "white" | "all";
export type CrosswalkMatch = "exact" | "approximate" | "none";

export type DemographicCenterGroup =
  | "Dakota" | "Ojibwe" | "Other American Indian"
  | "Asian Indian" | "Chinese" | "Filipino" | "Hmong" | "Karen" | "Korean" | "Lao" | "Vietnamese" | "Other Asian"
  | "African-American" | "Ethiopian" | "Liberian" | "Somali" | "Other Black"
  | "Mexican" | "Puerto Rican" | "Other Hispanic"
  | "Russian" | "White"
  | "Other (including Pacific Islander)" | "Multiple Cultural Groups"
  | "Total";

export type CommunityCrosswalkEntry = {
  communityId: string;
  equityGroup: EquityGroupId | null;
  demographicCenterGroups: DemographicCenterGroup[];
  match: CrosswalkMatch;
  note: string;
  countedWithin?: DemographicCenterGroup[];
};

export const NATIVE_FIGURES_NOTE =
  "This page defers to the Office of Indian Affairs and the Department of Human Services offices that handle Tribal relations; no figures are added here.";

const NOT_REPORTED = "The Demographic Center report does not give separate figures for this community.";

export const COMMUNITY_CROSSWALK: readonly CommunityCrosswalkEntry[] = [
  // Owner rule: Native pages never carry figures.
  { communityId: "native-american", equityGroup: null, demographicCenterGroups: [], match: "none", note: NATIVE_FIGURES_NOTE },
  { communityId: "tribal-nations", equityGroup: null, demographicCenterGroups: [], match: "none", note: NATIVE_FIGURES_NOTE },
  { communityId: "alaska-native", equityGroup: null, demographicCenterGroups: [], match: "none", note: NATIVE_FIGURES_NOTE },

  // Black communities
  { communityId: "african-american", equityGroup: "black", demographicCenterGroups: ["African-American"], match: "approximate",
    note: "In this report, \"African-American\" means only Black residents born in the United States and their children. It leaves out anyone with Ethiopian, Liberian or Somali ancestry or birthplace in the last two generations, and other Black immigrants, who are counted in their own groups or in \"Other Black\". It is narrower than everyone who calls themselves African American." },
  { communityId: "somali", equityGroup: "black", demographicCenterGroups: ["Somali"], match: "exact",
    note: "Somali ancestry or birthplace, including children born in the United States." },
  { communityId: "ethiopian", equityGroup: "black", demographicCenterGroups: ["Ethiopian"], match: "exact",
    note: "Ethiopian ancestry or birthplace, including children born in the United States. The group includes people of every Ethiopian ethnicity and language, such as Oromo and Amhara." },
  { communityId: "liberian", equityGroup: "black", demographicCenterGroups: ["Liberian"], match: "exact",
    note: "Liberian ancestry or birthplace, including children born in the United States." },
  { communityId: "oromo", equityGroup: "black", demographicCenterGroups: [], match: "none", countedWithin: ["Ethiopian"],
    note: `${NOT_REPORTED} Many Oromo Minnesotans were born in Ethiopia and are counted in the Ethiopian group, together with other Ethiopians. Oromo born in Kenya or elsewhere are counted in other groups.` },
  { communityId: "amharic", equityGroup: "black", demographicCenterGroups: [], match: "none", countedWithin: ["Ethiopian"],
    note: `${NOT_REPORTED} The report does not count people by language spoken. Most Amharic speakers have Ethiopian roots and are counted in the Ethiopian group, together with Ethiopians who speak other languages.` },
  { communityId: "nigerian", equityGroup: "black", demographicCenterGroups: [], match: "none", countedWithin: ["Other Black"],
    note: `${NOT_REPORTED} Nigerian Minnesotans are counted in "Other Black", together with many other groups.` },
  { communityId: "kenyan", equityGroup: "black", demographicCenterGroups: [], match: "none", countedWithin: ["Other Black"],
    note: `${NOT_REPORTED} Kenyan Minnesotans are counted mostly in "Other Black", together with many other groups. Kenyan-born people of Somali ancestry are counted in the Somali group.` },

  // Asian communities
  { communityId: "hmong", equityGroup: "asian-pacific-islander", demographicCenterGroups: ["Hmong"], match: "exact",
    note: "Hmong ancestry, language or birthplace, including children born in the United States." },
  { communityId: "karen", equityGroup: "asian-pacific-islander", demographicCenterGroups: ["Karen"], match: "exact",
    note: "People of Burmese ancestry or race who speak Karen, including children born in the United States." },
  { communityId: "vietnamese", equityGroup: "asian-pacific-islander", demographicCenterGroups: ["Vietnamese"], match: "exact",
    note: "Vietnamese, wherever born." },
  { communityId: "lao", equityGroup: "asian-pacific-islander", demographicCenterGroups: ["Lao"], match: "exact",
    note: "Lao, wherever born. Hmong Minnesotans are counted in their own Hmong group." },
  { communityId: "korean", equityGroup: "asian-pacific-islander", demographicCenterGroups: ["Korean"], match: "exact",
    note: "Korean, wherever born." },
  { communityId: "indian", equityGroup: "asian-pacific-islander", demographicCenterGroups: ["Asian Indian"], match: "exact",
    note: "The report's \"Asian Indian\" group: people of Indian origin, wherever born." },
  { communityId: "chinese", equityGroup: "asian-pacific-islander", demographicCenterGroups: ["Chinese"], match: "exact",
    note: "Chinese, wherever born." },
  { communityId: "filipino", equityGroup: "asian-pacific-islander", demographicCenterGroups: ["Filipino"], match: "exact",
    note: "Filipino, wherever born." },
  { communityId: "khmer", equityGroup: "asian-pacific-islander", demographicCenterGroups: [], match: "none", countedWithin: ["Other Asian"],
    note: `${NOT_REPORTED} Khmer (Cambodian) Minnesotans are counted in "Other Asian", together with many other groups.` },
  { communityId: "japanese", equityGroup: "asian-pacific-islander", demographicCenterGroups: [], match: "none", countedWithin: ["Other Asian"],
    note: `${NOT_REPORTED} Japanese Minnesotans are counted in "Other Asian", together with many other groups.` },
  { communityId: "thai", equityGroup: "asian-pacific-islander", demographicCenterGroups: [], match: "none", countedWithin: ["Other Asian"],
    note: `${NOT_REPORTED} Thai Minnesotans are counted in "Other Asian", together with many other groups.` },
  { communityId: "burmese", equityGroup: "asian-pacific-islander", demographicCenterGroups: [], match: "none", countedWithin: ["Karen", "Other Asian"],
    note: `${NOT_REPORTED} People of Burmese ancestry who speak Karen are counted in the Karen group. Most other people from Burma are counted in "Other Asian".` },

  // Latino communities
  { communityId: "latino", equityGroup: "hispanic", demographicCenterGroups: ["Mexican", "Puerto Rican", "Other Hispanic"], match: "approximate",
    note: "The report gives no single Latino total. It shows three groups separately: Mexican, Puerto Rican and Other Hispanic. Latino Minnesotans who also belong to another group in the report are counted in \"Multiple Cultural Groups\" instead. Show the three groups side by side; do not add them up." },
  { communityId: "mexican", equityGroup: "hispanic", demographicCenterGroups: ["Mexican"], match: "exact",
    note: "Mexican origin, wherever born." },
  { communityId: "puerto-rican", equityGroup: "hispanic", demographicCenterGroups: ["Puerto Rican"], match: "exact",
    note: "Puerto Rican origin, wherever born." },
  { communityId: "guatemalan", equityGroup: "hispanic", demographicCenterGroups: [], match: "none", countedWithin: ["Other Hispanic"],
    note: `${NOT_REPORTED} Guatemalan Minnesotans are counted in "Other Hispanic", together with every Latino group except Mexican and Puerto Rican.` },
  { communityId: "salvadoran", equityGroup: "hispanic", demographicCenterGroups: [], match: "none", countedWithin: ["Other Hispanic"],
    note: `${NOT_REPORTED} Salvadoran Minnesotans are counted in "Other Hispanic", together with every Latino group except Mexican and Puerto Rican.` },
  { communityId: "ecuadorian", equityGroup: "hispanic", demographicCenterGroups: [], match: "none", countedWithin: ["Other Hispanic"],
    note: `${NOT_REPORTED} Ecuadorian Minnesotans are counted in "Other Hispanic", together with every Latino group except Mexican and Puerto Rican.` },
  { communityId: "colombian", equityGroup: "hispanic", demographicCenterGroups: [], match: "none", countedWithin: ["Other Hispanic"],
    note: `${NOT_REPORTED} Colombian Minnesotans are counted in "Other Hispanic", together with every Latino group except Mexican and Puerto Rican.` },
  { communityId: "cuban", equityGroup: "hispanic", demographicCenterGroups: [], match: "none", countedWithin: ["Other Hispanic"],
    note: `${NOT_REPORTED} Cuban Minnesotans are counted in "Other Hispanic", together with every Latino group except Mexican and Puerto Rican.` },

  // White and European communities
  { communityId: "european-american", equityGroup: "white", demographicCenterGroups: ["White"], match: "approximate",
    note: "The report's \"White\" group is all non-Hispanic White residents except those of Russian ancestry, who are shown separately. It includes White people of any ancestry, including Middle Eastern and North African ancestries, not only European." },
  { communityId: "russian-speaking", equityGroup: "white", demographicCenterGroups: ["Russian"], match: "approximate",
    note: "The report's \"Russian\" group means non-Hispanic White residents of Russian ancestry. It is about ancestry, not language: it leaves out Russian speakers with Ukrainian, Belarusian, Central Asian, Jewish or other ancestry, and it includes people of Russian ancestry who do not speak Russian." },
  { communityId: "ukrainian", equityGroup: "white", demographicCenterGroups: [], match: "none", countedWithin: ["White"],
    note: `${NOT_REPORTED} Ukrainian Minnesotans are counted in the large "White" group.` },
  { communityId: "bosnian", equityGroup: "white", demographicCenterGroups: [], match: "none", countedWithin: ["White"],
    note: `${NOT_REPORTED} Bosnian Minnesotans are counted in the large "White" group.` },
  { communityId: "french", equityGroup: "white", demographicCenterGroups: [], match: "none", countedWithin: ["White"],
    note: `${NOT_REPORTED} Minnesotans of French or French Canadian ancestry are counted in the large "White" group.` },
  { communityId: "lebanese", equityGroup: "white", demographicCenterGroups: [], match: "none", countedWithin: ["White"],
    note: `${NOT_REPORTED} In the survey years used here, Middle Eastern and North African people were counted as White, so most Lebanese Minnesotans are in the large "White" group.` },
  { communityId: "arabic-speaking", equityGroup: null, demographicCenterGroups: [], match: "none",
    note: `${NOT_REPORTED} The report does not count people by language spoken. Arabic speakers are counted across several of the report's groups.` },

  // Whole-state and other pages
  { communityId: "minnesota", equityGroup: "all", demographicCenterGroups: ["Total"], match: "exact",
    note: "All Minnesotans." },
  { communityId: "american", equityGroup: null, demographicCenterGroups: [], match: "none",
    note: "This page is about American culture as a whole, not a group of people the report counts. For figures on all Minnesotans, see the Minnesota page." },
  { communityId: "deaf-deafblind-hard-of-hearing", equityGroup: null, demographicCenterGroups: [], match: "none",
    note: `${NOT_REPORTED} The report's disability figures cover any disability, with no separate count for people who are Deaf, DeafBlind or hard of hearing by cultural group.` },
  { communityId: "rural", equityGroup: null, demographicCenterGroups: [], match: "none",
    note: `${NOT_REPORTED} The report covers the whole state only; it gives no figures for rural areas.` },
];

export const COMMUNITY_CROSSWALK_BY_ID: ReadonlyMap<string, CommunityCrosswalkEntry> =
  new Map(COMMUNITY_CROSSWALK.map(entry => [entry.communityId, entry]));

type FiguresFile = typeof figures;
export type CommunityFigureGroup = FiguresFile["groups"][number];

/** Report groups with figures for a community page. Empty for "none" matches, including every Native page. */
export function communityFigureGroups(communityId: string): CommunityFigureGroup[] {
  const entry = COMMUNITY_CROSSWALK_BY_ID.get(communityId);
  if (!entry || entry.match === "none") return [];
  return entry.demographicCenterGroups
    .map(name => figures.groups.find(group => group.name === name))
    .filter((group): group is CommunityFigureGroup => Boolean(group));
}
