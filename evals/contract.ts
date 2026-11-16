/**
 * The contract every eval reports through (design: docs/EVALS-STUDY.md, section 6).
 *
 * Layer A evals check that the application keeps its promises; every A result is reported as DELIVERY evidence and
 * never as a program outcome. Layer B is program evaluation from evidence people choose to keep or share.
 * No eval reads, counts or stores real staff activity: inputs are synthetic or published content only.
 */
export type EvalLayer = "A" | "B";
/** unit: offline, on every change; integration: nightly against a test database; live: on release, within a spend cap. */
export type EvalCadence = "unit" | "integration" | "live";

export type EvalMeasure = {
  name: string;
  /** The value found; a number or a short text. */
  value: number | string;
  /** Human-readable pass bar, for example ">= 0.85" or "0". */
  threshold: string;
  pass: boolean;
  /** Up to a few concrete failures, so a person can act on them. */
  failures?: string[];
};

export type EvalResult = {
  /** A1 ... A13, B1 ... */
  id: string;
  title: string;
  layer: EvalLayer;
  cadence: EvalCadence;
  /** True only when every measure passes. Skipped measures do not pass. */
  passed: boolean;
  measures: EvalMeasure[];
  /** What this run could not check, and why (for example, no database configured). */
  skipped?: string[];
  notes?: string;
};

export type EvalOptions = {
  /** Base URL of a running app for live evals; unit evals ignore it. */
  baseUrl?: string;
  /** Cap on model calls for live evals. */
  maxModelCalls?: number;
};

export type EvalModule = { run: (options: EvalOptions) => Promise<EvalResult> };

export function measure(name: string, value: number | string, threshold: string, pass: boolean, failures: string[] = []): EvalMeasure {
  return { name, value, threshold, pass, ...(failures.length ? { failures: failures.slice(0, 12) } : {}) };
}

export function result(base: Omit<EvalResult, "passed">): EvalResult {
  const passed = base.measures.length > 0 && base.measures.every(m => m.pass);
  return { ...base, passed };
}
