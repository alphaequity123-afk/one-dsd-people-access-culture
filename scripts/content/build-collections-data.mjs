// Turns collections-placement.csv into lib/content/collections-data.json.
// The CSV is the owner's placement table. Change it, not the JSON.
//
// Usage: node scripts/content/build-collections-data.mjs [path to the CSV]
//        (or set COLLECTIONS_CSV). Add --check to compare without writing.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const check = args.includes("--check");
const csvPath = args.find(arg => !arg.startsWith("--")) ?? process.env.COLLECTIONS_CSV ?? fileURLToPath(new URL("../../handoff/supervisor-curriculum/collections-placement.csv", import.meta.url));
const target = fileURLToPath(new URL("../../lib/content/collections-data.json", import.meta.url));

const STAFF = [
  ["start-here", "Start here: equity at DSD", "What equity means here, the DHS Equity Policy, how DSD fits together, the rules right now"],
  ["race-bias-respect", "Race, bias and everyday respect", "Racism, whiteness, bias, microaggressions, identity, LGBTQ+, religion, age"],
  ["disability-access", "Disability and access", "Disability identity, etiquette, everyday and digital accessibility, accommodation"],
  ["services-choice-system", "Services, choice and the DSD system", "How services work, Olmstead, person-centered practice, choice, employment, supports"],
  ["culture-language", "Culture, language and communication", "Culture, intercultural development, cultural intelligence, interpreters, language access, plain language"],
  ["minnesota-communities", "Minnesota communities", "One page per community, plus using community briefs well"],
  ["working-together", "Working together, career and well-being", "Team culture, trust, meetings, conflict, hybrid work, feedback, mentoring, rights, well-being"],
  ["policy-data-decisions", "Policy, data and public decisions", "Equity analysis, policy, programs, budgets, data, oversight, engaging communities"],
];
const DOORS = [
  ["hiring", "Who should we hire, and how do they start?", "Roles, criteria, panels, state hiring rules, onboarding"],
  ["who-does-what", "Who does what, when and where?", "Assignments, schedules, hybrid fairness, hidden work, stretch work"],
  ["feedback", "How do I give feedback, rate, correct and develop?", "Everyday supervision, feedback, reviews, ratings, corrective action, coaching, retention"],
  ["access", "Someone needs access, leave or a change", "Accommodation, leave and return, Deaf and DeafBlind colleagues, neurodivergence, mental health"],
  ["concern", "Someone raised a concern, or named me in one", "Duties on hearing a report, retaliation, being named, harm, repair"],
  ["team", "How do I lead this team across difference?", "Climate, meetings, conflict, race and equity conversations, norms, leading across cultures"],
  ["policy", "What should this policy, budget or program decision be?", "Equity analysis, policy, budgets, data, patterns, program integrity, engagement"],
  ["keep-going", "What do I answer for, and how do I keep going?", "First week, the rules, why this is the job, your own load, change, cuts"],
  ["direction", "How do I back supervisors and set direction?", "Backing supervisors, governance, succession, senior sessions, live practice, learning culture"],
];
const PATHS = [
  ["first-year", "First-year supervisors", "For your first year of supervising: the duties that start on day one, then everyday decisions one at a time."],
  ["experienced", "Experienced supervisors", "For supervisors with some years behind them: harder conversations, whose norms count, and what to do when you are named."],
  ["managers-of-managers", "Managers of managers", "For people who back other supervisors: conversations before decisions, consistency, patterns and oversight."],
  ["senior-leaders", "Senior leaders", "For decisions only senior leaders can make: ownership, measures, change and what the rules say now."],
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { value += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(value); value = ""; }
    else if (char === "\n") { row.push(value.replace(/\r$/, "")); rows.push(row); row = []; value = ""; }
    else value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  const [header, ...body] = rows;
  return body.filter(cells => cells.length > 1).map(cells => {
    if (cells.length !== header.length) throw new Error(`CSV row has ${cells.length} cells, expected ${header.length}: ${cells[0]}`);
    return Object.fromEntries(header.map((name, i) => [name, cells[i]]));
  });
}

