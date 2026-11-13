"use client";
import { SourceLink } from "@/components/app-link";


import { useId, useMemo, useState } from "react";
import type { CatalogKind, CatalogPolicy } from "./labels";
import styles from "./policy-analysis.module.css";

export type PolicyChoice =
  | { mode: "catalog"; catalogId: string }
  | { mode: "other"; title: string; url: string };

const SHOWN = 40;

function matches(policy: CatalogPolicy, words: string[]): boolean {
  if (!words.length) return true;
  const text = [policy.title, policy.summary, ...policy.programs, ...policy.tags].join(" ").toLocaleLowerCase("en-US");
  return words.every(word => text.includes(word));
}

/** Step 1: choose a catalog policy, or name one that is not in the catalog. */
export function PolicyPicker({ catalog, kinds, choice, onChoose, locked, busy, officialTextAdded, onGetOfficialText }: {
  catalog: CatalogPolicy[];
  kinds: CatalogKind[];
  choice: PolicyChoice | null;
  onChoose: (choice: PolicyChoice | null) => void;
  locked: boolean;
  busy: boolean;
  officialTextAdded: boolean;
  onGetOfficialText: (catalogId: string) => void;
}) {
  const ids = useId();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const words = useMemo(() => query.toLocaleLowerCase("en-US").split(/\s+/).filter(Boolean), [query]);
  const results = useMemo(() => catalog.filter(item => (!kind || item.kind === kind) && matches(item, words)), [catalog, kind, words]);
  const selected = choice?.mode === "catalog" ? catalog.find(item => item.id === choice.catalogId) ?? null : null;
  const mode = choice?.mode ?? "catalog";

  if (locked) {
    return (
      <section className={styles.step} aria-labelledby={`${ids}-title`}>
        <span className={styles.stepNumber}>Step 1</span>
        <h2 id={`${ids}-title`}>The policy</h2>
        {selected ? <SelectedPolicy policy={selected} /> : choice?.mode === "other" ? (
          <p className="m-0"><strong>{choice.title}</strong>{choice.url ? <> · <SourceLink href={choice.url}>Source</SourceLink></> : null}</p>
        ) : null}
        <p className={`${styles.muted} mb-0`}>To analyze a different policy, start a new analysis from the saved analyses list.</p>
      </section>
    );
  }

  return (
    <section className={styles.step} aria-labelledby={`${ids}-title`}>
      <span className={styles.stepNumber}>Step 1</span>
      <h2 id={`${ids}-title`}>Choose the policy</h2>
      <fieldset className="m-0 border-0 p-0">
        <legend className="sr-only">Where the policy comes from</legend>
        <div className={styles.row}>
          <label className={styles.row}>
            <input type="radio" name={`${ids}-mode`} checked={mode === "catalog"} onChange={() => onChoose(null)} />
            A policy from the catalog of policies that shape disability services
          </label>
          <label className={styles.row}>
            <input type="radio" name={`${ids}-mode`} checked={mode === "other"} onChange={() => onChoose({ mode: "other", title: "", url: "" })} />
            A policy that is not in the catalog
          </label>
        </div>
      </fieldset>

      {mode === "other" && choice?.mode === "other" ? (
        <div className="mt-3">
          <div className="field">
            <label htmlFor={`${ids}-other-title`}>Policy title</label>
            <input id={`${ids}-other-title`} type="text" maxLength={300} value={choice.title} onChange={event => onChoose({ ...choice, title: event.target.value })} required />
          </div>
          <div className="field">
            <label htmlFor={`${ids}-other-url`}>Link to the policy (optional)</label>
            <p className="help m-0" id={`${ids}-other-url-help`}>The full web address, starting with https://</p>
            <input id={`${ids}-other-url`} type="url" maxLength={2048} aria-describedby={`${ids}-other-url-help`} value={choice.url} onChange={event => onChoose({ ...choice, url: event.target.value })} />
          </div>
          <p className={`${styles.muted} m-0`}>Add the policy text in step 2 by attaching the document or pasting it.</p>
        </div>
      ) : selected ? (
        <div className="mt-3">
          <SelectedPolicy policy={selected} />
          <div className={`${styles.item} mt-3`}>
            <p className="m-0">The catalog entry is a summary written in plain language. The official text makes the analysis exact, because quotations and wording changes are taken from it.</p>
            <div className={`${styles.row} mt-2`}>
              <button type="button" className="btn btn--light" disabled={busy || officialTextAdded} onClick={() => onGetOfficialText(selected.id)}>
                {officialTextAdded ? "Official text added" : busy ? "Getting the official text…" : "Get the official text"}
              </button>
              <button type="button" className={styles.linkButton} disabled={busy} onClick={() => onChoose(null)}>Choose a different policy</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3" role="search">
          <div className={`${styles.row} items-end`}>
            <div className="field m-0" style={{ flex: "2 1 16rem" }}>
              <label htmlFor={`${ids}-search`}>Search the catalog</label>
              <input id={`${ids}-search`} className={styles.input} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="For example: waiver, interpreter, assessment" />
            </div>
            <div className="field m-0" style={{ flex: "1 1 12rem" }}>
              <label htmlFor={`${ids}-kind`}>Kind of policy</label>
              <select id={`${ids}-kind`} value={kind} onChange={event => setKind(event.target.value)}>
                <option value="">Every kind</option>
                {kinds.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </div>
          </div>
          <p className={`${styles.muted} mt-2 mb-2`} role="status">
            {results.length === 0 ? "No policies match. Try fewer words, or choose a policy that is not in the catalog." : results.length > SHOWN ? `Showing the first ${SHOWN} of ${results.length} matching policies. Add words to narrow the list.` : `${results.length} matching ${results.length === 1 ? "policy" : "policies"}.`}
          </p>
          <ul className={`${styles.list} ${styles.pickerList}`} aria-label="Matching policies">
            {results.slice(0, SHOWN).map(item => (
              <li key={item.id} className={styles.item}>
                <button type="button" className={styles.choice} onClick={() => onChoose({ mode: "catalog", catalogId: item.id })}>
                  <span className={styles.choiceTitle}>{item.title}</span>
                  <span className={`${styles.muted} block`}>{item.kindLabel}{item.programs.length ? ` · ${item.programs.slice(0, 3).join(", ")}${item.programs.length > 3 ? " and others" : ""}` : ""}</span>
                  <span className="sr-only">. Choose this policy</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function SelectedPolicy({ policy }: { policy: CatalogPolicy }) {
  return (
    <div className={`${styles.item} ${styles.selected}`}>
      <p className="kicker m-0">{policy.kindLabel}</p>
      <p className={`${styles.choiceTitle} m-0`}>{policy.title}</p>
      <p className="mt-2 mb-0">{policy.summary}</p>
      <dl className={styles.facts}>
        <dt>Source</dt>
        <dd><SourceLink href={policy.sourceUrl}>{policy.sourceTitle}</SourceLink>{policy.sourceDate ? ` (${policy.sourceDate})` : ""}</dd>
        {policy.programs.length ? <><dt>Programs</dt><dd>{policy.programs.join(", ")}</dd></> : null}
      </dl>
    </div>
  );
}
