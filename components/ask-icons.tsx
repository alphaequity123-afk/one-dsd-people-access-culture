/**
 * Small line icons for the Ask window. The owner asked for icons here in place of the text buttons
 * (2026-11-11); this is the one place the program uses them. Every button that shows an icon keeps
 * its name as hidden text for screen readers and as a tooltip.
 */
const line = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, focusable: false } as const;

/** Dictate a question. */
export function MicIcon() {
  return <svg {...line}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>;
}
/** Talk with Ask: a spoken conversation. */
export function WaveIcon() {
  return <svg {...line}><path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4" /></svg>;
}
/** Listen to the answer. */
export function SpeakerIcon() {
  return <svg {...line}><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>;
}
/** Finish speaking, or stop reading. */
export function StopIcon() {
  return <svg {...line}><rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" /></svg>;
}
/** Stop and turn the microphone off. */
export function CloseIcon() {
  return <svg {...line}><path d="M6 6l12 12M18 6L6 18" /></svg>;
}
/** Send the question. */
export function SendIcon() {
  return <svg {...line} strokeWidth={2.2}><path d="M12 19V5M6 11l6-6 6 6" /></svg>;
}
