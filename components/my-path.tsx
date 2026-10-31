"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BROWSER_STORAGE_KEYS } from "@/lib/client/storage-keys";
import { PRACTICE_PLANS_KEY } from "@/lib/client/dsd-practice-plans";
import { PROGRESSION_LEVELS, type ProgressionLevelId } from "@/lib/program/progression-levels";

/** A personal learning journey. Self-marked, kept on this computer, never scored or reported. */
type PathState = { version: 1; level: ProgressionLevelId | null; checked: string[] };
const EMPTY: PathState = { version: 1, level: null, checked: [] };
const course = (number: string) => `/learning/self-directed/index.html?course=${number}`;

const DETAILS: Record<ProgressionLevelId, { canDo: string[]; milestone: string; next: { label: string; href: string }[] }> = {
  oriented: {
    canDo: ["Explain what the program offers and what it does not", "Tell voluntary learning apart from required processes", "Know who holds authority for a decision"],
    milestone: "Complete one Equity Pause on a real routine decision",
    next: [{ label: "Get to know the program", href: "/start#new-to-dsd" }, { label: "Find your way around the site", href: "/user-guide" }, { label: "Try a ten-minute Equity Pause", href: "/practice/gp-12" }],
  },
  foundations: {
    canDo: ["Use plain language about equity, access and bias", "Recognize a barrier without labeling people", "Ask before assuming"],
    milestone: "Complete one guided practice and its reflection",
    next: [{ label: "An Equity Lens for Ordinary Decisions", href: course("F21") }, { label: "Cultural Humility in Everyday Public Service", href: course("F02") }, { label: "Disability, Rights, Identity, and Belonging", href: course("F09") }],
  },
  applying: {
    canDo: ["Work across cultural difference", "Run a standard equity analysis", "Plan accessible engagement"],
    milestone: "Complete a standard analysis and save it to My work",
    next: [{ label: "Applying the Equity Analysis Toolkit to a Realistic Decision", href: course("I21") }, { label: "Equity analysis for a decision", href: "/practice/gp-7" }, { label: "Accessible Communication for the Person and the Task", href: course("I09") }],
  },
  leading: {
    canDo: ["Trace a structural barrier", "Build accountability without surveillance", "Mentor or sponsor others"],
    milestone: "Complete an in-depth review or lead a session",
    next: [{ label: "From Individual Access Fixes to Accessible Systems", href: course("A09") }, { label: "Policy and Legislative Analysis through an Equity Lens", href: course("A21") }, { label: "Choose an in-depth review", href: "/equity-review" }],
  },
};
const itemId = (level: ProgressionLevelId, index: number) => `${level}:${index}`;

function read(): PathState {
  try {
    const raw = window.localStorage.getItem(BROWSER_STORAGE_KEYS.myPath);
    const value = raw ? JSON.parse(raw) : null;
    if (value && value.version === 1 && Array.isArray(value.checked)) return { version: 1, level: PROGRESSION_LEVELS.some(l => l.id === value.level) ? value.level : null, checked: value.checked.filter((id: unknown) => typeof id === "string") };
  } catch { /* storage blocked or unreadable: start empty */ }
  return EMPTY;
}

