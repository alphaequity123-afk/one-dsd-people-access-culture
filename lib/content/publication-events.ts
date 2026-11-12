/**
 * A signal that published wording or resources changed on this server, so anything that keeps a
 * short-lived copy (Ask's library) reads the current version next time. Listeners run in order;
 * one that fails does not stop the others or the save that sent the signal.
 */
const listeners = new Set<() => void>();

export function onPublicationChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publicationChanged(): void {
  for (const listener of listeners) {
    try { listener(); } catch { /* a listener's failure must not undo a completed save */ }
  }
}
