import "server-only";
import { voiceWorkerReady } from "./voice-queue";
import { openLedger } from "./ledger";

/** Reserve before network work, so concurrent requests and failures still count. */
export function reserveVoice(kind: "speech" | "transcribe", units: number, now = new Date()) {
  const db = openLedger();
  try {
    db.exec("CREATE TABLE IF NOT EXISTS voice_usage (at TEXT NOT NULL, kind TEXT NOT NULL, units INTEGER NOT NULL)");
    db.exec("BEGIN IMMEDIATE");
    const total = (since: string) => Number((db.prepare("SELECT coalesce(sum(units),0) AS n FROM voice_usage WHERE kind=? AND at>=?").get(kind, since) as { n: number }).n);
    const at = now.toISOString();
    const daily = kind === "speech" ? 20000 : 60;
    const monthly = kind === "speech" ? 100000 : 300;
    if (units <= 0 || total(at.slice(0, 10)) + units > daily || total(at.slice(0, 7)) + units > monthly) { db.exec("ROLLBACK"); return false; }
    db.prepare("INSERT INTO voice_usage(at,kind,units) VALUES(?,?,?)").run(at, kind, units);
    db.exec("COMMIT"); return true;
  } finally { db.close(); }
}

export function voiceStatus() {
  return { transcription: Boolean(process.env.OPENAI_API_KEY?.trim()), speech: voiceWorkerReady(), voice: "Geffen" };
}
