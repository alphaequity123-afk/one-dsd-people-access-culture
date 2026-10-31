const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

// Opaque sRGB palette checks. Run with: node scripts/check-dsd-contrast.cjs
// Text roles use the normal-text minimum even when a heading could qualify as large text.
function luminance(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`Expected an opaque six-digit sRGB color: ${hex}`);
  const linear = hex.slice(1).match(/.{2}/g).map(channel => {
    const s = parseInt(channel, 16) / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrastRatio(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

assert.equal(contrastRatio("#FFFFFF", "#000000"), 21);
assert.equal(contrastRatio("#176B65", "#176B65"), 1);

const palette = [];
const add = (role, foreground, background, kind = "normal-text") => palette.push({ role, foreground, background, kind });
add("Header text", "#FFFFFF", "#003865");
add("Selected navigation text", "#FFFFFF", "#2B4960");
add("Primary button text", "#FFFFFF", "#176B65");
add("Primary button text on hover", "#FFFFFF", "#125953");
for (const foreground of ["#183247", "#182C3A", "#4C606D"]) {
  for (const background of ["#FFF0B8", "#FBF8F0", "#EEF2F5", "#F7F5EF"]) add("Amplify card text", foreground, background);
}
for (const foreground of ["#183247", "#4C606D"]) {
  for (const background of ["#EEF2F5", "#F3F4F4", "#EEEAE3"]) add("Light neutral panel text", foreground, background);
}
for (const background of ["#003865", "#2B4960"]) add("Header focus outline", "#FFFFFF", background, "non-text-ui");
for (const foreground of ["#183247", "#354D5D"]) {
  for (const background of ["#CCD7DF", "#B9C9D5", "#C0CDD7", "#D0D8DE", "#BCC8D1", "#C4CFD7", "#C6D1DA", "#B6C4CF", "#BDC9D3", "#CFD6DB", "#C0C9D0", "#C6CFD5", "#D7D2C9", "#C9C3B9", "#D0CBC2"]) add("Satin card text at gradient stops", foreground, background);
}
for (const background of ["#B9C9D5", "#BCC8D1", "#B6C4CF", "#C0C9D0", "#C9C3B9"]) add("Satin card focus outline", "#003865", background, "non-text-ui");
for (const foreground of ["#183247", "#4C606D"]) {
  for (const background of ["#FFFFFF", "#EEF2F5", "#F7F5EF", "#FBF8F0"]) add("Inner panel text", foreground, background);
}
for (const background of ["#FFFFFF", "#EEF2F5"]) add("Control border", "#677A85", background, "non-text-ui");
for (const background of ["#003865", "#2B4960"]) add("Focus or selected indicator", "#E8BD62", background, "non-text-ui");
add("Focus outline on white", "#003865", "#FFFFFF", "non-text-ui");
for (const background of ["#FFF0B8", "#FBF8F0", "#EEF2F5", "#F7F5EF"]) {
  for (const foreground of ["#182C3A", "#183247", "#4C606D"]) add("Amplify and Team section text", foreground, background);
  add("Amplify and Team keyboard focus", "#003865", background, "non-text-ui");
}
for (const background of ["#EDF1F5", "#EEE9DE", "#F7F5EF", "#E5EDF4", "#E8E8EE", "#F6F2E9", "#FBF8F0", "#F0F4F8", "#F3F3F7", "#E8EEF3", "#F2EDE3", "#F1EADC", "#EAF1F6"]) {
  for (const foreground of ["#183247", "#4C606D"]) add("Interior section text", foreground, background);
  add("Interior keyboard focus", "#003865", background, "non-text-ui");
}
for (const background of ["#E2E7EB", "#D0D8DE", "#E8E4DC", "#D7D2C9"]) {
  for (const foreground of ["#183247", "#354D5D", "#003865"]) add("Program category text at gradient stops", foreground, background);
  add("Program category keyboard focus", "#003865", background, "non-text-ui");
}

const checks = palette.map(pair => {
  const ratio = contrastRatio(pair.foreground, pair.background);
  const minimum = pair.kind === "normal-text" ? 4.5 : 3;
  return {
    ...pair,
    criterion: pair.kind === "normal-text" ? "WCAG 2.2 SC 1.4.3" : "WCAG 2.2 SC 1.4.11",
    minimum,
    ratio,
    ratioLabel: `${ratio.toFixed(2)}:1`,
    passed: ratio >= minimum, // Compare the unrounded ratio; rounding never determines pass/fail.
  };
});
const report = {
  checkedAt: new Date().toISOString(),
  scope: "Opaque sRGB foreground/background pairs for One DSD, including each satin-card gradient stop and the lighter neutral panel palette.",
  method: "WCAG relative luminance and (lighter + 0.05) / (darker + 0.05), evaluated before rounding.",
  sources: [
    "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html",
    "https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html",
    "https://www.w3.org/TR/WCAG22/#dfn-relative-luminance",
  ],
  limitations: [
    "Checks the requested palette, not the computed styles of every rendered page or state.",
    "Satin-card checks cover every opaque gradient stop. These gradients vary monotonically between stops, so an endpoint is the limiting contrast. Image backgrounds, transparency, antialiasing, and overlapping elements are not measured.",
    "Focus visibility, area, obscuration, keyboard interaction, semantics, and other accessibility requirements need separate verification.",
    "This report is not a full WCAG or Section 508 conformance certification.",
  ],
  roleConstraint: "#677A85 is approved here only for borders. Its 4.47:1 contrast on white does not reach the 4.5:1 normal-text minimum.",
  summary: {
    checks: checks.length,
    passed: checks.filter(check => check.passed).length,
    failed: checks.filter(check => !check.passed).length,
    minimumNormalTextRatio: Math.min(...checks.filter(check => check.kind === "normal-text").map(check => check.ratio)),
    minimumUiRatio: Math.min(...checks.filter(check => check.kind === "non-text-ui").map(check => check.ratio)),
  },
  checks,
};
const directory = path.resolve(__dirname, "..", process.env.PAC_AUDIT_OUTPUT_DIR || "evidence/dsd-full-smoke");
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(directory, "contrast-palette.json"), `${JSON.stringify(report, null, 2)}\n`);
console.table(checks.map(({ role, foreground, background, ratioLabel, minimum, passed }) => ({ role, foreground, background, ratio: ratioLabel, minimum, passed })));
console.log(JSON.stringify(report.summary));
process.exitCode = report.summary.failed ? 1 : 0;
