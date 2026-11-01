"use client";

import { useEffect, useId, useState } from "react";

/** Reflection notes stay in this browser. They are never sent to the application. */
export function PrivateNotes({ storageKey }: { storageKey: string }) {
  const id = useId();
  const [value, setValue] = useState("");
  useEffect(() => {
    // Restore the selected browser-only note after hydration or a storage-key change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setValue(window.localStorage.getItem(storageKey) ?? ""); } catch { /* Notes simply start empty. */ }
  }, [storageKey]);
  return <div className="research-notes">
    <label htmlFor={id}>Private notes, saved only in this browser</label>
    <textarea id={id} rows={5} value={value} onChange={event => {
      setValue(event.target.value);
      try { window.localStorage.setItem(storageKey, event.target.value); } catch { /* The notes still work for this visit. */ }
    }} />
  </div>;
}
