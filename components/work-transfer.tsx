"use client";
import { useState } from "react";
import { exportWork, importWork, MAX_TRANSFER_BYTES, parseWorkTransfer, type WorkTransfer } from "@/lib/client/work-transfer";

export function WorkTransferControls() {
  const [pending, setPending] = useState<WorkTransfer>();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  function download() {
    setError("");
    try {
      const data = exportWork(window.localStorage);
      if (!data.entries.length) { setMessage("There is no work to download from this browser at this address."); return; }
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url; link.download = "one-dhs-my-work.json"; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Your transfer file is ready. Open this page at the address where you want to use it, then choose the file.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The download could not be prepared."); }
  }
  return <div className="space-y-6">
    <section><h2 className="text-2xl font-bold">Take your work with you</h2>
      <p className="my-3">Download your notes, plans, resource choices and course places from this address.</p>
      <button type="button" className="btn btn--primary" onClick={download}>Download your work</button>
    </section>
    <section><h2 className="text-2xl font-bold">Bring your work here</h2>
      <p className="my-3">Choose the file you downloaded from the other address or browser. Items already here stay as they are; only missing items are added. The file is read on your computer.</p>
      <label htmlFor="work-file">One DHS work transfer file</label>
      <input id="work-file" type="file" accept=".json,application/json" className="block my-3" onChange={async event => {
        setError(""); setMessage(""); setPending(undefined);
        const file = event.target.files?.[0];
        if (!file) return;
        try {
          if (file.size > MAX_TRANSFER_BYTES) throw new Error("Choose a transfer file smaller than 5 MB.");
          setPending(parseWorkTransfer(await file.text()));
        } catch { setError("This file could not be read. Choose a One DHS work transfer file smaller than 5 MB."); }
      }} />
      {pending ? <button type="button" className="btn btn--primary" onClick={() => {
        setError("");
        try {
          const result = importWork(window.localStorage, pending);
          setMessage(`${result.added} items added. ${result.identical} already matched.${result.kept ? ` ${result.kept} items differed; the versions already here were kept. Keep your transfer file to retain the other versions.` : ""} Return to My Work to open them.`);
          setPending(undefined);
        } catch (caught) { setError(caught instanceof Error ? caught.message : "The import could not finish."); }
      }}>Add work from this file</button> : null}
    </section>
    {message ? <p role="status">{message}</p> : null}
    {error ? <p role="alert">{error}</p> : null}
  </div>;
}
