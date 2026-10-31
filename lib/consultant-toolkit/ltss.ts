const ROOT = "https://mn.gov/dhs/partners-and-providers/news-initiatives-reports-workgroups/long-term-services-and-supports/public-planning-performance-reporting/";

/** Official source entry points checked 2026-10-15; these are not a downloaded dataset. */
export const LTSS_RESOURCES = [
  { id: "ltss-demographics", title: "Who uses LTSS", url: ROOT + "performance-reports/demographic-dashboard/", description: "Explore program demographics and changes over time, including county comparisons.", downloadUrl: "https://mn.gov/dhs/assets/LTSS%20Program%20Demographics_tcm1053-631765.xlsx" },
  { id: "ltss-performance", title: "LTSS performance measures", url: ROOT + "performance-reports/performance-measures-dashboard/", description: "Find measures of community services, spending and employment.", downloadUrl: "https://mn.gov/dhs/assets/LTSS-Performance-Measures_tcm1053-492103.xlsx" },
  { id: "ltss-definitions", title: "Understand the measures", url: ROOT + "performance-reports-glossary/", description: "Check the population, time period and denominator before comparing results." },
] as const;

export const LTSS_GUIDANCE = [
  "The LTSS dashboards are relevant evidence sources, not a dataset already loaded into this analysis. Use actual supplied rows or figures for numeric claims and identify missing data explicitly.",
  "For each comparison record the measure, unit, reporting period, program, population, geography, source, extraction date, filters, numerator and denominator where available. Preserve the distinction between a January snapshot and annual fiscal-year measures.",
  "Service-use differences relative to the overall population do not alone establish unmet need, unequal access or causation. Consider eligibility, support needs, program definitions and people's experiences; ask for needed evidence.",
  "Preserve suppressed, missing, unknown and unavailable values; never replace them with zero or infer suppressed values. Do not infer any person's race, disability or other identity from aggregate figures.",
  "Compare like measures and periods. Explain percentage-point differences separately from relative percent changes and show the supplied operands. Do not treat historical projections or an old dashboard description as current observed results.",
  "Use community engagement alongside quantitative evidence, with actual documented participation and perspectives distinguished from proposed engagement. Keep baseline, intended result and observed change separate.",
] as const;
