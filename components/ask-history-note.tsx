"use client";

/** The Ask page promises that question history can be reviewed or cleared in My work. This is that place. */
import Link from "@/components/app-link";
import { useHydrated, useStored } from "@/lib/client/storage";
import { BROWSER_STORAGE_KEYS } from "@/lib/client/storage-keys";

// Same empty shape the Ask page uses: the storage layer hands one cached value to every reader of this key.
type StoredAskSession = { id: string; turns: unknown[] };
const EMPTY: StoredAskSession = { id: "", turns: [] };

export function AskHistoryNote() {
  const hydrated = useHydrated();
  const [session, setSession] = useStored<StoredAskSession>("session", BROWSER_STORAGE_KEYS.askSession, EMPTY);
  const count = hydrated && Array.isArray(session?.turns) ? session.turns.length : 0;
  return (
    <section className="dsd-work-card" aria-labelledby="ask-history-title">
      <p className="dsd-eyebrow">Your conversation</p>
      <h2 id="ask-history-title">Your Ask questions</h2>
      <p role="status">
        {count ? `${count} Ask ${count === 1 ? "question" : "questions"} and ${count === 1 ? "its answer" : "their answers"}.` : null}
      </p>
      <p className="flex flex-wrap gap-3">
        <Link className="btn btn--light" href="/ask">{count ? "Review your conversation in Ask" : "Open Ask"}</Link>
        {count ? <button type="button" className="btn btn--light" onClick={() => setSession(null)}>Clear your Ask questions</button> : null}
      </p>
    </section>
  );
}
