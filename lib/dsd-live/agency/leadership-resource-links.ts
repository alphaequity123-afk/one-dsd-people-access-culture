import { DSD_SITE } from "@/lib/dsd-live/workforce/area-doors";
import leader01 from "@/data/dsd-live/blocks/leader-01.json";
import leader02 from "@/data/dsd-live/blocks/leader-02.json";
import leader03 from "@/data/dsd-live/blocks/leader-03.json";
import leader04 from "@/data/dsd-live/blocks/leader-04.json";
import leader05 from "@/data/dsd-live/blocks/leader-05.json";
import leader06 from "@/data/dsd-live/blocks/leader-06.json";
import leader07 from "@/data/dsd-live/blocks/leader-07.json";
import leader08 from "@/data/dsd-live/blocks/leader-08.json";
import leader09 from "@/data/dsd-live/blocks/leader-09.json";
import leader10 from "@/data/dsd-live/blocks/leader-10.json";
import growth from "@/data/dsd-live/blocks/leadership-growth.json";
import references from "@/data/dsd-live/blocks/ref-leadership-learning.json";
import emotionalIntelligence from "@/data/dsd-live/blocks/emotional-intelligence.json";
import interculturalConflict from "@/data/dsd-live/blocks/intercultural-08.json";
import jobAids from "@/data/dsd-live/blocks/ref-job-aids-and-tools.json";
import team01 from "@/data/dsd-live/blocks/team-01.json";
import team02 from "@/data/dsd-live/blocks/team-02.json";
import team07 from "@/data/dsd-live/blocks/team-07.json";
import team08 from "@/data/dsd-live/blocks/team-08.json";
import team09 from "@/data/dsd-live/blocks/team-09.json";
import team10 from "@/data/dsd-live/blocks/team-10.json";

const titleKey = (value: string) => value.normalize("NFKC").toLowerCase().replace(/’/g, "'").replace(/\s+/g, " ").trim();

// Use the same canonical slugs as the agency resource importer, including abbreviations
// and titles whose punctuation or published wording would generate a different slug.
const hrefs = new Map<string, string>();
for (const block of [leader01, leader02, leader03, leader04, leader05, leader06, leader07, leader08, leader09, leader10, growth, references, emotionalIntelligence, interculturalConflict, jobAids, team01, team02, team07, team08, team09, team10]) {
  for (const item of block.items) hrefs.set(titleKey(item.title), `/r/${item.id}`);
}

const practiceLinks: Record<string, string> = {
  "Autocratic or directive leadership": "/learn/leadership/read/style_directive",
  "Democratic or participative leadership": "/learn/leadership/read/style_participative",
  "Shared or distributed leadership": "/learn/leadership/read/style_shared",
  "Empowering or delegative leadership": "/learn/leadership/read/style_empowering",
  "Transformative or equity-centered leadership": "/learn/leadership/read/style_transformative",
  "Inclusive leadership": "/learn/leadership/read/style_inclusive",
  "Ethical leadership": "/learn/leadership/read/style_ethical",
  "Leadership style scenarios": `${DSD_SITE}/learn/leadership-styles/scenarios`,
  "Who gets the visible work?": `${DSD_SITE}/learn/leadership-styles#common-scenario`,
  "Make participation more accessible": `${DSD_SITE}/practice-guides/inclusive-meetings`,
  "Make a process easier to use": `${DSD_SITE}/practice-guides/clearer-processes`,
  "Find out what changed in practice": `${DSD_SITE}/practice-guides/review-a-change`,
  "Plan how to learn from results": `${DSD_SITE}/practice/measurement?area=measurement&task=evaluation-plan`,
  "Cultural humility simulation for finance and contracts": "/trainings/cultural-humility?version=finance-contracts",
  "Planning and delivery": "/work?family=admin-support#c-getting-work-done",
  "Digital access": "/work?family=admin-support#c-digital-access",
  "Learning about communities without predicting people": "/minnesota-communities",
};
for (const [title, href] of Object.entries(practiceLinks)) hrefs.set(titleKey(title), href);

export function leadershipResourceHref(label: string): string | undefined {
  return hrefs.get(titleKey(label.replace(/^[LGR]\d+\s*·\s*/i, "")));
}
