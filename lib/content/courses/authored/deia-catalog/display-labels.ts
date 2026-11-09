/** Preserve the recovered planning records while showing only the subject taught here. */
export function catalogDisplayLabel(label: string): string {
  return label
    .replace(/^Equity and ethics in AI and automation$/, "Equity and ethics in automated decisions")
    .replace(/^Responsible use of AI tools at work$/, "Responsible use of automated tools at work")
    .replace(/Community engagement, lived experience, and Tribal relations/gi, "Community engagement and lived experience")
    .replace(/Communities and Tribal Relations/g, "Community engagement")
    // The program is People, Access and Culture; the DEIA acronym never appears in visible labels.
    .replace(/^Foundations of DEIA at DHS$/, "Foundations of People, Access and Culture at DHS")
    .replace(/^Leading DEIA as systems change, not a one-time event$/, "Leading People, Access and Culture as systems change, not a one-time event")
    .replace(/^Key DEIA terms in plain language$/, "Key People, Access and Culture terms in plain language")
    .replace(/^DEIA at DSD: what it means and why it matters$/, "People, Access and Culture at DSD: what it means and why it matters")
    .replace(/^Staff DEIA$/, "For all staff")
    .replace(/^Leader DEIA$/, "Leadership");
}
