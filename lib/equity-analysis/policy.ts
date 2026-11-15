/** Program summary of the DHS equity policy for the Equity Policy page. The official text is linked. */
export const EQUITY_POLICY = {
  title: "DHS Equity Policy",
  effective: "2023-08-04",
  href: "https://mn.gov/dhs/assets/equity-policy_tcm1053-646921.pdf",
  toolkitHref: "https://mn.gov/oeoa/resources/equity-analysis-toolkit/",
  lede: "The policy commits DHS to operate as an antiracist, multicultural and intercultural organization and apply an equity lens throughout its work. Formal equity analysis is required for actions with prolonged or long-term impact that are scheduled for leadership approval. Use the current official Toolkit and User Guide to determine the required analysis or scan.",
  commitments: [
    { name: "Antiracist", body: "The policy connects racial equity with eliminating racial disparities, improving outcomes for everyone and changing systems with measurable effects in the lives of people of color." },
    { name: "Multicultural", body: "Multicultural settings include people from different cultures. In service design, ask whether programs, notices and channels work for the people who use them." },
    { name: "Intercultural", body: "Intercultural practice involves engaging across cultures, understanding differences and commonalities, and adapting. Ask whose perspective shaped a process and what people need to use it." },
  ],
  asks: [
    "Apply an equity lens to decisions, budgets, hires, technology changes, contracts, and service design.",
    "Use the current official Equity Analysis Toolkit and User Guide to determine the required review. A short timeline alone does not establish that an equity scan is sufficient.",
    "Identify who benefits and who bears burdens. Examine evidence with affected people, then name the responsible role and agree when to review the decision.",
    "Route civil rights, Tribal consultation, and labor relations through their formal paths. The toolkit does not replace them.",
  ],
} as const;
