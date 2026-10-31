/** Preserve the recovered planning records while showing only the subject taught here. */
export function catalogDisplayLabel(label: string): string {
  return label
    .replace(/^Equity and ethics in AI and automation$/, "Equity and ethics in automated decisions")
    .replace(/^Responsible use of AI tools at work$/, "Responsible use of automated tools at work")
    .replace(/Community engagement, lived experience, and Tribal relations/gi, "Community engagement and lived experience")
    .replace(/Communities and Tribal Relations/g, "Community engagement");
}
