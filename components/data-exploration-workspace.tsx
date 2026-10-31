"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { GOALS, comparePeriods, emptyDataset, parseWorkingCopy, rate, suppressionReason, validateDataset, type Dataset, type Observation } from "@/lib/data-exploration/model";
import { practiceDataset } from "@/lib/data-exploration/examples";
import { CSV_HEADERS, datasetCsv, parseCsv } from "@/lib/data-exploration/csv";
import { reportHtml, reportText } from "@/lib/data-exploration/report";
import styles from "./data-exploration-workspace.module.css";

export const DATA_EXPLORATION_DRAFT_KEY = "one-dsd-data-exploration-draft";
const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
function distinct(values: string[]) { return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b)); }
function percentage(value: number | null) { return value === null ? "Not shown" : `${value.toFixed(1)}%`; }
function download(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename;
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
function workingCopy(dataset: Dataset) { return JSON.stringify(dataset, null, 2); }

export function DataExplorationWorkspace() {
  const [dataset, setDataset] = useState<Dataset>(() => practiceDataset());
  const [view, setView] = useState<"goals" | "all">("goals");
  const [goal, setGoal] = useState("1");
  const [programChoice, setProgramChoice] = useState("");
  const [measureChoice, setMeasureChoice] = useState("");
  const [periodChoice, setPeriodChoice] = useState("");
  const [earlierChoice, setEarlierChoice] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [chart, setChart] = useState<"groups" | "trend">("groups");
  const [pending, setPending] = useState<Dataset | null>(null);
  const [pendingName, setPendingName] = useState("");
  const [keep, setKeep] = useState(false);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [replaceChoice, setReplaceChoice] = useState<"practice" | "empty" | null>(null);
  const savingAllowed = useRef(false);
  const datasetNow = useRef(dataset);
  const importSequence = useRef(0);
  const detailsHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        const saved = localStorage.getItem(DATA_EXPLORATION_DRAFT_KEY);
        if (saved) {
          const restored = parseWorkingCopy(saved);
          datasetNow.current = restored; setDataset(restored); setKeep(true); savingAllowed.current = true;
          const firstGoal = GOALS.find(item => item.id !== "other" && restored.records.some(row => row.goal === item.id));
          if (firstGoal) setGoal(firstGoal.id); else if (restored.records.length) setView("all");
          setNotice("Your saved working copy is open.");
        }
      } catch {
        setError("Your saved copy could not be opened. It has not been replaced. You can open a downloaded working copy or continue with the practice data.");
      }
      setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !keep || !savingAllowed.current) return;
    const timer = setTimeout(() => {
      if (!savingAllowed.current) return;
      try {
        localStorage.setItem(DATA_EXPLORATION_DRAFT_KEY, workingCopy(datasetNow.current));
        setNotice("Working copy saved on this device.");
      } catch {
        setError("This device could not save your work. Your data is still open. Download a working copy to keep it.");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [dataset, keep, ready]);

  const available = useMemo(() => dataset.records.filter(row => view === "all" || row.goal === goal), [dataset, view, goal]);
  const programs = distinct(available.map(row => row.program));
  const program = programs.includes(programChoice) ? programChoice : programs[0] ?? "";
  const programRows = available.filter(row => row.program === program);
  const measureKeys = distinct(programRows.map(row => `${row.goal}\u001f${row.measure}`));
  const measureKey = measureKeys.includes(measureChoice) ? measureChoice : measureKeys[0] ?? "";
  const series = programRows.filter(row => `${row.goal}\u001f${row.measure}` === measureKey);
  const periods = Array.from(new Map(series.map(row => [row.period, row.periodOrder])).entries()).sort((a, b) => b[1] - a[1]).map(([label]) => label);
  const period = periods.includes(periodChoice) ? periodChoice : periods[0] ?? "";
  const earlierPeriods = periods.filter(label => (series.find(row => row.period === label)?.periodOrder ?? 0) < (series.find(row => row.period === period)?.periodOrder ?? 0));
  const earlierPeriod = earlierChoice === "none" ? "" : earlierPeriods.includes(earlierChoice) ? earlierChoice : earlierPeriods[0] ?? "";
  const currentRows = series.filter(row => row.period === period).sort((a, b) => a.group.localeCompare(b.group));
  const groups = distinct(series.map(row => row.group));
  const focusedGroup = groups.includes(selectedGroup) ? selectedGroup : currentRows[0]?.group ?? groups[0] ?? "";
  const focusedRow = currentRows.find(row => row.group === focusedGroup);
  const trendRows = series.filter(row => row.group === focusedGroup).sort((a, b) => a.periodOrder - b.periodOrder);
  const reportRows = series.filter(row => row.period === period || row.period === earlierPeriod);
  const hasPractice = reportRows.some(row => row.practice);
  const allPractice = dataset.records.length > 0 && dataset.records.every(row => row.practice);
  const minimum = dataset.minimumGroupSize;
  const visibleRows = currentRows.filter(row => rate(row, minimum) !== null);
  const comparableGroups = visibleRows.length >= 2 && visibleRows.every(row => row.practice === visibleRows[0].practice && row.source.trim() !== "" && row.source === visibleRows[0].source);
  const visibleRates = visibleRows.map(row => rate(row, minimum)!);
  const groupDifference = comparableGroups ? Math.max(...visibleRates) - Math.min(...visibleRates) : null;
  const earlierFor = (row: Observation) => series.find(earlier => earlier.group === row.group && earlier.period === earlierPeriod);

  function replace(next: Dataset) {
    datasetNow.current = next; setDataset(next); setProgramChoice(""); setMeasureChoice(""); setPeriodChoice("");
    setEarlierChoice(""); setSelectedGroup(""); setPending(null); setReplaceChoice(null); setError("");
    const firstGoal = GOALS.find(item => item.id !== "other" && next.records.some(row => row.goal === item.id));
    if (firstGoal) setGoal(firstGoal.id); else if (next.records.length) setView("all");
  }
  function updateNotes(notes: string) {
    try {
      const next = validateDataset({ ...datasetNow.current, notes });
      datasetNow.current = next; setDataset(next); setError("");
    } catch { setError("That note could not be added. Shorten it and try again; your earlier note is unchanged."); }
  }
  async function openFile(file: File | undefined) {
    if (!file) return;
    const sequence = ++importSequence.current;
    setBusy(true); setError(""); setPending(null);
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error("Choose a file smaller than 2 MB.");
      const contents = await file.text();
      const imported = file.name.toLowerCase().endsWith(".csv") ? parseCsv(contents) : parseWorkingCopy(contents);
      if (sequence !== importSequence.current) return;
      setPending(imported); setPendingName(file.name); setNotice("Review the imported data before replacing your open work.");
    } catch (cause) {
      if (sequence !== importSequence.current) return;
      const detail = cause instanceof Error ? cause.message : "Check the file and try again.";
      setError(`This file could not be opened. ${detail} Your open work is unchanged.`);
    } finally { if (sequence === importSequence.current) setBusy(false); }
  }
  function changeSaving(next: boolean) {
    if (!ready) return;
    if (next) {
      try {
        localStorage.setItem(DATA_EXPLORATION_DRAFT_KEY, workingCopy(datasetNow.current));
        savingAllowed.current = true; setKeep(true); setError(""); setNotice("Working copy saved on this device.");
      } catch { setError("This device could not save your work. Download a working copy to keep it."); }
    } else {
      try {
        localStorage.removeItem(DATA_EXPLORATION_DRAFT_KEY); savingAllowed.current = false; setKeep(false);
        setNotice("The saved copy was removed from this device. Your open work is unchanged."); setError("");
      } catch { setError("The saved copy could not be removed. Saving remains on; try again before leaving this device."); }
    }
  }
  function exportFile(kind: "working" | "csv" | "html" | "notes") {
    try {
      if (kind === "working") download(workingCopy(dataset), "one-dsd-data-working-copy.json", "application/json");
      if (kind === "csv") download(datasetCsv({ ...dataset, records: reportRows }, true), "one-dsd-data-comparison.csv", "text/csv;charset=utf-8");
      if (kind === "html") download(reportHtml(dataset, reportRows), "one-dsd-data-report.html", "text/html;charset=utf-8");
      if (kind === "notes") download(reportText(dataset, reportRows), "one-dsd-analysis-notes.txt", "text/plain;charset=utf-8");
      setNotice("Download requested. Check your downloads to keep the file."); setError("");
    } catch { setError("The download could not be prepared. Your open work is unchanged. Try again."); }
  }
  function selectGroup(groupName: string) { setSelectedGroup(groupName); }
  function changePeriod(value: string) { setPeriodChoice(value); setEarlierChoice(""); }
  function compare(row: Observation) { const earlier = earlierFor(row); return earlier ? comparePeriods(row, earlier, minimum) : { current: rate(row, minimum), earlier: null, change: null, message: "A change cannot be calculated because this group has no earlier observation." }; }

  return <div className={styles.workspace}>
    <section className={styles.intro} aria-label="About this workspace">
      <p className={styles.eyebrow}>Evidence for equity in practice</p>
      <h2>Explore data and differences</h2>
      <p>Compare groups, follow change over time, and decide what needs a closer look. Start with the ADSA goals or explore data from any DHS program.</p>
      {allPractice && <p className={styles.practice}>Sample data for practice · Explore the questions and comparisons. These figures are not DHS findings.</p>}
      <div className={styles.viewChoices} role="group" aria-label="Choose a starting point">
        <button type="button" aria-pressed={view === "goals"} onClick={() => setView("goals")}>ADSA goals</button>
        <button type="button" aria-pressed={view === "all"} onClick={() => setView("all")}>All DHS data</button>
      </div>
    </section>

    <details className={styles.fileControls}>
      <summary>Open and keep data</summary>
      <div className={styles.actions}>
        <label className={styles.fileLabel}>Open a data file
          <input type="file" accept=".csv,.json,text/csv,application/json" disabled={busy || !ready} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; void openFile(file); }} />
        </label>
        <button type="button" disabled={busy} onClick={() => setReplaceChoice("practice")}>Open practice examples</button>
        <button type="button" disabled={busy} onClick={() => setReplaceChoice("empty")}>Start with your own data</button>
      </div>
      <p className={styles.help}>Use group totals with no names, identifying details, or individual employee records. Files are examined on this device; opening a file does not publish it.</p>
      <label className={styles.checkbox}><input type="checkbox" checked={keep} disabled={!ready} onChange={event => changeSaving(event.target.checked)} />Keep a working copy on this device</label>
      <p className={styles.help}>Use this only on a device you trust. A downloaded working copy includes the original group totals, including small groups; keep it private.</p>
      <button type="button" onClick={() => exportFile("working")}>Download working copy</button>
      <details className={styles.guidance}><summary>Prepare a data file</summary>
        <p>A CSV file contains one row for each group and reporting period. Include the program, goal, measure, group, period, count, total, source, and source date. A count records how many met the measure, and a total records how many were eligible. Leave missing figures blank. Give each row a unique ID.</p>
        <p>Use <strong>other</strong> for a measure that is not linked to an ADSA goal. Mark practice rows as practice data. Period order is a number that puts reporting periods in sequence.</p>
        <p className={styles.headers}>{CSV_HEADERS.join(", ")}</p>
        <button type="button" onClick={() => { download(datasetCsv(practiceDataset(), false), "one-dsd-practice-data-template.csv", "text/csv;charset=utf-8"); setNotice("Your practice template is ready to download."); }}>Download a practice example file</button>
        <p>Small groups and counts that could reveal a small group are hidden in charts and shareable reports. This helps reduce disclosure; review a report before sharing it. A working copy retains the original totals.</p>
      </details>
      {busy && <p role="status">Reading your file…</p>}
      {replaceChoice && <div className={styles.confirm}>
        <p>{replaceChoice === "practice" ? "Open practice examples in place of your current data?" : "Clear the open data and begin a new working copy?"} Download a working copy first if you want to keep your current work.</p>
        <div className={styles.actions}><button type="button" className={styles.primary} onClick={() => { replace(replaceChoice === "practice" ? practiceDataset() : emptyDataset()); setNotice("Your new working copy is open."); }}>Replace open data</button><button type="button" onClick={() => setReplaceChoice(null)}>Keep current data</button></div>
      </div>}
      {pending && <section className={styles.importReview} aria-label="Review imported data">
        <h3>Review before opening</h3><p>{pendingName}: {pending.records.length} rows across {distinct(pending.records.map(row => row.program)).length} programs and {distinct(pending.records.map(row => row.period)).length} periods.</p>
        <p>{pending.records.filter(row => row.practice).length} rows are marked as sample data for practice. {pending.records.filter(row => suppressionReason(row, pending.minimumGroupSize)).length} rows have figures that will not be shown.</p>
        <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Imported data preview"><table><caption>First five rows · figures hidden where needed</caption><thead><tr><th scope="col">Program</th><th scope="col">Measure</th><th scope="col">Group</th><th scope="col">Period</th><th scope="col">Rate</th><th scope="col">Source</th></tr></thead><tbody>{pending.records.slice(0, 5).map(row => <tr key={row.id}><td>{row.program}</td><td>{row.measure}</td><td>{row.group}</td><td>{row.period}</td><td>{percentage(rate(row, pending.minimumGroupSize))}</td><td>{row.source || "Not provided"}</td></tr>)}</tbody></table></div>
        <p>Opening this file replaces your current data, including the copy kept on this device if saving is on.</p>
        <div className={styles.actions}><button type="button" className={styles.primary} onClick={() => { replace(pending); setNotice("Your reviewed data is open."); }}>Use reviewed data</button><button type="button" onClick={() => { setPending(null); setNotice("Import cancelled. Your open work is unchanged."); }}>Cancel import</button></div>
      </section>}
    </details>
    {notice && <p role="status" className={styles.status}>{notice}</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}

    {view === "goals" && <nav className={styles.goals} aria-label="ADSA equity goals">{GOALS.filter(item => item.id !== "other").map(item => <button key={item.id} type="button" aria-pressed={goal === item.id} onClick={() => { setGoal(item.id); setSelectedGroup(""); }}><span>Goal {item.id}</span>{item.title}</button>)}</nav>}
    <section className={styles.filters} aria-label="Choose data to compare">
      <label>Program<select value={program} disabled={!programs.length} onChange={event => { setProgramChoice(event.target.value); setMeasureChoice(""); setPeriodChoice(""); setEarlierChoice(""); setSelectedGroup(""); }}>{!programs.length && <option value="">No program data</option>}{programs.map(item => <option key={item}>{item}</option>)}</select></label>
      <label>Measure<select value={measureKey} disabled={!measureKeys.length} onChange={event => { setMeasureChoice(event.target.value); setPeriodChoice(""); setEarlierChoice(""); setSelectedGroup(""); }}>{!measureKeys.length && <option value="">No measure data</option>}{measureKeys.map(key => <option key={key} value={key}>{key.split("\u001f")[1]}</option>)}</select></label>
      <label>Reporting period<select value={period} disabled={!periods.length} onChange={event => changePeriod(event.target.value)}>{!periods.length && <option value="">No reporting periods</option>}{periods.map(item => <option key={item}>{item}</option>)}</select></label>
      <label>Compare with<select value={earlierPeriod || "none"} onChange={event => setEarlierChoice(event.target.value)} disabled={!periods.length}><option value="none">No earlier comparison</option>{earlierPeriods.map(item => <option key={item}>{item}</option>)}</select></label>
    </section>

    {!series.length ? <section className={styles.empty}><h3>No data in this view yet</h3><p>{view === "goals" ? "Choose another goal, explore all DHS data, or open a file containing measures for this goal." : "Open a CSV file or a saved working copy to begin. The practice example file shows the format."}</p></section> : <>
      <section className={styles.chartPanel} aria-label="Data comparison">
        <div className={styles.chartHeading}><div><p className={styles.eyebrow}>{program}</p><h3>{series[0]?.measure}</h3><p className={styles.help}>{period}{earlierPeriod ? ` compared with ${earlierPeriod}` : ""}. Rates describe each group separately; groups are not added together.</p></div><div className={styles.viewChoices} role="group" aria-label="Chart view"><button type="button" aria-pressed={chart === "groups"} onClick={() => setChart("groups")}>Compare groups</button><button type="button" aria-pressed={chart === "trend"} onClick={() => setChart("trend")}>Change over time</button></div></div>
        {hasPractice && <p className={styles.practice}>This comparison includes sample data for practice.</p>}
        <div className={styles.legend}><span><i className={styles.currentSwatch} />{period}</span>{chart === "groups" && earlierPeriod && <span><i className={styles.earlierSwatch} />{earlierPeriod}</span>}<span>Scale: 0–100%</span></div>
        {chart === "groups" && <p className={styles.comparisonSummary}>{groupDifference !== null ? `The highest and lowest recorded rates differ by ${groupDifference.toFixed(1)} percentage points across ${visibleRows.length} groups with visible figures. Missing or hidden groups are not included.` : visibleRows.length < 2 ? "At least two groups with visible, comparable figures are needed to describe a difference." : "These figures have different sources or practice contexts. Confirm they are comparable before describing a difference."}</p>}
        {chart === "groups" ? <div className={styles.bars}>{currentRows.map(row => {
          const currentRate = rate(row, minimum); const earlier = earlierFor(row);
          const contextMatches = earlier && earlier.practice === row.practice && row.source.trim() !== "" && earlier.source === row.source;
          const previousRate = contextMatches ? rate(earlier, minimum) : null;
          const previousLabel = earlier && !contextMatches ? "Not comparable" : percentage(previousRate);
          return <button type="button" key={row.id} className={styles.barButton} aria-pressed={focusedGroup === row.group} onClick={() => selectGroup(row.group)} aria-label={`${row.group}, ${period}: ${percentage(currentRate)}${earlierPeriod ? `; ${earlierPeriod}: ${previousLabel}` : ""}. Select to examine this group.`}>
            <span className={styles.groupLabel}>{row.group}{row.practice && <small>Practice</small>}</span><span className={styles.tracks}><span className={styles.track}><span className={styles.plot}><span className={styles.fill} style={{ width: `${currentRate ?? 0}%` }} /></span><span className={styles.value}>{percentage(currentRate)}</span></span>{earlierPeriod && <span className={styles.track}><span className={styles.plot}><span className={styles.earlierFill} style={{ width: `${previousRate ?? 0}%` }} /></span><span className={styles.value}>{previousLabel}</span></span>}</span>
          </button>;
        })}</div> : <div className={styles.trend}>
          <label>Group to follow<select value={focusedGroup} onChange={event => selectGroup(event.target.value)}>{groups.map(groupName => <option key={groupName}>{groupName}</option>)}</select></label>
          <p className={styles.help}>Each bar represents a reporting period for the same group. A change alone does not explain its cause.</p>
          {trendRows.map(row => <button type="button" key={row.id} className={styles.barButton} aria-pressed={row.period === period} onClick={() => changePeriod(row.period)} aria-label={`${row.period}, ${row.group}: ${percentage(rate(row, minimum))}. ${row.practice ? "Sample data for practice." : "Imported data."} Select this reporting period.`}><span className={styles.groupLabel}>{row.period}<small>{row.practice ? "Practice" : "Imported"}</small></span><span className={styles.tracks}><span className={styles.track}><span className={styles.plot}><span className={styles.fill} style={{ width: `${rate(row, minimum) ?? 0}%` }} /></span><span className={styles.value}>{percentage(rate(row, minimum))}</span></span></span></button>)}
        </div>}
        <p className={styles.help}>Select a bar to examine its group or period. Figures may be missing or hidden to reduce the chance of identifying a person.</p>
      </section>

      <section className={styles.detail} aria-label="Selected group detail"><p className={styles.srOnly} role="status">Selected group: {focusedGroup}. {period}: {focusedRow ? percentage(rate(focusedRow, minimum)) : "No observation"}.</p><h3 ref={detailsHeading} tabIndex={-1}>{focusedGroup}</h3>{focusedRow ? <>
        <p className={styles.largeRate}>{percentage(rate(focusedRow, minimum))}<span>{period}</span></p>
        {suppressionReason(focusedRow, minimum) ? <p>{suppressionReason(focusedRow, minimum)}</p> : <p>{focusedRow.numerator} of {focusedRow.denominator} met the measure.</p>}
        {earlierPeriod && <p>{compare(focusedRow).message}</p>}
        <dl><dt>Source</dt><dd>{focusedRow.source || "Not provided"}</dd><dt>Source date</dt><dd>{focusedRow.sourceDate || "Not provided"}</dd><dt>Data type</dt><dd>{focusedRow.practice ? "Sample data for practice" : "Imported data · verify the source before drawing conclusions"}</dd></dl>
      </> : <p>This group has no observation for the selected reporting period. Its earlier figures are available in Change over time.</p>}
        <p className={styles.help}>Consider who is eligible, how groups are defined, and whether the same measure was used in both periods. Differences are a reason to ask questions, not proof of their cause.</p>
      </section>

      <section className={styles.tablePanel} aria-label="Figures behind the chart"><h3>Figures behind the chart</h3><div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Comparison table"><table><caption>{series[0]?.measure} · {period}{earlierPeriod ? ` and ${earlierPeriod}` : ""}</caption><thead><tr><th scope="col">Group</th><th scope="col">Count / total</th><th scope="col">{period}</th>{earlierPeriod && <><th scope="col">{earlierPeriod}</th><th scope="col">Change</th></>}<th scope="col">Source and date</th></tr></thead><tbody>{currentRows.map(row => {
        const hidden = suppressionReason(row, minimum); const comparison = compare(row); const earlier = earlierFor(row);
        return <tr key={row.id}><th scope="row">{row.group}{row.practice && <small className={styles.practiceLabel}>Practice data</small>}</th><td>{hidden ? "Not shown" : `${row.numerator} / ${row.denominator}`}</td><td>{percentage(rate(row, minimum))}{hidden && <small className={styles.reason}>{hidden}</small>}</td>{earlierPeriod && <><td>{earlier ? percentage(rate(earlier, minimum)) : "Missing"}</td><td>{comparison.change === null ? "Cannot compare" : `${comparison.change > 0 ? "+" : ""}${comparison.change.toFixed(1)} percentage points`}</td></>}<td>{row.source || "Not provided"}<small className={styles.reason}>{row.sourceDate || "Date not provided"}</small></td></tr>;
      })}</tbody></table></div></section>

      <section className={styles.followThrough}><h3>From differences to action</h3><p>Use the comparison alongside staff knowledge, community perspectives, and other evidence. Examine the process behind a difference, identify missing information, and record the next step.</p><label>Notes and next steps<textarea value={dataset.notes} onChange={event => updateNotes(event.target.value)} rows={4} maxLength={6000} placeholder="What needs a closer look? What evidence or perspective would help?" /></label><p className={styles.printNotes}>{dataset.notes || "No notes entered."}</p><div className={styles.actions}><Link href="/equity-review/structural">Examine the underlying process</Link><Link href="/consultant/analysis">Open Consultant Workspace</Link><button type="button" onClick={() => exportFile("notes")}>Download analysis notes</button></div><p className={styles.help}>Analysis notes include the comparison and its sources. You can add them to a review without replacing an existing draft.</p></section>
      <section className={styles.exports} aria-label="Share this comparison"><h3>Keep or share the comparison</h3><p>These downloads include the selected program, measure, and reporting periods. Hidden figures stay hidden in the report and comparison file. Review sources and remove sensitive notes before sharing.</p><div className={styles.actions}><button type="button" onClick={() => exportFile("html")}>Download readable report</button><button type="button" onClick={() => exportFile("csv")}>Download comparison file</button><button type="button" onClick={() => window.print()}>Print comparison</button></div></section>
    </>}
  </div>;
}