function savedWork(): { plans: string[]; reflection: boolean } {
  try {
    const plans = JSON.parse(window.localStorage.getItem(PRACTICE_PLANS_KEY) ?? "null");
    const titles = Array.isArray(plans?.plans) ? plans.plans.map((plan: { title?: string }) => plan.title || "Untitled plan") : [];
    return { plans: titles, reflection: Boolean(window.localStorage.getItem(BROWSER_STORAGE_KEYS.practiceReflection)) };
  } catch { return { plans: [], reflection: false }; }
}

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function MyPath() {
  const [state, setState] = useState<PathState>(EMPTY);
  const [work, setWork] = useState<{ plans: string[]; reflection: boolean }>({ plans: [], reflection: false });
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => { setState(read()); setWork(savedWork()); }, []);

  function update(next: PathState) {
    setState(next);
    try { window.localStorage.setItem(BROWSER_STORAGE_KEYS.myPath, JSON.stringify(next)); setMessage(""); }
    catch { setMessage("This browser is not keeping your choices, so they will clear when you leave the page."); }
  }
  const toggle = (id: string) => update({ ...state, checked: state.checked.includes(id) ? state.checked.filter(item => item !== id) : [...state.checked, id] });

  async function downloadSummary() {
    const { Document, Packer, Paragraph, HeadingLevel } = await import("docx");
    const children = [new Paragraph({ text: "My learning journey", heading: HeadingLevel.HEADING_1 }), new Paragraph("One DSD People, Access and Culture")];
    const current = PROGRESSION_LEVELS.find(level => level.id === state.level);
    children.push(new Paragraph(current ? `Where I am right now: ${current.title}. ${current.fits}.` : "I have not chosen where I am yet."));
    for (const level of PROGRESSION_LEVELS) {
      const details = DETAILS[level.id];
      const done = [...details.canDo, details.milestone].filter((_, index) => state.checked.includes(itemId(level.id, index)));
      if (!done.length) continue;
      children.push(new Paragraph({ text: `What I can do: ${level.title}`, heading: HeadingLevel.HEADING_2 }));
      for (const line of done) children.push(new Paragraph({ text: line, bullet: { level: 0 } }));
    }
    if (work.plans.length) {
      children.push(new Paragraph({ text: "Practice plans I have worked on", heading: HeadingLevel.HEADING_2 }));
      for (const title of work.plans) children.push(new Paragraph({ text: title, bullet: { level: 0 } }));
    }
    children.push(new Paragraph("I am sharing this by choice. It reflects my own view of my growth and is meant to start a conversation, not to evaluate me."));
    download("My-learning-journey.docx", await Packer.toBlob(new Document({ sections: [{ children }] })));
  }

  function exportPath() { download("my-learning-journey.json", new Blob([JSON.stringify(state, null, 1)], { type: "application/json" })); }

  async function importPath(file: File | undefined) {
    if (!file) return;
    try {
      const value = JSON.parse(await file.text());
      if (value?.version !== 1 || !Array.isArray(value.checked)) throw new Error("format");
      update({ version: 1, level: PROGRESSION_LEVELS.some(l => l.id === value.level) ? value.level : null, checked: value.checked.filter((id: unknown) => typeof id === "string") });
      setMessage("Welcome back. Your learning journey is right where you left it.");
    } catch { setMessage("That file does not look like a saved copy of your learning journey. Try the my-learning-journey.json file you saved earlier."); }
    if (fileInput.current) fileInput.current.value = "";
  }

  const details = state.level ? DETAILS[state.level] : null;
  const builtSoFar = work.plans.length
    ? `You have saved ${work.plans.length === 1 ? "a practice plan" : `${work.plans.length} practice plans`}${work.reflection ? " and a reflection" : ""}. That is real progress.`
    : work.reflection ? "You have saved a reflection. When you save a practice plan, it will appear here too." : "When you save a practice plan or a reflection, it will appear here.";
  return <section className="dsd-work-card space-y-4" aria-labelledby="my-path-title">
    <p className="dsd-eyebrow">Just for you</p>
    <h2 id="my-path-title">Your learning journey</h2>
    <p>A place to notice how far you have come and to choose where to go next. It is private to you, nothing here is graded, and you are always welcome to explore anything on the site that catches your interest. The levels describe common stages in equity practice, not a ladder you are required to climb.</p>

    <fieldset><legend className="font-semibold">Where are you right now?</legend>
      <p className="text-sm text-muted">Pick the one that feels closest. You can change it whenever you like, and experienced staff often start at the third or fourth.</p>
      <div className="mt-2 grid gap-3 md:grid-cols-2">{PROGRESSION_LEVELS.map(level => <label key={level.id} className="flex items-start gap-2">
        <input type="radio" name="my-path-level" value={level.id} className="mt-1" checked={state.level === level.id} onChange={() => update({ ...state, level: level.id })} />
        <span><strong>{level.title}</strong><span className="block text-sm text-muted">{level.fits}.</span></span>
      </label>)}</div>
    </fieldset>

    {details && state.level ? <>
      <div><h3 className="font-semibold">A few good next steps</h3><ul className="mt-1 list-disc pl-6">{details.next.map(item => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}</ul></div>
      <fieldset><legend className="font-semibold">What you can do now</legend>
        <p className="text-sm text-muted">Check these off when they feel true for you. Your own judgment is the only measure.</p>
        <ul className="mt-1 list-none space-y-1 p-0">{[...details.canDo.map(text => `I can ${text.charAt(0).toLowerCase()}${text.slice(1)}`), details.milestone].map((text, index) => <li key={index}><label className="inline-flex items-start gap-2"><input type="checkbox" className="mt-1" checked={state.checked.includes(itemId(state.level!, index))} onChange={() => toggle(itemId(state.level!, index))} /><span>{index === details.canDo.length ? <strong>Try it in your work: </strong> : null}{text}</span></label></li>)}</ul>
      </fieldset>
    </> : <p className="text-muted">Once you choose where you are, a few good next steps will appear here.</p>}

    <div><h3 className="font-semibold">What you have built so far</h3>
      <p>{builtSoFar} <Link href="/my-work/plan">Go to your practice plans</Link></p>
    </div>

    <div><h3 className="font-semibold">Bring it to a conversation</h3>
      <p className="text-sm">If it would help, download a one-page summary to share with a supervisor or mentor in a development conversation. That is always your choice, and the summary says so. Moving to a new computer? Save a copy here and open it there.</p>
      <div className="mt-2 flex flex-wrap gap-3">
        <button type="button" className="btn btn--primary" onClick={downloadSummary}>Download a summary (Word)</button>
        <button type="button" className="btn btn--light" onClick={exportPath}>Save a copy</button>
        <button type="button" className="btn btn--light" onClick={() => fileInput.current?.click()}>Open a saved copy</button>
        <input ref={fileInput} id="my-path-import" type="file" accept="application/json,.json" hidden onChange={event => importPath(event.target.files?.[0])} />
      </div>
    </div>
    {message ? <p role="status" className="text-sm">{message}</p> : null}
  </section>;
}