const rows = parseCsv(readFileSync(csvPath, "utf8").replace(/^\uFEFF/, ""));
const KIND = { "served course": "course", "new course (draft)": "course", "self-directed": "self-directed", "referral-only": "referral" };
const items = {};
for (const row of rows) {
  const kind = KIND[row.record_type];
  if (!kind) throw new Error(`Unknown record type "${row.record_type}" on ${row.id}`);
  if (items[row.id]) throw new Error(`Repeated id ${row.id}`);
  items[row.id] = {
    title: row.title, kind, ...(row.minutes ? { minutes: Number(row.minutes) } : {}),
    ...(row.required_note ? { required: row.required_note } : {}),
  };
}
const placed = rows.filter(row => row.primary_or_depth !== "referral");
const inStaff = (row, name) => row.staff_collection.split("; ").includes(name);
const byOrder = (a, b) => Number(a.subject_order) - Number(b.subject_order) || a.id.localeCompare(b.id);
const known = new Set([...STAFF, ...DOORS].map(([, title]) => title));
for (const row of placed) {
  for (const name of [...row.staff_collection.split("; "), row.supervisor_collection]) if (name && !known.has(name)) throw new Error(`${row.id} names an unknown collection: ${name}`);
  if (!row.staff_collection && !row.supervisor_collection) throw new Error(`${row.id} has no collection`);
}

/** Starting courses first, then what goes deeper, grouped by subject. A required item always leads. */
const staff = STAFF.map(([id, title, description]) => {
  const members = placed.filter(row => inStaff(row, title)).sort(byOrder);
  const required = members.filter(row => row.required_note);
  const starts = [...required, ...members.filter(row => row.primary_or_depth === "primary" && !row.required_note)];
  const deeper = new Map();
  for (const row of members.filter(row => row.primary_or_depth !== "primary")) {
    const group = deeper.get(row.subject_key) ?? { subject: row.decision_or_subject, ids: [] };
    group.ids.push(row.id);
    deeper.set(row.subject_key, group);
  }
  return { id, title, description, startIds: starts.map(row => row.id), deeper: [...deeper.values()], itemCount: members.length };
});

const doors = DOORS.map(([slug, title, description]) => {
  const members = placed.filter(row => row.supervisor_collection === title).sort(byOrder);
  const questionRows = placed.filter(row => row.question_door === title && !row.subject_key.startsWith("community:")).sort(byOrder);
  const keys = [...new Set(questionRows.map(row => row.subject_key))];
  const questions = keys.map(key => {
    const subject = questionRows.filter(row => row.subject_key === key);
    const start = subject.filter(row => row.primary_or_depth === "primary");
    if (start.length !== 1) throw new Error(`Question ${key} has ${start.length} starting courses`);
    if (start[0].supervisor_collection !== title) throw new Error(`Question ${key}: its starting course is not in the door "${title}"`);
    return { key, question: start[0].decision_or_subject, startId: start[0].id, deeperIds: subject.filter(row => row.primary_or_depth !== "primary" && row.supervisor_collection === title).map(row => row.id) };
  });
  const inQuestions = new Set(questions.flatMap(question => [question.startId, ...question.deeperIds]));
  return { slug, title, description, questions, relatedIds: members.filter(row => !inQuestions.has(row.id)).map(row => row.id), itemCount: members.length };
});

const paths = PATHS.map(([slug, title, description]) => {
  const positions = rows.flatMap(row => row.path_and_position.split("; ").filter(entry => entry.startsWith(`${title}: `)).map(entry => ({ id: row.id, position: Number(entry.match(/: (\d+) of/)[1]) }))).sort((a, b) => a.position - b.position);
  if (!positions.length) throw new Error(`Path ${title} has no courses`);
  positions.forEach((entry, i) => { if (entry.position !== i + 1) throw new Error(`Path ${title} is missing position ${i + 1}`); });
  const minutes = positions.reduce((sum, entry) => sum + (items[entry.id].minutes ?? 0), 0);
  return { slug, title, description, courseIds: positions.map(entry => entry.id), minutes };
});

const data = {
  generatedFrom: "collections-placement.csv",
  counts: { rows: rows.length, items: placed.length, questions: doors.reduce((sum, door) => sum + door.questions.length, 0) },
  items, staff, doors, paths,
  referralIds: rows.filter(row => row.primary_or_depth === "referral").map(row => row.id),
};
if (data.counts.questions !== 89) throw new Error(`Expected 89 questions, built ${data.counts.questions}`);

const output = `${JSON.stringify(data, null, 1)}\n`;
if (check) {
  if (!existsSync(target) || readFileSync(target, "utf8").replace(/\r\n/g, "\n") !== output) { console.log("collections-data.json does not match the CSV."); process.exit(1); }
  console.log("collections-data.json matches the CSV.");
} else {
  writeFileSync(target, output);
  console.log(`Wrote ${data.counts.items} placed items, ${staff.length} staff collections, ${doors.length} doors, ${data.counts.questions} questions, ${paths.length} paths, ${data.referralIds.length} referrals.`);
}
