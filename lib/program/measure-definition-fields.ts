export const measureDefinitionFields = [
  {id:"title",label:"Measure name",minimum:5,maximum:240,help:"Name the proposed change you want to understand."},
  {id:"calculation",label:"Calculation, numerator and denominator",minimum:10,maximum:1500,help:"Define each part and unit; explain if a rate or denominator is not appropriate."},
  {id:"population",label:"Population and inclusion rules",minimum:10,maximum:1000,help:"Who or what is included, excluded and missing?"},
  {id:"evidenceSource",label:"Evidence source and access conditions",minimum:10,maximum:1500,help:"Identify the general source, the person or area responsible and any permission still needed; do not enter private data."},
  {id:"period",label:"Period and frequency",minimum:5,maximum:500,help:"Specify the period represented and when another observation would be useful."},
  {id:"comparison",label:"Comparison and interpretation limits",minimum:10,maximum:1500,help:"Define the baseline or comparison; consider coverage, changing definitions, missing data and other explanations."},
  {id:"differencesPrivacy",label:"Group differences and reporting protections",minimum:10,maximum:1500,help:"Explain relevant disaggregation, small groups, suppression, accessibility and approved reporting; record unknowns."},
  {id:"targetReference",label:"Target or approval reference, if one exists",minimum:5,maximum:1500,help:"Record the actual approving role, reference and scope, or say no target is approved. This draft does not establish approval."},
  {id:"reviewReference",label:"Review responsibility and reference",minimum:5,maximum:1500,help:"Who must review this definition? Record any reported review reference and limits, or note review pending."},
  {id:"nextTrigger",label:"Next review trigger",minimum:5,maximum:1000,help:"What change in evidence, service, policy or reporting would require revisiting the definition?"},
] as const;
