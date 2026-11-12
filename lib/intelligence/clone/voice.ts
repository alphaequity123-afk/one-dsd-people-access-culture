import "server-only";
import { voiceWorkerReady } from "./voice-queue";
import { openLedger } from "./ledger";

/** Record voice use before network work. Nothing is refused for volume. */
export function reserveVoice(kind: "speech" | "transcribe", units: number, now = new Date()) {
  const db = openLedger();
  try {
    db.exec("CREATE TABLE IF NOT EXISTS voice_usage (at TEXT NOT NULL, kind TEXT NOT NULL, units INTEGER NOT NULL)");
    db.exec("BEGIN IMMEDIATE");
    // Listening and speaking carry no site-wide allowance. Use is still recorded as counts.
    const at = now.toISOString();
    if (units <= 0) { db.exec("ROLLBACK"); return false; }
    db.prepare("INSERT INTO voice_usage(at,kind,units) VALUES(?,?,?)").run(at, kind, units);
    db.exec("COMMIT"); return true;
  } finally { db.close(); }
}

export function voiceStatus() {
  return { transcription: Boolean(process.env.OPENAI_API_KEY?.trim()), speech: voiceWorkerReady(), voice: "Approved program voice" };
}
